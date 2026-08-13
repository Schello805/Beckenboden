"use client";
import { useEffect } from "react";
export function PwaRegistration(){useEffect(()=>{if(!("serviceWorker" in navigator))return;let refreshing=false;const refresh=()=>{if(refreshing)return;refreshing=true;location.reload()};navigator.serviceWorker.addEventListener("controllerchange",refresh);navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"}).then(registration=>registration.update()).catch(()=>undefined);return()=>navigator.serviceWorker.removeEventListener("controllerchange",refresh)},[]);return null}
