export async function mcpRequest(url, request, {token,sessionId}={}) {
  const headers={'content-type':'application/json','accept':'application/json, text/event-stream'};
  if(token) headers.authorization=`Bearer ${token}`;
  if(sessionId) headers['mcp-session-id']=sessionId;
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(request),signal:AbortSignal.timeout(30000)});
  const text=await response.text(); let data; try{data=JSON.parse(text)}catch{data={text}};
  if(!response.ok) { const e=new Error(data?.error?.message||`MCP HTTP ${response.status}`); e.status=response.status; throw e; }
  return {data,sessionId:response.headers.get('mcp-session-id')||sessionId};
}
export const MCP_METHODS={initialize:'initialize',listTools:'tools/list',callTool:'tools/call'};
