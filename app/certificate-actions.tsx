"use client";
import Link from "next/link";
export function CertificateActions(){return <nav className="certificate-actions"><button type="button" className="primary" onClick={()=>window.print()}>Als PDF speichern oder drucken</button><Link href="/">Zurück zur App</Link></nav>}
