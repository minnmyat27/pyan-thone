"use client";
import { useEffect,useMemo,useState } from "react";

export function ListingImageInput({editing=false}:{editing?:boolean}){
  const [files,setFiles]=useState<File[]>([]); const previews=useMemo(()=>files.map(file=>URL.createObjectURL(file)),[files]);
  useEffect(()=>()=>previews.forEach(URL.revokeObjectURL),[previews]);
  return <label className="upload-field"><span>{editing?"Add images":"Item images"} <small>Up to 6 total · JPG, PNG, WebP or GIF · 5 MB each</small></span><input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={event=>setFiles(Array.from(event.target.files??[]).slice(0,6))}/>{previews.length>0&&<span className="image-previews" aria-label={`${previews.length} selected images`}>{previews.map((src,index)=><span key={src} style={{backgroundImage:`url(${src})`}} aria-label={files[index].name}/>)}</span>}</label>;
}
