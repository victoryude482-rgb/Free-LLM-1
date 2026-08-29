export class LLMRouter {
  constructor(providers = []) { this.providers = providers; this.health = new Map(); }
  score(p, task = {}) {
    const h = this.health.get(p.id) || {};
    const fail = h.failures || 0;
    const latency = h.latency || 0;
    const capability = (p.capabilities || []).filter(x => (task.capabilities || []).includes(x)).length;
    return capability * 1000 + (p.priority || 0) * 10 - fail * 500 - latency / 100;
  }
  alternatives(current, task) { return this.providers.filter(p => p.id !== current?.id && p.enabled !== false).sort((a,b) => this.score(b,task)-this.score(a,task)); }
  record(id, ok, latency) { const h=this.health.get(id)||{failures:0}; h.latency=latency; h.lastUsed=Date.now(); h.failures=ok?Math.max(0,h.failures-1):h.failures+1; this.health.set(id,h); }
  async chat(request, transport) {
    const candidates=[request.provider,...this.alternatives(request.provider, request.task)].filter(Boolean);
    let last;
    for (const p of candidates) {
      const started=Date.now();
      try { const result=await transport(p,request); this.record(p.id,true,Date.now()-started); return {...result,provider:p}; }
      catch(e){ this.record(p.id,false,Date.now()-started); last=e; if(!this.isRetryable(e)) break; }
    }
    throw last || new Error('No available LLM provider');
  }
  isRetryable(e) { const s=String(e?.status||e?.code||''); return ['408','409','425','429','500','502','503','504'].includes(s) || /rate.?limit|quota|timeout|temporar|overload|unavailable/i.test(String(e?.message||e)); }
}
