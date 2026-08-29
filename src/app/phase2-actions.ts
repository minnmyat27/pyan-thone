"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/marketplace";
import { validateListing } from "@/lib/domain";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

async function uploadListingImages(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], userId:string, listingId:string, title:string, form:FormData, startAt=0) {
  const images=form.getAll("images").filter((value):value is File=>value instanceof File&&value.size>0);
  for(let index=0;index<Math.min(images.length,Math.max(0,6-startAt));index++){
    const image=images[index];
    if(!["image/jpeg","image/png","image/webp","image/gif"].includes(image.type)||image.size>5_242_880) continue;
    const ext=image.name.split(".").pop()?.toLowerCase()||"jpg";
    const path=`${userId}/${listingId}/${crypto.randomUUID()}.${ext}`;
    const uploaded=await supabase.storage.from("listing-images").upload(path,image,{contentType:image.type});
    if(!uploaded.error) await supabase.from("listing_images").insert({listing_id:listingId,storage_path:path,alt_text:title,sort_order:startAt+index});
  }
}

export async function createListing(form: FormData) {
  const { supabase, user } = await requireUser("seller");
  const input = { title: text(form,"title"), description: text(form,"description"), categoryId: text(form,"categoryId"), condition: text(form,"condition"), price: Number(form.get("price")) };
  const errors = validateListing(input);
  if (errors.length) redirect(`/seller/listings/new?error=${encodeURIComponent(errors.join(" "))}`);
  const { data: listing, error } = await supabase.from("listings").insert({
    seller_id:user.id,title:input.title,description:input.description,category_id:input.categoryId,
    condition:input.condition,current_price:input.price,currency:"MMK",status:text(form,"status")==="draft"?"draft":"active",
  }).select("id").single();
  if (error || !listing) redirect(`/seller/listings/new?error=${encodeURIComponent(error?.message ?? "Unable to create listing")}`);
  await uploadListingImages(supabase,user.id,listing.id,input.title,form);
  revalidatePath("/buyer/marketplace");
  redirect(`/seller/listings/${listing.id}/edit?message=Listing created`);
}

export async function updateListing(form: FormData) {
  const { supabase,user } = await requireUser("seller");
  const id=text(form,"id");
  const input={title:text(form,"title"),description:text(form,"description"),categoryId:text(form,"categoryId"),condition:text(form,"condition"),price:Number(form.get("price"))};
  const errors=validateListing(input);
  if(errors.length) redirect(`/seller/listings/${id}/edit?error=${encodeURIComponent(errors.join(" "))}`);
  const status=["draft","active","removed"].includes(text(form,"status"))?text(form,"status"):"draft";
  const { error }=await supabase.from("listings").update({title:input.title,description:input.description,category_id:input.categoryId,condition:input.condition,current_price:input.price,status}).eq("id",id);
  if(error) redirect(`/seller/listings/${id}/edit?error=${encodeURIComponent(error.message)}`);
  const {count}=await supabase.from("listing_images").select("id",{count:"exact",head:true}).eq("listing_id",id);
  await uploadListingImages(supabase,user.id,id,input.title,form,count??0);
  revalidatePath(`/listings/${id}`); revalidatePath("/seller/listings"); revalidatePath("/buyer/marketplace");
  redirect(`/seller/listings/${id}/edit?message=Listing updated`);
}

export async function removeListingImage(form:FormData){
  const {supabase}=await requireUser("seller"); const listingId=text(form,"listingId"),imageId=text(form,"imageId");
  const {data:image}=await supabase.from("listing_images").select("storage_path").eq("id",imageId).eq("listing_id",listingId).single();
  if(!image) redirect(`/seller/listings/${listingId}/edit?error=Image not found`);
  const removed=await supabase.storage.from("listing-images").remove([image.storage_path]);
  if(removed.error) redirect(`/seller/listings/${listingId}/edit?error=${encodeURIComponent(removed.error.message)}`);
  await supabase.from("listing_images").delete().eq("id",imageId);
  revalidatePath(`/listings/${listingId}`); revalidatePath(`/seller/listings/${listingId}/edit`);
  redirect(`/seller/listings/${listingId}/edit?message=Image removed`);
}

export async function startConversation(form: FormData) {
  const { supabase }=await requireUser("buyer");
  const { data,error }=await supabase.rpc("open_listing_conversation",{target_listing:text(form,"listingId")});
  if(error) redirect(`/listings/${text(form,"listingId")}?error=${encodeURIComponent(error.message)}`);
  redirect(`/buyer/messages/${data}`);
}

export async function sendMessage(form: FormData) {
  const { supabase,user,profile }=await requireUser();
  const conversationId=text(form,"conversationId"), body=text(form,"body");
  if(!body) return;
  const { error }=await supabase.from("messages").insert({conversation_id:conversationId,sender_id:user.id,body});
  if(error) redirect(`/${profile.role}/messages/${conversationId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/${profile.role}/messages/${conversationId}`);
}

export async function purchaseListing(form: FormData) {
  const { supabase }=await requireUser("buyer");
  const listingId=text(form,"listingId");
  const { data,error }=await supabase.rpc("create_purchase",{target_listing:listingId,buyer_address:text(form,"deliveryAddress")});
  if(error) redirect(`/buyer/checkout/${listingId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/buyer/orders"); revalidatePath("/buyer/marketplace");
  redirect(`/buyer/orders/${data}?message=Demo payment secured and held by Pyan Thone`);
}

export async function sellerMarkShipped(form: FormData) {
  const { supabase }=await requireUser("seller");
  const id=text(form,"orderId"); const { error }=await supabase.rpc("seller_mark_shipped",{target_order:id});
  if(error) redirect(`/seller/orders/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/seller/orders/${id}`); redirect(`/seller/orders/${id}?message=Shipment recorded`);
}

const adminOperations=["receive","start_inspection","pass","fail","refund_pending","refund","return","close","start_delivery","advance_delivery","delivered","release_payment","complete"];
export async function adminAdvanceOrder(form: FormData) {
  const { supabase }=await requireUser("admin");
  const id=text(form,"orderId"),operation=text(form,"operation");
  if(!adminOperations.includes(operation)) throw new Error("Invalid operation");
  const details={notes:text(form,"notes"),reason:text(form,"reason"),listing_matches:form.get("listingMatches")!=="false",condition_matches:form.get("conditionMatches")!=="false",courier_name:text(form,"courierName"),courier_phone:text(form,"courierPhone")};
  const { error }=await supabase.rpc("admin_advance_order",{target_order:id,operation,details});
  if(error) redirect(`/admin/orders/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/orders/${id}`); revalidatePath("/admin");
  redirect(`/admin/orders/${id}?message=${encodeURIComponent(operation.replaceAll("_"," "))}`);
}

export async function submitReview(form: FormData) {
  const { supabase,user }=await requireUser("buyer"); const orderId=text(form,"orderId"),sellerId=text(form,"sellerId");
  const { error }=await supabase.from("seller_reviews").insert({order_id:orderId,buyer_id:user.id,seller_id:sellerId,rating:Number(form.get("rating")),comment:text(form,"comment")||null});
  if(error) redirect(`/buyer/orders/${orderId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/buyer/orders/${orderId}`); revalidatePath(`/sellers/${sellerId}`);
  redirect(`/buyer/orders/${orderId}?message=Review published`);
}

export async function openDispute(form: FormData) {
  const { supabase,user,profile }=await requireUser(); const orderId=text(form,"orderId");
  const { error }=await supabase.from("disputes").insert({order_id:orderId,opened_by:user.id,reason:text(form,"reason"),description:text(form,"description")});
  if(error) redirect(`/${profile.role}/orders/${orderId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/${profile.role}/orders/${orderId}`); redirect(`/${profile.role}/orders/${orderId}?message=Dispute opened`);
}

export async function resolveDispute(form: FormData) {
  const { supabase,user }=await requireUser("admin"); const id=text(form,"disputeId"),status=text(form,"status");
  if(!["under_review","resolved_buyer","resolved_seller","closed"].includes(status)) throw new Error("Invalid dispute status");
  const { error }=await supabase.from("disputes").update({status,resolution_notes:text(form,"notes")||null,resolved_by:user.id,resolved_at:status.startsWith("resolved")?new Date().toISOString():null}).eq("id",id);
  if(error) redirect(`/admin/disputes?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/disputes"); redirect("/admin/disputes?message=Dispute updated");
}
