import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {URL} from 'node:url';
const PORT=process.env.PORT||10000;
const root=process.cwd();
function json(res,status,data){res.writeHead(status,{'content-type':'application/json','access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization,mcp-session-id','access-control-allow-methods':'GET,POST,OPTIONS'});res.end(JSON.stringify(data));}
function body(req){return new Promise((resolve,reject)=>{let b='';req.on('data',c=>{b+=c;if(b.length>2e6)req.destroy();});req.on('end',()=>{try{resolve(b?JSON.parse(b):{})}catch(e){reject(e)}});req.on('error',reject)})}
function allowed(u){try{const x=new URL(u);return x.protocol==='https:'||x.protocol==='http:'}catch{return false}}
async function proxy(url,options={}){if(!allowed(url))throw new Error('MCP endpoint must be a valid HTTP(S) URL');const r=await fetch(url,{...options,redirect:'manual',signal:AbortSignal.timeout(20000)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={text}}return {status:r.status,headers:Object.fromEntries(r.headers),data}}
const server=http.createServer(async(req,res)=>{if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization,mcp-session-id','access-control-allow-methods':'GET,POST,OPTIONS'});return res.end()}
try{const u=new URL(req.url,'http://localhost');
if(u.pathname==='/health')return json(res,200,{ok:true,service:'free-llm-hub'});
if(u.pathname==='/api/chat'&&req.method==='POST'){const x=await body(req);if(!x.baseUrl||!x.apiKey||!x.model) return json(res,400,{error:'baseUrl, apiKey and model are required'});const endpoint=x.baseUrl.replace(/\/$/,'')+'/chat/completions';const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${x.apiKey}`},body:JSON.stringify({model:x.model,messages:x.messages||[{role:'user',content:x.prompt||''}],temperature:x.temperature??0.2}),signal:AbortSignal.timeout(60000)});const data=await r.json();return json(res,r.status,data)}
if(u.pathname==='/api/mcp'&&req.method==='POST'){const x=await body(req);if(!x.url)return json(res,400,{error:'MCP URL is required'});const headers={'content-type':'application/json',accept:'application/json, text/event-stream'};if(x.sessionId)headers['mcp-session-id']=x.sessionId;if(x.authorization)headers.authorization=x.authorization;const out=await proxy(x.url,{method:'POST',headers,body:JSON.stringify(x.request||{})});return json(res,out.status,{status:out.status,headers:out.headers,data:out.data})}
if(u.pathname==='/taskmaster' || u.pathname==='/taskmaster/') {res.writeHead(200,{'content-type':'text/html; charset=utf-8'});return fs.createReadStream(path.join(root,'web','taskmaster.html')).pipe(res)}
let file=u.pathname==='/'?'web/index.html':u.pathname.replace(/^\//,'');if(file.includes('..'))return json(res,400,{error:'bad path'});const p=path.join(root,file);if(fs.existsSync(p)&&fs.statSync(p).isFile()){const ext=path.extname(p);const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};res.writeHead(200,{'content-type':types[ext]||'text/plain'});return fs.createReadStream(p).pipe(res)}return json(res,404,{error:'not found'});
}catch(e){return json(res,500,{error:e.message})}});
server.listen(PORT,'0.0.0.0',()=>console.log(`Free LLM Hub listening on ${PORT}`));
