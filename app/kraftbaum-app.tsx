"use client";
/* Authenticated custom appearance images are intentionally loaded without the public image optimizer. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useRef, useState } from "react";
import { AdminConsole } from "./admin-console";
import { RealCourses, RealDates, useDashboard } from "./user-dashboard";
import { SupportForm } from "./support-form";
import { ProfileSettings } from "./profile-settings";
import { PasswordRequest } from "./password-request";
import { startAuthentication } from "@simplewebauthn/browser";
import { AdminUpdate } from "./admin-update";
import { DEFAULT_GROWTH_MESSAGES,normalizeGrowthMessages } from "@/lib/growth-messages";

type View = "baum" | "kurse" | "termine" | "nuetzliches" | "profil" | "admin";
type AuthUser = { id:string; email:string; role:"user"|"admin"; firstName:string; lastName:string; twoFactorEnabled?:boolean;profileImage?:boolean;avatarRevision?:number };

const sessions = [
  { n: 1, title: "Ankommen & Wahrnehmen", date: "08. September", done: true },
  { n: 2, title: "Atmung & Aufrichtung", date: "15. September", done: true },
  { n: 3, title: "Kraft aus der Mitte", date: "22. September", done: true },
  { n: 4, title: "Loslassen lernen", date: "29. September", done: false },
  { n: 5, title: "Stabil im Alltag", date: "06. Oktober", done: false },
  { n: 6, title: "Bewegung & Leichtigkeit", date: "13. Oktober", done: false },
  { n: 7, title: "Meine weibliche Kraft", date: "20. Oktober", done: false },
  { n: 8, title: "Wurzeln & Weitergehen", date: "27. Oktober", done: false },
];

const nav: { id: View; label: string; icon: string }[] = [
  { id: "baum", label: "Mein Baum", icon: "✦" },
  { id: "kurse", label: "Kurse", icon: "◒" },
  { id: "termine", label: "Termine", icon: "◇" },
  { id: "nuetzliches", label: "Nützliches", icon: "⌁" },
  { id: "profil", label: "Profil", icon: "○" },
];

function GrowingTree({stage,mediaId}:{stage:number;mediaId?:string|null}){
  if(mediaId)return <img className="growth-stage-image" src={`/api/media/${mediaId}`} alt={`Kraftbaum, Wachstumsstufe ${stage}`}/>;
  const visible=(from:number)=>stage>=from;
  return <svg key={stage} className={`growing-tree stage-${stage}`} viewBox="0 0 360 430" role="img" aria-label={stage===0?"Ein Samen, aus dem dein Kraftbaum wachsen wird":`Dein Kraftbaum auf Wachstumsstufe ${stage}`}>
    <ellipse className="seed-earth" cx="180" cy="386" rx="92" ry="13"/>
    {stage===0&&<><ellipse className="seed" cx="180" cy="377" rx="16" ry="10" transform="rotate(-18 180 377)"/><path className="seed-mark" d="M174 374q8 1 13 7"/></>}
    {visible(1)&&<path className="tree-line trunk-line" d="M180 379 C176 335 190 301 181 260 C174 224 192 194 189 151 C187 122 194 96 205 70"/>}
    {visible(1)&&<path className="tree-line sprout-line" d="M183 337 C158 326 149 312 143 294 M183 322 C205 309 216 295 221 277"/>}
    {visible(2)&&<path className="tree-line" d="M183 285 C149 270 127 248 114 219 M185 267 C218 249 236 227 244 200"/>}
    {visible(3)&&<path className="tree-line" d="M184 232 C147 218 124 194 105 160 M187 216 C221 197 250 178 267 146"/>}
    {visible(4)&&<path className="tree-line" d="M188 178 C163 158 146 133 137 103 M191 160 C224 139 244 113 253 84"/>}
    {visible(5)&&<path className="tree-line twig" d="M144 294l-31-17 M221 277l28-20 M114 219l-31-10 M244 200l34-18 M105 160l-27-25 M267 146l27-25"/>}
    {visible(2)&&<g className="tree-leaves">{[[142,292],[222,275],[112,218],[246,198],[102,158],[267,144],[136,101],[253,82],[205,68],[82,207],[278,181],[78,133],[295,119]].slice(0,Math.min(13,stage*2-1)).map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="13" ry="7" transform={`rotate(${i%2?35:-35} ${x} ${y})`}/>)}</g>}
    {stage===7&&<g className="tree-flowers">{[[115,275],[279,179],[79,207],[294,118],[137,101],[205,68]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><circle cx="0" cy="-7" r="6"/><circle cx="7" cy="0" r="6"/><circle cx="0" cy="7" r="6"/><circle cx="-7" cy="0" r="6"/><circle className="flower-heart" r="4"/></g>)}</g>}
    {stage===8&&<g className="tree-apples">{[[115,275],[279,179],[79,207],[294,118],[137,101],[205,68]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><path d="M0-9q2-8 8-10"/><ellipse cx="8" cy="-17" rx="6" ry="3" transform="rotate(-25 8 -17)"/><circle r="9"/></g>)}</g>}
    {visible(8)&&<path className="tree-heart" d="M180 392 C139 368 112 348 99 317 C123 337 148 344 180 343 C212 344 238 337 261 317 C248 348 221 368 180 392Z"/>}
  </svg>;
}

function TreeScene({ progress = 3, courses = 1, completed = 0, growthMediaIds = [], growthMessages = [...DEFAULT_GROWTH_MESSAGES], animateJourney=false }: { progress?: number; courses?:number; completed?:number;growthMediaIds?:Array<string|null>;growthMessages?:string[];animateJourney?:boolean }) {
  const targetStage=Math.min(8,Math.max(0,progress)),targetRef=useRef(targetStage),[displayStage,setDisplayStage]=useState(0),[fading,setFading]=useState(false),[previewing,setPreviewing]=useState(animateJourney);
  useEffect(()=>{targetRef.current=targetStage},[targetStage]);
  useEffect(()=>{if(!animateJourney)return;const timers:number[]=[];for(let stage=1;stage<=8;stage++)timers.push(window.setTimeout(()=>setDisplayStage(stage),stage*900));timers.push(window.setTimeout(()=>setFading(true),8*900+3000));timers.push(window.setTimeout(()=>{setDisplayStage(targetRef.current);setFading(false);setPreviewing(false)},8*900+3800));return()=>timers.forEach(window.clearTimeout)},[animateJourney]);
  const season=[11,0,1].includes(new Date().getMonth())?"winter":[2,3,4].includes(new Date().getMonth())?"spring":[5,6,7].includes(new Date().getMonth())?"summer":"autumn",night=new Date().getHours()<7||new Date().getHours()>=19,visualStage=animateJourney?displayStage:targetStage,messages=normalizeGrowthMessages(growthMessages);
  return (
    <div className={`tree-scene ${season} ${night?"night":"day"}`} aria-label={`Kraftbaum mit ${courses} Kursästen und ${completed} Sternen`}>
      <div className="moon" />
      <div className="stars"><i /><i /><i /><i /></div>
      <div className={`growth-visual ${fading?"fading":""}`}><GrowingTree stage={visualStage} mediaId={growthMediaIds[visualStage]}/>{!previewing&&<blockquote className="growth-message" key={visualStage}>{messages[visualStage]}</blockquote>}</div>
      <div className="course-stars" aria-hidden="true">{Array.from({length:completed},(_,i)=><i style={{"--star":i} as React.CSSProperties} key={i}>✦</i>)}</div>
      <div className="ground" />
    </div>
  );
}

function Header({ onAdmin, user }: { onAdmin: () => void; user:AuthUser }) {
  return <header className="topbar">
    <button className="brand" onClick={() => location.reload()} aria-label="Zur Startseite"><img className="brand-logo" src="/logo-kraftbaum.svg" alt=""/><span><b>STÄRKE DEINE MITTE</b><small>ANJA SCHELLENBERGER</small></span></button>
    <button className="avatar" onClick={onAdmin} title={user.role==="admin" ? "Adminbereich öffnen" : "Profil öffnen"}>{user.profileImage?<img src={`/api/me/avatar?v=${user.avatarRevision||0}`} alt="Profilbild"/>:<span>{user.firstName[0]}{user.lastName[0]}</span>}</button>
  </header>;
}

function BaumView({ setView,data }: { setView: (v: View) => void;data:ReturnType<typeof useDashboard> }) {
  const attended=data?.courses.reduce((sum,course)=>sum+course.attendedCount,0)||0,total=data?.courses.reduce((sum,course)=>sum+course.sessionCount,0)||0,completed=data?.courses.filter(course=>course.completedAt).length||0,next=data?.upcoming[0];
  return <>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">Willkommen, {data?.user.firstName||"du"}</p><h1>Deine Kraft<br/><em>wächst mit dir.</em></h1><p>{attended?`${attended} gemeinsame Momente haben deinen Baum schon wachsen lassen.`:"Mit deiner ersten Teilnahme beginnt dein Baum zu wachsen."}</p></div>
      <TreeScene progress={attended} courses={data?.courses.length||1} completed={completed} growthMediaIds={data?.appearance?.growthMediaIds} growthMessages={data?.appearance?.growthMessages} animateJourney/>
      <div className="progress-card"><div><span>Dein gesamter Kraftweg</span><strong>{attended} <small>von {total} Einheiten</small></strong></div><div className="progress-track"><i style={{width:`${total?Math.min(100,attended/total*100):0}%`}}/></div><p>Jeder Kurs lässt einen neuen Ast wachsen. Abgeschlossene Kurse leuchten als Stern.</p></div>
    </section>
    <section className="content-grid shell">
      <article className="next-card"><div><p className="eyebrow">Dein nächster Termin</p><h2>{next?.title||"Noch kein Termin geplant"}</h2>{next&&<><p className="date">{new Date(next.startsAt).toLocaleString("de-DE")}</p><p>{next.location||"Ort folgt"}</p></>}</div>{next?.navigationUrl&&<a className="round-action" href={next.navigationUrl} target="_blank" rel="noreferrer">↗<small>Navigation</small></a>}</article>
      <article className="quiet-card"><p className="eyebrow">Neu für dich</p><h3>Kraft aus der Mitte</h3><p>Deine Übungen aus der dritten Einheit sind jetzt für dich da.</p><button onClick={() => setView("kurse")}>Übungen ansehen <span>→</span></button></article>
    </section>
  </>;
}

function KurseView() {
  return <main className="page shell"><p className="eyebrow">Dein persönlicher Weg</p><h1>Meine Kurse</h1><div className="course-card"><div className="course-art"><TreeScene progress={3}/></div><div className="course-info"><span className="active-pill">Aktiver Kurs</span><h2>Beckenboden Beginner</h2><p>September – Oktober 2026 · 8 × 90 Minuten</p><div className="stamp-grid">{sessions.map(s => <div className={s.done ? "stamp done" : "stamp"} key={s.n}><b>{s.done ? "✓" : s.n}</b><span>{s.title}</span></div>)}</div><button className="primary">Kurs öffnen</button></div></div><h2 className="section-title">Vergangene Kurse</h2><div className="past-course"><div><small>Abgeschlossen · Mai 2026</small><h3>Zeit für mich</h3><p>Dein besonderer Krafttag</p></div><span className="event-star">✦</span></div></main>;
}

function TermineView() {
  return <main className="page shell"><p className="eyebrow">Gemeinsame Zeit</p><h1>Termine & Events</h1><div className="timeline">{sessions.slice(3).map((s,i)=><article key={s.n} className={i===0?"next":""}><div className="date-tile"><b>{s.date.split(" ")[0]}</b><span>{s.date.split(" ")[1]}</span></div><div><small>{i===0?"DEIN NÄCHSTER TERMIN":"BECKENBODEN BEGINNER"}</small><h2>{s.title}</h2><p>18:30–20:00 Uhr · Herrieden</p></div><a href="https://www.openstreetmap.org/search?query=Herrieden" target="_blank" rel="noreferrer">↗</a></article>)}</div><h2 className="section-title">Weitere Veranstaltungen</h2><article className="event"><span>✦</span><div><small>21. NOVEMBER · 10–16 UHR</small><h2>Zeit für mich</h2><p>Ein ganzer Tag zum Ankommen, Auftanken und Frau sein.</p></div><a href="https://anja-tanzt.de" target="_blank" rel="noreferrer">Mehr erfahren</a></article></main>;
}

function UsefulView() {
  const links=[
    ["Vor deinem Kurs", "Anonymer Eingangsfragebogen", "Hilf Anja dabei, den Kurs gut auf die Gruppe abzustimmen.", "https://bebo.anja-tanzt.de/index.php/468255?newtest=Y&lang=de-informal"],
    ["Selbsteinschätzung", "Deutscher Beckenbodenfragebogen", "Eine anonyme Orientierung für dich – ohne Verbindung zu deinem Konto.", "https://bebo.anja-tanzt.de/DBB-Fragebogen"],
    ["Wissen", "Über deinen Beckenboden", "Verständlich erklärt: Wahrnehmung, Atmung und Kraft im Alltag.", "https://anja-tanzt.de/beckenbodenkurs/"],
  ];
  return <main className="page shell"><p className="eyebrow">Für deinen Alltag</p><h1>Nützliches</h1><p className="lead">Wissen, Orientierung und kleine Begleiter für deine Zeit zwischen den Kursen.</p><div className="resource-grid">{links.map(([tag,title,desc,url])=><a href={url} target="_blank" rel="noreferrer" key={title}><small>{tag}</small><h2>{title}</h2><p>{desc}</p><b>Extern öffnen ↗</b></a>)}</div><aside className="medical-note"><b>Ein achtsamer Hinweis</b><p>Die App ist nicht für akute Beschwerden oder Notfälle gedacht. Bitte wende dich bei akuten oder unklaren Beschwerden an medizinisches Fachpersonal.</p></aside><SupportForm/></main>;
}

function ProfileView({onLogout,onProfileImageChange}:{user:AuthUser;onLogout:()=>void;onProfileImageChange:(present:boolean)=>void}) { return <main className="page shell narrow profile-page"><p className="eyebrow">Dein Bereich</p><h1>Profil</h1><section className="profile-card"><ProfileSettings onLogout={onLogout} onProfileImageChange={onProfileImageChange}/></section><button className="logout" onClick={onLogout}>Abmelden</button></main> }

function AccessScreen({ setupRequired, onSuccess }:{setupRequired:boolean;onSuccess:(user:AuthUser)=>void}){
  const [mode,setMode]=useState<"login"|"register"|"setup">(setupRequired?"setup":"register");
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false);const [needsTwoFactor,setNeedsTwoFactor]=useState(false);const [twoFactorMethod,setTwoFactorMethod]=useState("totp");
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const form=new FormData(event.currentTarget),body=Object.fromEntries(form.entries()),endpoint=mode==="setup"?"/api/setup/initialize":mode==="login"?"/api/auth/login":"/api/auth/register";let response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),result=await response.json().catch(()=>({error:"Unbekannter Fehler."}));if(result.requiresTwoFactor&&result.twoFactorMethod==="passkey"&&result.passkeyOptions)try{const passkeyResponse=await startAuthentication({optionsJSON:result.passkeyOptions});response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...body,passkeyResponse})});result=await response.json()}catch(error){setBusy(false);setNeedsTwoFactor(true);setTwoFactorMethod("passkey");setError(`${error instanceof Error?error.message:"Passkey-Anmeldung abgebrochen."} Du kannst stattdessen einen Wiederherstellungscode eingeben.`);return}setBusy(false);if(result.requiresTwoFactor){setNeedsTwoFactor(true);setTwoFactorMethod(result.twoFactorMethod||"totp");if(!response.ok)setError(result.error||"");return}if(!response.ok){setError(result.error||"Das hat leider nicht geklappt.");return}const me=await fetch("/api/me").then(r=>r.json());onSuccess(me.user);}
  return <main className="access-page"><section className="access-story"><div className="access-brand"><img className="brand-logo" src="/logo-kraftbaum.svg" alt=""/><span><b>STÄRKE DEINE MITTE</b><small>ANJA SCHELLENBERGER</small></span></div><div><p className="eyebrow">Stärke deine Mitte</p><h1>Deine Kraft<br/><em>wächst mit dir.</em></h1><p>Deine persönliche Begleitung für Beckenboden, Kraft und Zeit für dich.</p></div><TreeScene progress={2}/></section><section className="access-form"><div><p className="eyebrow">{mode==="setup"?"Einmalige Einrichtung":mode==="login"?"Willkommen zurück":"Dein Weg beginnt hier"}</p><h2>{mode==="setup"?"Ersten Admin anlegen":mode==="login"?"Anmelden":"Kurs aktivieren"}</h2><p>{mode==="register"?"Du brauchst deinen persönlichen Zugangscode aus der Kursbuchung.":mode==="login"?"Schön, dass du wieder da bist.":"Diese Seite ist nur verfügbar, solange noch kein Admin existiert."}</p><form onSubmit={submit}>{mode==="setup"&&<label>Installationsschlüssel<input name="installToken" type="password" required minLength={16}/></label>}{mode==="register"&&<label>Zugangscode<input name="code" autoCapitalize="characters" placeholder="ABCD-EFGH-1234" required minLength={8}/></label>}{mode!=="login"&&<div className="form-row"><label>Vorname<input name="firstName" required/></label><label>Nachname<input name="lastName" required/></label></div>}<label>E-Mail-Adresse<input name="email" type="email" required autoComplete="email"/></label><label>Passwort<input name="password" type="password" required minLength={8} autoComplete={mode==="login"?"current-password":"new-password"}/></label>{mode==="login"&&needsTwoFactor&&<label>Sicherheitscode <small>{twoFactorMethod==="email"?"Code aus der E-Mail oder Wiederherstellungscode":"Authenticator- oder Wiederherstellungscode"}</small><input name="twoFactorCode" required autoComplete="one-time-code"/></label>}{mode==="register"&&<><div className="form-row"><label>Geburtstag <small>optional</small><input name="birthday" type="date"/></label><label>Telefon <small>optional</small><input name="phone" type="tel"/></label></div><label className="check"><input name="terms" type="checkbox" required/> <span>Ich akzeptiere die <a href="/rechtliches/nutzungsbedingungen" target="_blank" rel="noreferrer">Nutzungsbedingungen</a> und habe die <a href="/rechtliches/datenschutz" target="_blank" rel="noreferrer">Datenschutzerklärung</a> gelesen.</span></label></>}{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary access-submit" disabled={busy}>{busy?"Einen Moment …":mode==="login"?"Anmelden":mode==="setup"?"Sicher einrichten":"Kurs aktivieren"}</button></form>{mode==="login"&&<PasswordRequest/>}{mode!=="setup"&&<button className="mode-switch" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Ich habe einen neuen Zugangscode":"Ich habe bereits ein Konto"}</button>}<footer className="access-legal"><a href="/rechtliches/impressum" target="_blank" rel="noreferrer">Impressum</a><a href="/rechtliches/datenschutz" target="_blank" rel="noreferrer">Datenschutz</a></footer></div></section></main>
}

export function KraftbaumApp() {
  const [view,setView]=useState<View>("baum");
  const [user,setUser]=useState<AuthUser|null|undefined>(undefined);
  const [setupRequired,setSetupRequired]=useState(false);
  const [emailVerified,setEmailVerified]=useState(()=>typeof window!=="undefined"&&new URL(window.location.href).searchParams.get("emailVerified")==="1");
  const dashboard=useDashboard(Boolean(user));
  useEffect(()=>{Promise.all([fetch("/api/me").then(r=>r.ok?r.json():{user:null}),fetch("/api/setup/status").then(r=>r.json())]).then(([me,setup])=>{setUser(me.user);setSetupRequired(setup.setupRequired)}).catch(()=>setUser(null));},[]);
  useEffect(()=>{const url=new URL(window.location.href);if(url.searchParams.get("emailVerified")==="1"){url.searchParams.delete("emailVerified");window.history.replaceState({},"",`${url.pathname}${url.search}${url.hash}`)}},[]);
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});navigator.serviceWorker?.controller?.postMessage("CLEAR_PRIVATE_CACHES");if("caches" in window)await caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key))));setUser(null);setView("baum");}
  const confirmation=emailVerified&&<aside className="success-toast" role="status" aria-live="polite"><span><b>✓ E-Mail-Adresse bestätigt</b><small>Deine E-Mail-Adresse wurde erfolgreich bestätigt.</small></span><button type="button" onClick={()=>setEmailVerified(false)} aria-label="Meldung schließen">×</button></aside>;
  if(user===undefined)return <><div className="app-loading"><img className="loading-logo" src="/logo-kraftbaum.svg" alt=""/><p>Dein Kraftbaum erwacht …</p></div>{confirmation}</>;
  if(!user)return <>{confirmation}<AccessScreen setupRequired={setupRequired} onSuccess={setUser}/></>;
  if(view==="admin") return <>{confirmation}<AdminConsole close={()=>setView("baum")} requireSecurity={user.role==="admin"&&!user.twoFactorEnabled}/></>;
  const profileImageChange=(present:boolean)=>setUser(current=>current?{...current,profileImage:present,avatarRevision:Date.now()}:current);
  return <div className="app">{confirmation}<Header user={user} onAdmin={()=>setView(user.role==="admin"?"admin":"profil")}/><div className="desktop-tabs">{nav.map(n=><button className={view===n.id?"active":""} onClick={()=>setView(n.id)} key={n.id}>{n.label}</button>)}</div>{view==="baum"&&<BaumView setView={setView} data={dashboard}/>} {view==="kurse"&&(dashboard?<RealCourses data={dashboard} Tree={TreeScene}/>:<KurseView/>)}{view==="termine"&&(dashboard?<RealDates data={dashboard}/>:<TermineView/>)}{view==="nuetzliches"&&<UsefulView/>}{view==="profil"&&<ProfileView user={user} onLogout={logout} onProfileImageChange={profileImageChange}/>}<footer className="app-footer"><div className="footer-brand"><img src="/logo-kraftbaum.svg" alt=""/><div><b>Stärke deine Mitte</b><span>Beckenboden · Mentoring · Zeit für dich</span></div></div><a className="footer-review" href="https://www.google.com/maps/place//data=!4m3!3m2!1s0x4798c7c661d37d01:0xbb1767c240562350!12e1?source=g.page.m.ia._&laa=nmx-review-solicitation-ia2" target="_blank" rel="noreferrer"><span aria-hidden="true">★★★★★</span><div><b>Deine Erfahrung zählt</b><small>Bewertung auf Google schreiben ↗</small></div></a><nav className="footer-legal" aria-label="Rechtliches"><b>Rechtliches</b><a href="/rechtliches/impressum" target="_blank" rel="noreferrer">Impressum</a><a href="/rechtliches/datenschutz" target="_blank" rel="noreferrer">Datenschutz</a><a href="/rechtliches/nutzungsbedingungen" target="_blank" rel="noreferrer">Nutzungsbedingungen</a><button type="button" onClick={()=>window.dispatchEvent(new Event("open-cookie-settings"))}>Cookie-Einstellungen</button></nav>{user.role==="admin"&&<AdminUpdate/>}</footer><nav className="mobile-nav">{nav.map(n=><button className={view===n.id?"active":""} onClick={()=>setView(n.id)} key={n.id}><i>{n.icon}</i>{n.label}</button>)}</nav></div>;
}
