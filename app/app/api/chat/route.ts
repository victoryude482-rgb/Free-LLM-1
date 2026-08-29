import { NextRequest } from 'next/server'

export async function POST(req:NextRequest){
 const body=await req.json(); const messages=Array.isArray(body.messages)?body.messages:[]
 const provider=process.env.AI_PROVIDER||'groq'; const model=process.env.AI_MODEL||'llama-3.3-70b-versatile'
 if(provider!=='groq') return new Response(JSON.stringify({error:`Unsupported provider: ${provider}`}),{status:400,headers:{'content-type':'application/json'}})
 if(!process.env.GROQ_API_KEY) return new Response(JSON.stringify({error:'GROQ_API_KEY is not configured'}),{status:500,headers:{'content-type':'application/json'}})
 const upstream=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.GROQ_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages,stream:true})})
 if(!upstream.ok) return new Response(await upstream.text(),{status:upstream.status,headers:{'content-type':upstream.headers.get('content-type')||'application/json'}})
 return new Response(upstream.body,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'}})
}
