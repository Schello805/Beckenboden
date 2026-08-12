"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AdminConsole } from "./admin-console";
import { RealCourses, RealDates, useDashboard } from "./user-dashboard";
import { SupportForm } from "./support-form";

type View = "baum" | "kurse" | "termine" | "nuetzliches" | "profil" | "admin";
type AuthUser = { id:string; email:string; role:"user"|"admin"; firstName:string; lastName:string; twoFactorEnabled?:boolean };

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

function TreeScene({ progress = 3 }: { progress?: number }) {
  const leaves = useMemo(() => Array.from({ length: 32 + progress * 11 }), [progress]);
  return (
    <div className="tree-scene" aria-label={`Kraftbaum, ${progress} von 8 Einheiten`}>
      <div className="moon" />
      <div className="stars"><i /><i /><i /><i /></div>
      <div className="tree-crown crown-a" />
      <div className="tree-crown crown-b" />
      <div className="tree-crown crown-c" />
      <div className="trunk"><span className="branch b1"/><span className="branch b2"/><span className="branch b3"/></div>
      <div className="leaves" aria-hidden="true">{leaves.map((_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</div>
      <div className="woman"><i className="head"/><i className="body"/></div>
      <div className="cat"><i/><span/></div>
      <div className="ground" />
    </div>
  );
}

function Header({ onAdmin, isAdmin }: { onAdmin: () => void; isAdmin: boolean }) {
  return <header className="topbar">
    <button className="brand" onClick={() => location.reload()} aria-label="Zur Startseite"><span className="brand-mark">a</span><span><b>ANJA</b><small>TANZT</small></span></button>
    <button className="avatar" onClick={onAdmin} title={isAdmin ? "Adminbereich öffnen" : "Profil öffnen"}>AS</button>
  </header>;
}

function BaumView({ setView }: { setView: (v: View) => void }) {
  return <>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">Guten Abend, Anna</p><h1>Deine Kraft<br/><em>wächst mit dir.</em></h1><p>Drei gemeinsame Momente haben deinen Baum schon wachsen lassen.</p></div>
      <TreeScene />
      <div className="progress-card"><div><span>Dein Weg im Beginnerkurs</span><strong>3 <small>von 8 Einheiten</small></strong></div><div className="progress-track"><i style={{width:"37.5%"}}/></div><p>Noch eine gemeinsame Zeit – dann wächst ein neuer Ast.</p></div>
    </section>
    <section className="content-grid shell">
      <article className="next-card"><div><p className="eyebrow">Dein nächster Termin</p><h2>Loslassen lernen</h2><p className="date">Dienstag, 29. September · 18:30 Uhr</p><p>Studio Anja tanzt · Herrieden</p></div><a className="round-action" href="https://www.openstreetmap.org/search?query=Herrieden" target="_blank" rel="noreferrer">↗<small>Navigation</small></a></article>
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

function ProfileView({user,onLogout}:{user:AuthUser;onLogout:()=>void}) { return <main className="page shell narrow"><p className="eyebrow">Dein Bereich</p><h1>Profil</h1><section className="profile-card"><div className="profile-head"><span>{user.firstName[0]}{user.lastName[0]}</span><div><h2>{user.firstName} {user.lastName}</h2><p>{user.email}</p></div></div><div className="personal-qr"><div><small>DEINE DIGITALE STEMPELKARTE</small><h3>Persönlicher QR-Code</h3><p>Zeige diesen Code Anja beim Kurstermin. Er enthält keine persönlichen Angaben und erneuert sich automatisch.</p></div><Image src="/api/me/qr" alt="Persönlicher QR-Code für die Anwesenheit" width={150} height={150} unoptimized/></div>{["Persönliche Daten", "E-Mail-Adresse ändern", "Benachrichtigungen", "Datenschutz & Einwilligungen", "Meine Daten herunterladen", "Weiteren Kurs freischalten"].map(x=><button key={x}>{x}<span>›</span></button>)}</section><button className="logout" onClick={onLogout}>Abmelden</button></main> }

function AccessScreen({ setupRequired, onSuccess }:{setupRequired:boolean;onSuccess:(user:AuthUser)=>void}){
  const [mode,setMode]=useState<"login"|"register"|"setup">(setupRequired?"setup":"register");
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false);const [needsTwoFactor,setNeedsTwoFactor]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const form=new FormData(event.currentTarget);const body=Object.fromEntries(form.entries());const endpoint=mode==="setup"?"/api/setup/initialize":mode==="login"?"/api/auth/login":"/api/auth/register";const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const result=await response.json().catch(()=>({error:"Unbekannter Fehler."}));setBusy(false);if(result.requiresTwoFactor){setNeedsTwoFactor(true);if(!response.ok)setError(result.error||"");return}if(!response.ok){setError(result.error||"Das hat leider nicht geklappt.");return}const me=await fetch("/api/me").then(r=>r.json());onSuccess(me.user);}
  return <main className="access-page"><section className="access-story"><div className="access-brand"><span className="brand-mark">a</span><span><b>ANJA</b><small>TANZT</small></span></div><div><p className="eyebrow">Mein Kraftbaum</p><h1>Deine Kraft<br/><em>wächst mit dir.</em></h1><p>Deine persönliche Begleitung für Beckenboden, Kraft und Zeit für dich.</p></div><TreeScene progress={2}/></section><section className="access-form"><div><p className="eyebrow">{mode==="setup"?"Einmalige Einrichtung":mode==="login"?"Willkommen zurück":"Dein Weg beginnt hier"}</p><h2>{mode==="setup"?"Ersten Admin anlegen":mode==="login"?"Anmelden":"Kurs aktivieren"}</h2><p>{mode==="register"?"Du brauchst deinen persönlichen Zugangscode aus der Kursbuchung.":mode==="login"?"Schön, dass du wieder da bist.":"Diese Seite ist nur verfügbar, solange noch kein Admin existiert."}</p><form onSubmit={submit}>{mode==="setup"&&<label>Installationsschlüssel<input name="installToken" type="password" required minLength={16}/></label>}{mode==="register"&&<label>Zugangscode<input name="code" autoCapitalize="characters" placeholder="ABCD-EFGH-1234" required minLength={8}/></label>}{mode!=="login"&&<div className="form-row"><label>Vorname<input name="firstName" required/></label><label>Nachname<input name="lastName" required/></label></div>}<label>E-Mail-Adresse<input name="email" type="email" required autoComplete="email"/></label><label>Passwort<input name="password" type="password" required minLength={8} autoComplete={mode==="login"?"current-password":"new-password"}/></label>{mode==="login"&&needsTwoFactor&&<label>Sicherheitscode <small>Authenticator- oder Wiederherstellungscode</small><input name="twoFactorCode" required autoComplete="one-time-code"/></label>}{mode==="register"&&<><div className="form-row"><label>Geburtstag <small>optional</small><input name="birthday" type="date"/></label><label>Telefon <small>optional</small><input name="phone" type="tel"/></label></div><label className="check"><input name="terms" type="checkbox" required/> <span>Ich akzeptiere die Nutzungsbedingungen und habe die Datenschutzerklärung gelesen.</span></label></>}{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary access-submit" disabled={busy}>{busy?"Einen Moment …":mode==="login"?"Anmelden":mode==="setup"?"Sicher einrichten":"Kurs aktivieren"}</button></form>{mode!=="setup"&&<button className="mode-switch" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Ich habe einen neuen Zugangscode":"Ich habe bereits ein Konto"}</button>}<footer className="access-legal"><a href="https://anja-tanzt.de/impressum/">Impressum</a><a href="https://anja-tanzt.de/datenschutzerklaerung/">Datenschutz</a></footer></div></section></main>
}

export function KraftbaumApp() {
  const [view,setView]=useState<View>("baum");
  const [user,setUser]=useState<AuthUser|null|undefined>(undefined);
  const [setupRequired,setSetupRequired]=useState(false);
  const dashboard=useDashboard(Boolean(user));
  useEffect(()=>{Promise.all([fetch("/api/me").then(r=>r.ok?r.json():{user:null}),fetch("/api/setup/status").then(r=>r.json())]).then(([me,setup])=>{setUser(me.user);setSetupRequired(setup.setupRequired)}).catch(()=>setUser(null));},[]);
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});navigator.serviceWorker?.controller?.postMessage("CLEAR_PRIVATE_CACHES");if("caches" in window)await caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key))));setUser(null);setView("baum");}
  if(user===undefined)return <div className="app-loading"><span className="brand-mark">a</span><p>Dein Kraftbaum erwacht …</p></div>;
  if(!user)return <AccessScreen setupRequired={setupRequired} onSuccess={setUser}/>;
  if(view==="admin") return <AdminConsole close={()=>setView("baum")} requireSecurity={user.role==="admin"&&!user.twoFactorEnabled}/>;
  return <div className="app"><Header isAdmin={user.role==="admin"} onAdmin={()=>setView(user.role==="admin"?"admin":"profil")}/><div className="desktop-tabs">{nav.map(n=><button className={view===n.id?"active":""} onClick={()=>setView(n.id)} key={n.id}>{n.label}</button>)}</div>{view==="baum"&&<BaumView setView={setView}/>} {view==="kurse"&&(dashboard?<RealCourses data={dashboard} Tree={TreeScene}/>:<KurseView/>)}{view==="termine"&&(dashboard?<RealDates data={dashboard}/>:<TermineView/>)}{view==="nuetzliches"&&<UsefulView/>}{view==="profil"&&<ProfileView user={user} onLogout={logout}/>}<footer><div><a href="https://anja-tanzt.de/impressum/">Impressum</a><a href="https://anja-tanzt.de/datenschutzerklaerung/">Datenschutz</a><a href="https://anja-tanzt.de/agb/">Nutzungsbedingungen</a><button type="button">Cookie-Einstellungen</button></div><span>Mein Kraftbaum · Revision 0.11.0</span></footer><nav className="mobile-nav">{nav.map(n=><button className={view===n.id?"active":""} onClick={()=>setView(n.id)} key={n.id}><i>{n.icon}</i>{n.label}</button>)}</nav></div>;
}
