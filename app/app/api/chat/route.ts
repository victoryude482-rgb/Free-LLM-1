import {NextRequest} from 'next/server'

export async function POST(req:NextRequest){
 const body=await req.json();const messages=Array.isArray(body.messages)?body.messages:[];const provider=process.env.AI_PROVIDER||'groq';const model=body.model||process.env.AI_MODEL||'llama-3.3-70b-versatile'
 if(provider!=='groq')return Response.json({error:`Unsupported provider: ${provider}`},{status:400})
 if(!process.env.GROQ_API_KEY)return Response.json({error:'GROQ_API_KEY is not configured. Add it to app/.env.local and restart the server.'},{status:500})
 try{const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.GROQ_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages,stream:true})})
  if(!response.ok){const error=await response.text();return new Response(error,{status:response.status,headers:{'Content-Type':'application/json'}})}
  return new Response(response.body,{status:response.status,headers:{'Content-Type':response.headers.get('content-type')||'text/event-stream','Cache-Control':'no-cache, no-transform'}})
 }catch{return Response.json({error:'Unable to reach the AI provider. Check your connection and try again.'},{status:502})}
}
