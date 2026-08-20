"use client";
/* Authenticated appearance images intentionally bypass the public image optimizer. */
/* eslint-disable @next/next/no-img-element */

import {useEffect,useRef,useState} from "react";
import type {CSSProperties} from "react";
import type {TreeDecoration} from "./user-dashboard";
import {zonedInputValue} from "@/lib/app-time";
import {DEFAULT_GROWTH_MESSAGES,normalizeGrowthMessages} from "@/lib/growth-messages";

type TreeSceneProps={
  progress?:number;
  courses?:number;
  completed?:number;
  growthMediaIds?:Array<string|null>;
  growthMessages?:string[];
  decorations?:TreeDecoration[];
  animateJourney?:boolean;
};

function GrowingTree({stage,mediaId}:{stage:number;mediaId?:string|null}){
  if(mediaId)return <img className={`growth-stage-image stage-${stage}`} src={`/api/media/${mediaId}`} alt={`Kraftbaum, Wachstumsstufe ${stage}`}/>;
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

export function TreeScene({progress=3,courses=1,completed=0,growthMediaIds=[],growthMessages=[...DEFAULT_GROWTH_MESSAGES],decorations=[],animateJourney=false}:TreeSceneProps){
  const targetStage=Math.min(8,Math.max(0,progress)),targetRef=useRef(targetStage),[displayStage,setDisplayStage]=useState(0),[fading,setFading]=useState(false),[previewing,setPreviewing]=useState(animateJourney),[memory,setMemory]=useState<TreeDecoration|null>(null);
  useEffect(()=>{targetRef.current=targetStage},[targetStage]);
  useEffect(()=>{if(!animateJourney)return;const timers:number[]=[];for(let stage=1;stage<=8;stage++)timers.push(window.setTimeout(()=>setDisplayStage(stage),stage*900));timers.push(window.setTimeout(()=>setFading(true),8*900+3000));timers.push(window.setTimeout(()=>{setDisplayStage(targetRef.current);setFading(false);setPreviewing(false)},8*900+3800));return()=>timers.forEach(window.clearTimeout)},[animateJourney]);
  const localNow=zonedInputValue(new Date()),month=Number(localNow.slice(5,7))-1,hour=Number(localNow.slice(11,13)),season=[11,0,1].includes(month)?"winter":[2,3,4].includes(month)?"spring":[5,6,7].includes(month)?"summer":"autumn",night=hour<7||hour>=19,visualStage=previewing||fading?displayStage:targetStage,messages=normalizeGrowthMessages(growthMessages);
  return <div className={`tree-scene ${season} ${night?"night":"day"}`} aria-label={`Kraftbaum mit ${courses} Kursästen und ${completed} Sternen`}>
    <div className="moon"/><div className="stars"><i/><i/><i/><i/></div>
    <div className={`growth-visual ${fading?"fading":""}`}><GrowingTree stage={visualStage} mediaId={growthMediaIds[visualStage]}/>{!previewing&&<blockquote className="growth-message" key={visualStage}>{messages[visualStage]}</blockquote>}</div>
    {!previewing&&decorations.length>0&&<div className="tree-decoration-layer" aria-label="Deine besonderen Erinnerungen">{decorations.map(decoration=><button type="button" key={decoration.id} aria-label={decoration.title} onClick={()=>setMemory(memory?.id===decoration.id?null:decoration)} style={{left:`${decoration.positionX}%`,top:`${decoration.positionY}%`,width:`${decoration.sizePercent}%`,transform:`translate(-50%,-50%) rotate(${decoration.rotation}deg)`}}><img src={`/api/media/${decoration.mediaId}`} alt=""/></button>)}</div>}
    {memory&&<aside className="tree-memory" role="status"><b>{memory.title}</b>{memory.memoryText&&<p>{memory.memoryText}</p>}<button type="button" onClick={()=>setMemory(null)} aria-label="Erinnerung schließen">×</button></aside>}
    <div className="course-stars" aria-hidden="true">{Array.from({length:completed},(_,i)=><i style={{"--star":i} as CSSProperties} key={i}>✦</i>)}</div><div className="ground"/>
  </div>;
}
