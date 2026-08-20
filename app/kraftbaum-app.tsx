"use client";
/* Authenticated custom appearance images are intentionally loaded without the public image optimizer. */
/* eslint-disable @next/next/no-img-element */

import {useEffect,useState} from "react";
import { AdminConsole } from "./admin-console";
import { RealCourses, RealDates, useDashboard } from "./user-dashboard";
import {appTimeZone} from "@/lib/app-time";
import { SupportForm } from "./support-form";
import { ProfileSettings } from "./profile-settings";
import { AdminUpdate } from "./admin-update";
import {CheckinClaim} from "./checkin-claim";
import {TreeScene} from "./kraftbaum-tree";
import {AccessScreen} from "./access-screen";
import type {AuthUser} from "./access-screen";
import {UserOnboarding} from "./user-onboarding";
import {CalendarAction,QuickAttendanceQr} from "./user-actions";
import {PushNudge} from "./push-nudge";
import {NotificationInbox} from "./notification-inbox";

type View = "baum" | "kurse" | "termine" | "nuetzliches" | "profil" | "admin";
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

function Header({ onAdmin, user }: { onAdmin: () => void; user:AuthUser }) {
  return <><CheckinClaim/><header className="topbar">
    <button className="brand" onClick={() => location.reload()} aria-label="Zur Startseite"><img className="brand-logo" src="/logo-kraftbaum.svg" alt=""/><span><b>STÄRKE DEINE MITTE</b><small>ANJA SCHELLENBERGER</small></span></button>
    <div className="header-actions"><NotificationInbox profileImage={user.profileImage} avatarRevision={user.avatarRevision} initials={`${user.firstName[0]}${user.lastName[0]}`} onProfile={onAdmin} profileLabel={user.role==="admin"?"Adminbereich öffnen":"Profil öffnen"}/></div>
  </header></>;
}

function progressMessage(attended:number,total:number){if(!total)return "Dein erster Kurs lässt hier einen ganz persönlichen Kraftbaum entstehen.";if(!attended)return "Alles, was wachsen darf, beginnt mit einem ersten gemeinsamen Moment.";if(attended===1)return "Du hast dir zum ersten Mal bewusst Zeit für dich genommen.";if(attended<total)return `Du hast dir bereits ${attended}-mal Zeit für dich und deine Mitte genommen.`;return "Dein gemeinsamer Kursweg ist vollständig – dein Baum trägt deine gewachsene Kraft."}
const localDay=(value:Date)=>new Intl.DateTimeFormat("sv-SE",{timeZone:appTimeZone(),year:"numeric",month:"2-digit",day:"2-digit"}).format(value);
function BaumView({ setView,data,onMakeup }: { setView: (v: View) => void;data:ReturnType<typeof useDashboard>;onMakeup:()=>void }) {
  const [latest,setLatest]=useState<string|null>(null),attended=data?.courses.reduce((sum,course)=>sum+course.attendedCount,0)||0,total=data?.courses.reduce((sum,course)=>sum+course.sessionCount,0)||0,completed=data?.courses.filter(course=>course.completedAt).length||0,next=data?.upcoming[0],activeCourseId=data?.courses.find(course=>!course.completedAt)?.id,today=next&&localDay(new Date(next.startsAt))===localDay(new Date());
  useEffect(()=>{if(!activeCourseId)return;fetch(`/api/courses/${activeCourseId}/content`).then(response=>response.ok?response.json():{items:[]}).then(result=>{const items=(result.items||[]) as {title:string;contentUpdatedAt:string}[];items.sort((a,b)=>b.contentUpdatedAt.localeCompare(a.contentUpdatedAt));setLatest(items[0]?.title||null)})},[activeCourseId,attended]);
  return <>
    <section className="hero">
      <div className="hero-atmosphere" aria-hidden="true"><i/><i/><i/></div>
      <div className="hero-copy"><p className="eyebrow">Willkommen, {data?.user.firstName||"du"}</p><h1>Deine Kraft<br/><em>wächst mit dir.</em></h1><p>{attended?`${attended} gemeinsame Momente haben deinen Baum schon wachsen lassen.`:"Mit deiner ersten Teilnahme beginnt dein Baum zu wachsen."}</p></div>
      <section className="hero-progress" aria-label="Dein persönlicher Kursfortschritt"><div className="progress-card"><small className="progress-kicker">DEIN PERSÖNLICHER WEG</small><div><span>Dein gesamter Kraftweg</span><strong>{attended} <small>von {total} Einheiten</small></strong></div><div className="progress-track" aria-label={`${attended} von ${total} Einheiten`}><i style={{width:`${total?Math.min(100,attended/total*100):0}%`}}/></div><p>{progressMessage(attended,total)}</p></div></section>
      <TreeScene progress={attended} courses={data?.courses.length||1} completed={completed} growthMediaIds={data?.appearance?.growthMediaIds} growthMessages={data?.appearance?.growthMessages} decorations={data?.decorations||[]} animateJourney/>
    </section>
    <section className="content-grid shell">
      <article className="next-card"><span className="card-symbol" aria-hidden="true">◇</span><div><p className="eyebrow">{today?"Heute ist dein Kurstag":"Dein nächster Termin"}</p><h2>{next?.title||"Noch kein Termin geplant"}</h2>{next&&<><p className="date">{new Date(next.startsAt).toLocaleString("de-DE",{timeZone:appTimeZone()})}</p><p>{next.location||"Ort folgt"}</p><div className="next-actions"><CalendarAction session={next}/>{today&&<QuickAttendanceQr/>}</div></>}</div>{next?.navigationUrl&&<a className="round-action" href={next.navigationUrl} target="_blank" rel="noreferrer">↗<small>Navigation</small></a>}</article>
      <article className="quiet-card"><span className="card-symbol" aria-hidden="true">✦</span><p className="eyebrow">{latest?"Für dich freigeschaltet":"Für deine Mitte"}</p><h3>{latest||"Deine Kursbegleitung"}</h3><p>{latest?"Dieser Inhalt passt zu deinem aktuellen gemeinsamen Kursstand.":"Nach deinen gemeinsamen Einheiten erscheinen hier die persönlich freigeschalteten Inhalte."}</p><button onClick={() => setView("kurse")}>{latest?"Inhalt ansehen":"Zu meinem Kurs"} <span>→</span></button></article>
      {Boolean(data?.missed.length)&&<article className="makeup-card compact"><p className="eyebrow">Ganz ohne Druck</p><h3>Ein Termin ist noch offen</h3><p>Dein Kurs bleibt für dich geöffnet. Wenn du möchtest, vereinbare persönlich eine Möglichkeit zum Nachholen.</p><button onClick={onMakeup}>Nachholtermin anfragen <span>→</span></button></article>}
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

export function KraftbaumApp() {
  const [view,setView]=useState<View>("baum");
  const [user,setUser]=useState<AuthUser|null|undefined>(undefined);
  const [onboarding,setOnboarding]=useState(false);
  const [setupRequired,setSetupRequired]=useState(false);
  const [emailVerified,setEmailVerified]=useState(()=>typeof window!=="undefined"&&new URL(window.location.href).searchParams.get("emailVerified")==="1");
  const dashboard=useDashboard(Boolean(user));
  useEffect(()=>{Promise.all([fetch("/api/me").then(r=>r.ok?r.json():{user:null}),fetch("/api/setup/status").then(r=>r.json())]).then(([me,setup])=>{setUser(me.user);setSetupRequired(setup.setupRequired)}).catch(()=>setUser(null));},[]);
  useEffect(()=>{if(user?.role==="user")fetch("/api/me/onboarding").then(response=>response.ok?response.json():{completed:true}).then(result=>setOnboarding(!result.completed)).catch(()=>setOnboarding(false))},[user]);
  useEffect(()=>{const url=new URL(window.location.href);if(url.searchParams.get("emailVerified")==="1"){url.searchParams.delete("emailVerified");window.history.replaceState({},"",`${url.pathname}${url.search}${url.hash}`)}},[]);
  useEffect(()=>{const requested=new URLSearchParams(window.location.search).get("view"),allowed:View[]=["baum","kurse","termine","nuetzliches","profil"];if(!allowed.includes(requested as View))return;const timer=window.setTimeout(()=>setView(requested as View),0);return()=>window.clearTimeout(timer)},[]);
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});navigator.serviceWorker?.controller?.postMessage("CLEAR_PRIVATE_CACHES");if("caches" in window)await caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key))));setUser(null);setView("baum");}
  const emailConfirmation=emailVerified&&<aside className="success-toast" role="status" aria-live="polite"><span><b>✓ E-Mail-Adresse bestätigt</b><small>Deine E-Mail-Adresse wurde erfolgreich bestätigt.</small></span><button type="button" onClick={()=>setEmailVerified(false)} aria-label="Meldung schließen">×</button></aside>,confirmation=<>{emailConfirmation}{user?.role==="user"&&!onboarding&&<PushNudge/>}</>;
  if(user===undefined)return <><div className="app-loading"><img className="loading-logo" src="/logo-kraftbaum.svg" alt=""/><p>Dein Kraftbaum erwacht …</p></div>{confirmation}</>;
  if(!user)return <>{confirmation}<AccessScreen setupRequired={setupRequired} onSuccess={setUser}/></>;
  if(view==="admin") return <>{confirmation}<AdminConsole close={()=>setView("baum")} admin={user} requireSecurity={user.role==="admin"&&!user.twoFactorEnabled}/></>;
  const profileImageChange=(present:boolean)=>setUser(current=>current?{...current,profileImage:present,avatarRevision:Date.now()}:current);
  const requestMakeup=()=>{setView("nuetzliches");window.setTimeout(()=>window.dispatchEvent(new Event("open-makeup-request")),60)};
  return <div className="app">{confirmation}{onboarding&&<UserOnboarding userId={user.id} data={dashboard} onDone={()=>setOnboarding(false)}/>}<Header user={user} onAdmin={()=>setView(user.role==="admin"?"admin":"profil")}/><div className="desktop-tabs">{nav.map(n=><button className={view===n.id?"active":""} onClick={()=>setView(n.id)} key={n.id}>{n.label}</button>)}</div>{view==="baum"&&<BaumView setView={setView} data={dashboard} onMakeup={requestMakeup}/>} {view==="kurse"&&(dashboard?<RealCourses data={dashboard} Tree={TreeScene}/>:<KurseView/>)}{view==="termine"&&(dashboard?<RealDates data={dashboard} onMakeup={requestMakeup}/>:<TermineView/>)}{view==="nuetzliches"&&<UsefulView/>}{view==="profil"&&<ProfileView user={user} onLogout={logout} onProfileImageChange={profileImageChange}/>}<footer className="app-footer"><div className="footer-brand"><img src="/logo-kraftbaum.svg" alt=""/><div><b>Stärke deine Mitte</b><span>Beckenboden · Mentoring · Zeit für dich</span></div></div><a className="footer-review" href="https://www.google.com/maps/place//data=!4m3!3m2!1s0x4798c7c661d37d01:0xbb1767c240562350!12e1?source=g.page.m.ia._&laa=nmx-review-solicitation-ia2" target="_blank" rel="noreferrer"><span aria-hidden="true">★★★★★</span><div><b>Deine Erfahrung zählt</b><small>Bewertung auf Google schreiben ↗</small></div></a><nav className="footer-legal" aria-label="Rechtliches"><b>Rechtliches</b><a href="/rechtliches/impressum" target="_blank" rel="noreferrer">Impressum</a><a href="/rechtliches/datenschutz" target="_blank" rel="noreferrer">Datenschutz</a><a href="/rechtliches/nutzungsbedingungen" target="_blank" rel="noreferrer">Nutzungsbedingungen</a><button type="button" onClick={()=>window.dispatchEvent(new Event("open-cookie-settings"))}>Cookie-Einstellungen</button></nav>{user.role==="admin"&&<AdminUpdate/>}</footer><nav className="mobile-nav">{nav.map(n=><button className={view===n.id?"active":""} onClick={()=>setView(n.id)} key={n.id}><i>{n.icon}</i>{n.label}</button>)}</nav></div>;
}
