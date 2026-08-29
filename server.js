import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {URL} from 'node:url';
import {LLMRouter} from './src/router.js';
import {TASKMASTER_SYSTEM,AGENTS,buildPlan,assignAgents,readyTasks} from './src/taskmaster.js';
const PORT=process.env.PORT||10000,root=process.cwd(),router=new LLMRouter(),memories=new Map();
const send=(res,s,d,h={})=>{res.writeHead(s,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...h});res.end(JSON.stringify(d))};
const body=req=>new Promise((ok,bad)=>{let b='';req.on('data',c=>{b+=c;if(b.length>4e6)req.destroy()});req.on('end',()=>{try{ok(b?JSON.parse(b):{})}catch(e){bad(e)}});req.on('error',bad)});
async function callProvider(p,rq){const base=(p.baseUrl||'').replace(/\/$/,'');if(!base||!p.apiKey||!p.model)throw new Error(`Provider ${p.name||p.id} is not configured`);const r=await fetch(base+'/chat/completions',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${p.apiKey}`},body:JSON.stringify({model:p.model,messages:rq.messages||[{role:'user',content:rq.prompt||''}],temperature:rq.temperature??0.2}),signal:AbortSignal.timeout(rq.timeout||60000)});const t=await r.text();let d;try{d=JSON.parse(t)}catch{d={error:{message:t}}}if(!r.ok){const e=new Error(d?.error?.message||`Provider HTTP ${r.status}`);e.status=r.status;throw e}return d}
const server=http.createServer(async(req,res)=>{if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'GET,POST,DELETE,OPTIONS'});return res.end()}try{const u=new URL(req.url,'http://localhost');
if(u.pathname==='/health')return send(res,200,{ok:true,service:'cognexa'});
if(u.pathname==='/api/chat'&&req.method==='POST'){const x=await body(req),ps=x.providers||[];if(!ps.length)return send(res,400,{error:'No configured providers'});router.providers=ps;const selected=ps.find(p=>p.id===x.providerId)||ps[0];const result=await router.chat({provider:selected,task:x.task||{},messages:x.messages,prompt:x.prompt,temperature:x.temperature},callProvider);return send(res,200,{...result,provider:{id:result.provider.id,name:result.provider.name,model:result.provider.model}})}
if(u.pathname==='/api/memory'&&req.method==='GET')return send(res,200,{memories:[...memories.values()]});
if(u.pathname==='/api/memory'&&req.method==='POST'){const x=await body(req);if(!x.text)return send(res,400,{error:'text required'});const m={id:x.id||crypto.randomUUID(),text:x.text,scope:x.scope||'project',tags:x.tags||[],updatedAt:new Date().toISOString()};memories.set(m.id,m);return send(res,201,m)}
if(u.pathname.startsWith('/api/memory/')&&req.method==='DELETE'){memories.delete(u.pathname.split('/').pop());return send(res,200,{ok:true})}
if(u.pathname==='/api/plan'&&req.method==='POST'){const x=await body(req),ps=x.providers||[];if(!x.goal||!ps.length)return send(res,400,{error:'Goal and an LLM provider are required'});router.providers=ps;const r=await router.chat({provider:ps.find(p=>p.id===x.providerId)||ps[0],task:{capabilities:['coding']},messages:[{role:'system',content:TASKMASTER_SYSTEM+`\nAgents: ${AGENTS.map(a=>a.name+': '+a.role).join('; ')}\nReturn ONLY valid JSON array.`},{role:'user',content:x.goal}]},callProvider);let raw=r.choices?.[0]?.message?.content||'[]';raw=raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();let tasks;try{tasks=assignAgents(JSON.parse(raw))}catch{tasks=buildPlan([{title:'Review planner output',detail:raw,priority:'high'}])}return send(res,200,{tasks,provider:{id:r.provider.id,name:r.provider.name,model:r.provider.model}})}
if(u.pathname==='/api/task-ready'&&req.method==='POST'){const x=await body(req);return send(res,200,{ready:readyTasks(buildPlan(x.tasks||[]))})}
if(u.pathname==='/taskmaster'||u.pathname==='/taskmaster/')return fs.createReadStream(path.join(root,'web','taskmaster.html')).pipe(res);
if(u.pathname==='/')return fs.createReadStream(path.join(root,'web','index.html')).pipe(res);
return send(res,404,{error:'not found'});
}catch(e){return send(res,e.status>=400&&e.status<600?e.status:500,{error:e.message})}});server.listen(PORT,'0.0.0.0',()=>console.log(`Cognexa listening on ${PORT}`));
