'use client'

import {FormEvent, KeyboardEvent, useEffect, useRef, useState} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Role='user'|'assistant'|'system'
type Message={role:Role;content:string}
type Chat={id:string;title:string;messages:Message[];updatedAt:number}

const CHATS_KEY='cognexa-chats'
const SYSTEM_KEY='cognexa-system-prompt'

function Icon({name,size=18}:{name:string;size?:number}){
 const paths:Record<string,React.ReactNode>={
  plus:<><path d="M12 5v14M5 12h14"/></>, menu:<><path d="M4 7h16M4 12h16M4 17h16"/></>,
  send:<path d="m22 2-7 20-4-9-9-4Z"/>, close:<><path d="M18 6 6 18M6 6l12 12"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.02 2.02-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.86v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.02-2.02.06-.06A1.7 1.7 0 0 0 7.36 15a1.7 1.7 0 0 0-1.56-1.03H5.7v-2.86h.1A1.7 1.7 0 0 0 7.36 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.02-2.02.06.06A1.7 1.7 0 0 0 10.92 6a1.7 1.7 0 0 0 1.03-1.56V4.3h2.86v.14A1.7 1.7 0 0 0 15.84 6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.02 2.02-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03h.14v2.86h-.14A1.7 1.7 0 0 0 19.4 15Z"/></>,
  edit:<><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>, trash:<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></>,
  copy:<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>, check:<path d="m5 12 4 4L19 6"/>
 }
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function Home(){
 const [chats,setChats]=useState<Chat[]>([]),[active,setActive]=useState(''),[input,setInput]=useState(''),[loading,setLoading]=useState(false)
 const [system,setSystem]=useState('You are Cognexa, a thoughtful, practical AI assistant. Be clear, accurate, and helpful.')
 const [model,setModel]=useState('llama-3.3-70b-versatile'),[models,setModels]=useState<string[]>([]),[settings,setSettings]=useState(false),[sidebar,setSidebar]=useState(false),[copied,setCopied]=useState<number|null>(null)
 const controller=useRef<AbortController|null>(null), endRef=useRef<HTMLDivElement|null>(null), inputRef=useRef<HTMLTextAreaElement|null>(null)
 const chat=chats.find(item=>item.id===active)

 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(CHATS_KEY)||'[]');setChats(saved);if(saved[0])setActive(saved[0].id);setSystem(localStorage.getItem(SYSTEM_KEY)||system)}catch{};fetch('/api/models').then(r=>r.json()).then(data=>{setModels(data.models||[]);setModel(data.model||'llama-3.3-70b-versatile')}).catch(()=>{})},[])
 useEffect(()=>{localStorage.setItem(CHATS_KEY,JSON.stringify(chats))},[chats])
 useEffect(()=>{localStorage.setItem(SYSTEM_KEY,system)},[system])
 useEffect(()=>{endRef.current?.scrollIntoView({behavior:loading?'smooth':'auto'})},[chat?.messages,loading])

 function newChat(){const next:Chat={id:crypto.randomUUID(),title:'New conversation',messages:[],updatedAt:Date.now()};setChats(items=>[next,...items]);setActive(next.id);setInput('');setSidebar(false);setTimeout(()=>inputRef.current?.focus(),0)}
 function updateChat(id:string,fn:(chat:Chat)=>Chat){setChats(items=>items.map(item=>item.id===id?fn(item):item).sort((a,b)=>b.updatedAt-a.updatedAt))}
 function rename(id:string){const item=chats.find(c=>c.id===id);const title=window.prompt('Rename conversation',item?.title);if(title?.trim())updateChat(id,c=>({...c,title:title.trim(),updatedAt:Date.now()}))}
 function remove(id:string){const remaining=chats.filter(c=>c.id!==id);setChats(remaining);if(active===id)setActive(remaining[0]?.id||'')}
 function choosePrompt(text:string){setInput(text);setTimeout(()=>inputRef.current?.focus(),0)}
 async function send(event?:FormEvent){event?.preventDefault();const text=input.trim();if(!text||loading)return
  let target=chat
  if(!target){target={id:crypto.randomUUID(),title:text.slice(0,48),messages:[],updatedAt:Date.now()};setChats(items=>[target!,...items]);setActive(target.id)}
  const messages=[...target.messages,{role:'user' as const,content:text}];setInput('');updateChat(target.id,item=>({...item,title:item.messages.length?item.title:text.slice(0,48),messages:[...messages,{role:'assistant',content:''}],updatedAt:Date.now()}));setLoading(true)
  controller.current=new AbortController()
  try{const response=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},signal:controller.current.signal,body:JSON.stringify({model,messages:[{role:'system',content:system},...messages]})})
   if(!response.ok){const data=await response.json().catch(()=>null);throw new Error(data?.error||data?.message||'The model could not respond.')}
   if(!response.body)throw new Error('No response stream was received.')
   const reader=response.body.getReader(), decoder=new TextDecoder();let answer='',buffer=''
   while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()||'';for(const line of lines){if(!line.startsWith('data: ')||line.trim()==='data: [DONE]')continue;try{answer+=JSON.parse(line.slice(6)).choices?.[0]?.delta?.content||''}catch{}}
    updateChat(target.id,item=>({...item,messages:item.messages.map((message,index)=>index===item.messages.length-1?{...message,content:answer}:message),updatedAt:Date.now()}))}
  }catch(error){if((error as Error).name!=='AbortError'){const message=error instanceof Error?error.message:'Request failed';updateChat(target.id,item=>({...item,messages:item.messages.map((m,i)=>i===item.messages.length-1?{...m,content:`**Something went wrong**\n\n${message}`}:m)}))}}
  finally{setLoading(false);controller.current=null}
 }
 function stop(){controller.current?.abort();controller.current=null;setLoading(false)}
 function keyDown(event:KeyboardEvent<HTMLTextAreaElement>){if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();send()}}
 async function copy(text:string,index:number){await navigator.clipboard.writeText(text);setCopied(index);setTimeout(()=>setCopied(null),1800)}

 const Sidebar=()=> <aside className="sidebar"><div className="brand"><span className="brand-mark">C</span><span>Cognexa</span><button aria-label="Close sidebar" className="icon-button mobile-only" onClick={()=>setSidebar(false)}><Icon name="close"/></button></div><button className="new-chat" onClick={newChat}><Icon name="plus"/> New conversation <kbd>⌘ K</kbd></button><div className="history-label">Recent conversations</div><nav className="chat-history">{chats.map(item=><div className={`history-item ${item.id===active?'selected':''}`} key={item.id}><button onClick={()=>{setActive(item.id);setSidebar(false)}}>{item.title}</button><span className="history-actions"><button aria-label="Rename conversation" onClick={()=>rename(item.id)}><Icon name="edit" size={15}/></button><button aria-label="Delete conversation" onClick={()=>remove(item.id)}><Icon name="trash" size={15}/></button></span></div>)}</nav><div className="sidebar-footer"><button onClick={()=>setSettings(true)}><Icon name="settings" size={17}/> Customize Cognexa</button><p>Powered by your own AI provider</p></div></aside>
 const starters=[['Plan something','Build a thoughtful 3-day itinerary for a new city.'],['Learn a topic','Explain a difficult topic simply, then quiz me.'],['Write and refine','Help me write a clear, friendly email.'],['Solve a problem','Help me break down a problem step by step.']]

 return <div className="app-shell"><div className="desktop-sidebar"><Sidebar/></div>{sidebar&&<div className="sidebar-overlay" onClick={()=>setSidebar(false)}><div onClick={e=>e.stopPropagation()}><Sidebar/></div></div>}
  <main className="conversation"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open sidebar" onClick={()=>setSidebar(true)}><Icon name="menu"/></button><button className="model-control" onClick={()=>setSettings(true)}>{model.replace('llama-','Llama ').replace('-versatile','')} <span>⌄</span></button></div><button className="icon-button" aria-label="Open settings" onClick={()=>setSettings(true)}><Icon name="settings" size={19}/></button></header>
   <section className="messages">{!chat?.messages.length?<div className="welcome"><div className="welcome-orb">✦</div><h1>What can I help with?</h1><p>Cognexa is ready to think, write, explore, and create with you.</p><div className="prompt-grid">{starters.map(([title,prompt])=><button key={title} onClick={()=>choosePrompt(prompt)}><strong>{title}</strong><span>{prompt}</span><b>↗</b></button>)}</div></div>:<div className="message-list">{chat.messages.map((message,index)=><article className={`message ${message.role}`} key={index}><div className="avatar">{message.role==='user'?'Y':'✦'}</div><div className="message-body"><div className="message-name">{message.role==='user'?'You':'Cognexa'}</div><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content||'Thinking…'}</ReactMarkdown></div>{message.role==='assistant'&&message.content&&<button className="copy-button" onClick={()=>copy(message.content,index)}>{copied===index?<><Icon name="check" size={14}/> Copied</>:<><Icon name="copy" size={14}/> Copy</>}</button>}</div></article>)}<div ref={endRef}/></div>}</section>
   <div className="composer-wrap"><form className="composer" onSubmit={send}><textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={keyDown} placeholder="Message Cognexa" rows={1} aria-label="Message Cognexa"/><div className="composer-bottom"><span>Enter to send <i>•</i> Shift + Enter for new line</span>{loading?<button type="button" className="stop-button" onClick={stop}><span/> Stop generating</button>:<button className="send-button" disabled={!input.trim()} aria-label="Send message"><Icon name="send" size={17}/></button>}</div></form><p className="disclaimer">Cognexa can make mistakes. Verify important information.</p></div>
  </main>{settings&&<div className="settings-overlay" onClick={()=>setSettings(false)}><section className="settings-panel" onClick={e=>e.stopPropagation()}><header><div><p>Preferences</p><h2>Customize Cognexa</h2></div><button className="icon-button" onClick={()=>setSettings(false)} aria-label="Close settings"><Icon name="close"/></button></header><label>Model<select value={model} onChange={e=>setModel(e.target.value)}>{models.map(item=><option key={item} value={item}>{item}</option>)}</select><small>Choose the model used for new responses.</small></label><label>How should Cognexa respond?<textarea value={system} onChange={e=>setSystem(e.target.value)} /><small>This instruction is saved privately in this browser and included in your conversations.</small></label><div className="settings-note"><span>✦</span><p><strong>Personalized, not trained.</strong> Your preferences guide Cognexa&apos;s replies; they do not train the underlying model.</p></div></section></div>}</div>
}
