"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/phase2-actions";

type Message={id:string;sender_id:string;body:string;created_at:string};
export function ChatThread({ conversationId, userId, initialMessages, editListingHref }: { conversationId:string;userId:string;initialMessages:Message[];editListingHref?:string }) {
  const [messages,setMessages]=useState(initialMessages); const end=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const supabase=createClient();
    const channel=supabase.channel(`conversation:${conversationId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`conversation_id=eq.${conversationId}`},payload=>{
      const next=payload.new as Message; setMessages(current=>current.some(item=>item.id===next.id)?current:[...current,next]);
    }).subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[conversationId]);
  useEffect(()=>end.current?.scrollIntoView({behavior:"smooth"}),[messages]);
  return <><div className="chat-log" aria-live="polite">{messages.map(message=><article className={message.sender_id===userId?"mine":""} key={message.id}><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString()}</small></article>)}<div ref={end}/></div>
    <form action={sendMessage} className="chat-compose"><input type="hidden" name="conversationId" value={conversationId}/><label><span>Message</span><textarea name="body" required maxLength={4000} placeholder="Write a message…"/></label><button>Send</button>{editListingHref&&<a className="button-link secondary" href={editListingHref}>Update listing price</a>}</form></>;
}
