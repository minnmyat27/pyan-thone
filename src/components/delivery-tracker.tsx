"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Point={id:number;latitude:number;longitude:number;recorded_at:string};
export function DeliveryTracker({ deliveryId, initialPoints, destination }: { deliveryId:string;initialPoints:Point[];destination:string }) {
  const [points,setPoints]=useState(initialPoints);
  useEffect(()=>{const supabase=createClient();const channel=supabase.channel(`delivery:${deliveryId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"delivery_location_updates",filter:`delivery_id=eq.${deliveryId}`},payload=>setPoints(current=>[...current,payload.new as Point])).subscribe();return()=>{void supabase.removeChannel(channel)}},[deliveryId]);
  const current=points.at(-1); const minLat=16.79,maxLat=16.84,minLng=96.14,maxLng=96.20;
  const xy=(point:Point)=>({left:`${((Number(point.longitude)-minLng)/(maxLng-minLng))*100}%`,top:`${100-((Number(point.latitude)-minLat)/(maxLat-minLat))*100}%`});
  return <section><div className="map" role="img" aria-label={current?`Courier near latitude ${current.latitude}, longitude ${current.longitude}`:"Waiting for courier location"}><div className="map-route"/>{points.map((point,index)=><span key={point.id} className={index===points.length-1?"courier-marker":"route-point"} style={xy(point)}>{index===points.length-1?"●":""}</span>)}<span className="destination-marker" title={destination}>◆</span></div><p><strong>Destination:</strong> {destination}</p><p>{current?`Last update ${new Date(current.recorded_at).toLocaleTimeString()} · ${Number(current.latitude).toFixed(4)}, ${Number(current.longitude).toFixed(4)}`:"No tracking updates yet."}</p></section>;
}
