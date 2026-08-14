import {CODE_REVISION} from "@/lib/version";

// This tiny inline guard is available before build-specific styles and chunks finish loading.
// It recovers once from an HTML document that still points at assets of an older deployment.
export function AssetRecoveryScript(){
  const source=`(()=>{let r=false;const k="kraftbaum-asset-recovery",v="${CODE_REVISION}";function stale(u){return typeof u==="string"&&u.includes("/_next/static/")}function recover(){if(r)return;r=true;try{const last=sessionStorage.getItem(k);if(last===v)return;sessionStorage.setItem(k,v)}catch{}const url=new URL(location.href);url.searchParams.set("app-recovery",v);url.hash="";Promise.all(["caches" in window?caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("staerke-deine-mitte-v")).map(key=>caches.delete(key)))):Promise.resolve(),"serviceWorker" in navigator?navigator.serviceWorker.getRegistrations().then(items=>Promise.all(items.map(item=>item.update().catch(()=>undefined)))):Promise.resolve()]).finally(()=>location.replace(url.pathname+url.search))}addEventListener("error",event=>{const target=event.target;if(target&&stale(target.src||target.href))recover();else if(stale(event.filename))recover()},true);addEventListener("unhandledrejection",event=>{const message=String(event.reason?.message||event.reason||"");if(/ChunkLoadError|Loading chunk .* failed/i.test(message))recover()})})()`;
  return <script dangerouslySetInnerHTML={{__html:source}}/>;
}
