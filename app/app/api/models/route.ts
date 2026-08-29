import {NextResponse} from 'next/server'
export async function GET(){return NextResponse.json({provider:process.env.AI_PROVIDER||'groq',model:process.env.AI_MODEL||'llama-3.3-70b-versatile',models:['llama-3.3-70b-versatile','llama-3.1-8b-instant','openai/gpt-oss-120b','openai/gpt-oss-20b']})}
