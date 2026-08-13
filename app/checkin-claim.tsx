"use client";
/* The query token is read after hydration so server and browser markup stay identical. */
/* eslint-disable react-hooks/set-state-in-effect */
import {useEffect,useState} from "react";
type Info={title:string;courseTitle:string;attended:boolean;error?:string};
export function CheckinClaim(){
  const [token,setToken]=useState(""),[info,setInfo]=useState<Info|null>(null),[notice,setNotice]=useState("");
  useEffect(()=>{const value=new URLSearchParams(location.search).get("checkin")||"";setToken(value);if(value)fetch(`/api/checkin/${encodeURIComponent(value)}`).then(response=>response.json()).then(data=>setInfo(data))},[]);
  if(!token||!info)return null;
  function dismiss(){const url=new URL(location.href);url.searchParams.delete("checkin");history.replaceState({},"",url);setToken("")}
  async function confirm(){const response=await fetch(`/api/checkin/${encodeURIComponent(token)}`,{method:"POST"}),result=await response.json();if(!response.ok){setNotice(result.error);return}setNotice(result.message);setInfo(current=>current?{...current,attended:true}:current)}
  return <div className="checkin-overlay" role="dialog" aria-modal="true" aria-labelledby="checkin-title"><section><button className="checkin-close" onClick={dismiss} aria-label="Schließen">×</button><p className="eyebrow">Willkommen zum Kurs</p><h2 id="checkin-title">{info.title||"Check-in"}</h2>{info.courseTitle&&<p>{info.courseTitle}</p>}{info.error?<p className="form-error">{info.error}</p>:info.attended?<p className="checkin-success">✓ Du bist als anwesend eingetragen. Schön, dass du da bist!</p>:<button className="primary" onClick={confirm}>Ich bin angekommen</button>}{notice&&<p className={info.attended?"checkin-success":"form-error"}>{notice}</p>}</section></div>
}
