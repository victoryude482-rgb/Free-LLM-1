import './globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata={title:'Cognexa — Your AI workspace',description:'A focused, private AI workspace for thoughtful conversations.'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
