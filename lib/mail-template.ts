const BRAND="Stärke deine Mitte";

function escapeHtml(value:string){return value.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]!))}
function origin(){return (process.env.APP_URL||"https://app.anja-tanzt.de").replace(/\/$/,"")}

export function legalLinks(){const base=origin();return {imprint:`${base}/rechtliches/impressum`,privacy:`${base}/rechtliches/datenschutz`,terms:`${base}/rechtliches/nutzungsbedingungen`}}

function bodyHtml(text:string){
  const escaped=escapeHtml(text);
  return escaped.split(/\n{2,}/).map(paragraph=>`<p style="margin:0 0 18px;color:#304039;font-size:16px;line-height:1.65">${paragraph.replace(/\n/g,"<br>").replace(/https?:\/\/[^\s<]+/g,url=>`<a href="${url}" style="color:#b66d37;font-weight:700;text-decoration:underline;word-break:break-word">${url}</a>`)}</p>`).join("");
}

export function brandedMail(subject:string,text:string){
  const base=origin(),legal=legalLinks(),title=subject.replace(/^Stärke deine Mitte\s*·\s*/,"");
  const html=`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f2eb;font-family:Arial,Helvetica,sans-serif;color:#263a32"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(title)} – ${BRAND}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2eb"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dfe3dc"><tr><td style="padding:30px 34px 24px;border-bottom:1px solid #e7e8e2"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="padding-right:14px"><img src="${base}/icon-192.png" width="52" height="52" alt="" style="display:block;width:52px;height:52px;border:0"></td><td><strong style="display:block;color:#254b3e;font-family:Georgia,serif;font-size:23px;line-height:1.15">${BRAND}</strong><span style="display:block;margin-top:5px;color:#77857e;font-size:11px;letter-spacing:1.6px;text-transform:uppercase">Anja Schellenberger</span></td></tr></table></td></tr><tr><td style="padding:36px 34px 28px"><p style="margin:0 0 9px;color:#b66d37;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Persönliche Nachricht</p><h1 style="margin:0 0 25px;color:#263a32;font-family:Georgia,serif;font-size:30px;line-height:1.2;font-weight:normal">${escapeHtml(title)}</h1>${bodyHtml(text)}</td></tr><tr><td style="padding:23px 34px;background:#254b3e;color:#e8eee9"><p style="margin:0 0 12px;font-size:12px;line-height:1.5">Diese Nachricht wurde von ${BRAND} gesendet.</p><p style="margin:0;font-size:12px;line-height:1.8"><a href="${legal.imprint}" style="color:#ffffff">Impressum</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${legal.privacy}" style="color:#ffffff">Datenschutz</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${legal.terms}" style="color:#ffffff">Nutzungsbedingungen</a></p></td></tr></table></td></tr></table></body></html>`;
  const plain=`${text.trim()}\n\n—\n${BRAND} · Anja Schellenberger\nImpressum: ${legal.imprint}\nDatenschutz: ${legal.privacy}\nNutzungsbedingungen: ${legal.terms}`;
  return {html,text:plain};
}
