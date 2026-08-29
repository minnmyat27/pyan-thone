import { getCategories } from "@/lib/marketplace";
import { createListing, updateListing } from "@/app/phase2-actions";
import { Notice } from "./status";

type ListingFormData={id:string;title:string;description:string;category_id:string;condition:string;current_price:number;status:string};
export async function ListingForm({listing,searchParams}:{listing?:ListingFormData;searchParams?:{error?:string;message?:string}}) {
  const categories=await getCategories(); const action=listing?updateListing:createListing;
  return <><Notice searchParams={searchParams}/><form action={action} className="form panel" encType="multipart/form-data">{listing&&<input type="hidden" name="id" value={listing.id}/>}
    <label>Title<input name="title" required minLength={3} maxLength={140} defaultValue={listing?.title}/></label>
    <label>Description<textarea name="description" required minLength={10} rows={6} defaultValue={listing?.description}/></label>
    <div className="form-grid"><label>Category<select name="categoryId" required defaultValue={listing?.category_id}><option value="">Choose category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Condition<select name="condition" required defaultValue={listing?.condition??"good"}>{["new","like_new","good","fair","poor"].map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}</select></label>
    <label>Price (MMK)<input name="price" type="number" min="1" max="999999999999" step="1" required defaultValue={listing?.current_price}/></label>
    <label>Status<select name="status" defaultValue={listing?.status??"active"}>{["draft","active","removed"].map(value=><option key={value}>{value}</option>)}</select></label></div>
    <label>{listing?"Add images":"Images"} (up to 6 total, 5 MB each)<input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple/></label>
    <p className="help">Negotiated a new price in chat? Update the listing price here before the buyer purchases.</p><button>{listing?"Save changes":"Create listing"}</button>
  </form></>;
}
