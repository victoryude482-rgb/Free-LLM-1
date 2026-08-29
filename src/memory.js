export class MemoryStore {
  constructor(adapter = null) { this.adapter = adapter; this.local = new Map(); }
  async put(memory) { const item={id:memory.id||crypto.randomUUID(),text:memory.text,scope:memory.scope||'project',tags:memory.tags||[],updatedAt:new Date().toISOString()}; if(this.adapter?.put) return this.adapter.put(item); this.local.set(item.id,item); return item; }
  async list(scope) { const values=[...this.local.values()]; return scope ? values.filter(x=>x.scope===scope) : values; }
  async search(query,scope) { const q=query.toLowerCase(); return (await this.list(scope)).filter(x=>`${x.text} ${(x.tags||[]).join(' ')}`.toLowerCase().includes(q)); }
  async remove(id) { if(this.adapter?.remove) return this.adapter.remove(id); this.local.delete(id); }
  async clear(scope) { for(const x of await this.list(scope)) await this.remove(x.id); }
}
