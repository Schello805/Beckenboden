import {requireAdmin} from "@/lib/auth";
import {audit} from "@/lib/database";
import {pushSettings,sendPush} from "@/lib/push";

export async function POST(){
  const admin=await requireAdmin();
  if(!admin)return Response.json({error:"Der Testversand ist nur für angemeldete Admins verfügbar."},{status:403});
  if(!pushSettings())return Response.json({error:"Web Push ist noch nicht eingerichtet."},{status:409});
  const delivery=await sendPush(admin.id,{title:"Stärke deine Mitte",body:"Deine Push-Benachrichtigungen funktionieren auf diesem Gerät.",url:"/?view=profil"});
  audit(admin.id,"push.test","user",admin.id,delivery);
  if(!delivery.subscriptions)return Response.json({error:"Für dein Administrationskonto ist noch kein Gerät registriert. Öffne die Teilnehmeransicht und aktiviere Push im Profil."},{status:409});
  if(!delivery.delivered)return Response.json({error:`Die Testnachricht konnte von keinem Gerät angenommen werden.${delivery.removed?" Eine abgelaufene Geräteregistrierung wurde entfernt. Aktiviere Push im Profil erneut.":" Prüfe die Mitteilungseinstellungen des Geräts."}`,delivery},{status:502});
  return Response.json({message:`Testnachricht wurde von ${delivery.delivered} Gerät${delivery.delivered===1?"":"en"} angenommen.`,delivery});
}
