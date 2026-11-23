/* Hindu panchang (tithi, paksha, maas, Vikram Samvat) from an English date.
   Astronomy: Meeus low-precision Sun + main lunar terms; Lahiri ayanamsa.
   Months: Purnimanta (North India), Chaitradi Vikram Samvat. */
const Panchang = (()=>{
  const R=Math.PI/180, sn=x=>Math.sin(x*R), n360=x=>((x%360)+360)%360;
  const MAAS=["Chaitra","Vaishakh","Jyeshtha","Ashadh","Shravan","Bhadrapad","Ashwin","Kartik","Margashirsha","Paush","Magh","Phalgun"];
  const TITHI=["Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi"];
  function jd(y,m,d,h){ if(m<=2){y--;m+=12} const A=Math.floor(y/100),B=2-A+Math.floor(A/4);
    return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+h/24+B-1524.5; }
  function sun(J){const T=(J-2451545)/36525;const M=357.52911+35999.05029*T-0.0001537*T*T;
    const C=(1.914602-0.004817*T-0.000014*T*T)*sn(M)+(0.019993-0.000101*T)*sn(2*M)+0.000289*sn(3*M);
    const om=125.04-1934.136*T; return n360(280.46646+36000.76983*T+0.0003032*T*T+C-0.00569-0.00478*sn(om));}
  const LT=[[0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],
    [2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],
    [2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
    [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],
    [0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],
    [2,-2,-1,0,2048],[2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],[2,1,1,0,-810],
    [4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487]];
  function moon(J){const T=(J-2451545)/36525;
    const Lp=218.3164477+481267.88123421*T-0.0015786*T*T, D=297.8501921+445267.1114034*T-0.0018819*T*T,
      M=357.5291092+35999.0502909*T-0.0001536*T*T, Mp=134.9633964+477198.8675055*T+0.0087414*T*T,
      F=93.2720950+483202.0175233*T-0.0036539*T*T, E=1-0.002516*T-0.0000074*T*T,
      A1=119.75+131.849*T, A2=53.09+479264.290*T;
    let s=0; for(const [d,m,mp,f,c] of LT){ const e=Math.abs(m)===1?E:Math.abs(m)===2?E*E:1; s+=c*e*sn(d*D+m*M+mp*Mp+f*F); }
    s+=3958*sn(A1)+1962*sn(Lp-F)+318*sn(A2);
    const om=125.04452-1934.136261*T; return n360(Lp+s/1e6-0.00478*sn(om));}
  const elong=J=>n360(moon(J)-sun(J));
  const ayan=J=>23.85306+1.39722*(J-2451545)/36525;
  const sid=J=>n360(sun(J)-ayan(J));
  function newMoon(J){ for(let i=0;i<8;i++){ let e=elong(J); if(e>180)e-=360; J-=e/12.19; } return J; }
  function yearOf(J){ const z=Math.floor(J+0.5), a=Math.floor((z-1867216.25)/36524.25), A=z+1+a-Math.floor(a/4), B=A+1524,
      C=Math.floor((B-122.1)/365.25), D=Math.floor(365.25*C), Mo=Math.floor((B-D)/30.6001); return Mo>2?C-4716:C-4715; }
  /* dateStr "YYYY-MM-DD", timeStr "HH:MM" (IST). Without time, sunrise (~6:00 IST) = udaya tithi. */
  function compute(dateStr,timeStr){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr||"")) return null;
    const [y,m,d]=dateStr.split("-").map(Number);
    const doy=Math.floor((Date.UTC(y,m-1,d)-Date.UTC(y,0,0))/864e5);
    let h=6.3+0.85*Math.cos(2*Math.PI*(doy+10)/365);   // approx. sunrise in India (IST)
    if(/^\d{1,2}:\d{2}/.test(timeStr||"")){const [hh,mm]=timeStr.split(":").map(Number); h=hh+mm/60;}
    const J=jd(y,m,d,h-5.5);
    const e=elong(J), t=Math.floor(e/12)+1;               // 1..30
    const shukla=t<=15;
    const nm1=newMoon(J-e/12.19), nm2=newMoon(nm1+29.8);
    const s1=Math.floor(sid(nm1)/30), s2=Math.floor(sid(nm2)/30);
    const adhik = s1===s2;
    const amIdx=(s1+1)%12;                                // amanta month (0=Chaitra)
    let idx = amIdx, label;
    if(!shukla && !adhik) idx=(amIdx+1)%12;               // purnimanta: Krishna paksha belongs to next month
    label=(adhik?"Adhik ":"")+MAAS[idx];
    const chaitraNM = nm1 - amIdx*29.53 - (adhik?0:0);
    const vs = yearOf(chaitraNM+10) + 57;
    const tn = shukla?t:t-15;
    const tithi = t===15?"Purnima":t===30?"Amavasya":TITHI[tn-1];
    return { vs, month:label, monthName:MAAS[idx], adhik, paksha: shukla?"Shukla Paksha":"Krishna Paksha", tithi, tithiNum:tn, raw:t };
  }
  function sunriseH(y,m,d){const doy=Math.floor((Date.UTC(y,m-1,d)-Date.UTC(y,0,0))/864e5);return 6.3+0.85*Math.cos(2*Math.PI*(doy+10)/365)}
  function rawAt(y,m,d){ return Math.floor(elong(jd(y,m,d,sunriseH(y,m,d)-5.5))/12)+1; }
  const cache={};
  /* English date in `year` when (purnimanta, non-adhik) month + raw tithi (1..30) falls at sunrise */
  function findInYear(year,monthName,raw){
    const key=year+"|"+monthName+"|"+raw; if(key in cache) return cache[key];
    const iso=(dt)=>`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
    const scan=(target)=>{ for(let dt=new Date(year,0,1); dt.getFullYear()===year; dt.setDate(dt.getDate()+1)){
        if(rawAt(dt.getFullYear(),dt.getMonth()+1,dt.getDate())!==target) continue;
        const c=compute(iso(dt)); if(c && !c.adhik && c.monthName===monthName) return iso(dt); } return null; };
    let r=scan(raw); if(!r && raw<30) r=scan(raw+1);   // kshaya tithi -> next day
    return cache[key]=r;
  }
  const cacheT={};
  /* like findInYear, but tithi checked at hour h (IST) – e.g. 19 for pradosh, 23.75 for nishita */
  function findInYearT(year,monthName,raw,h){
    const key=year+"|"+monthName+"|"+raw+"|"+h; if(key in cacheT) return cacheT[key];
    const iso=(dt)=>`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
    const ts=`${Math.floor(h)}:${String(Math.round((h%1)*60)).padStart(2,"0")}`;
    let res=null;
    for(let dt=new Date(year,0,1); dt.getFullYear()===year; dt.setDate(dt.getDate()+1)){
      const y=dt.getFullYear(),m=dt.getMonth()+1,d=dt.getDate();
      if(Math.floor(elong(jd(y,m,d,h-5.5))/12)+1!==raw) continue;
      const c=compute(iso(dt),ts); if(c && !c.adhik && c.monthName===monthName){ res=iso(dt); break; } }
    return cacheT[key]=res;
  }
  /* every day of year: sunrise tithi info (for vrat lists) */
  function yearDays(year){ const out=[]; for(let dt=new Date(year,0,1); dt.getFullYear()===year; dt.setDate(dt.getDate()+1)){
      const y=dt.getFullYear(),m=dt.getMonth()+1,d=dt.getDate();
      out.push({iso:`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`,raw:rawAt(y,m,d),eve:Math.floor(elong(jd(y,m,d,19-5.5))/12)+1,night:Math.floor(elong(jd(y,m,d,21-5.5))/12)+1}); } return out; }
  return { compute, findInYear, findInYearT, yearDays, MAAS };
})();
/* ======================= Fields ======================= */
const VRAT_OPTS_F=["Ekadashi","Purnima","Amavasya","Pradosh","Sankashti Chaturthi","Karwa Chauth","Navratri","Mahashivratri","Janmashtami","Somvar","Mangalvar","Guruvar","Shanivar"];
const TITHI_OPTS=["","Pratipada (1)","Dwitiya (2)","Tritiya (3)","Chaturthi (4)","Panchami (5)","Shashthi (6)","Saptami (7)","Ashtami (8)","Navami (9)","Dashami (10)","Ekadashi (11)","Dwadashi (12)","Trayodashi (13)","Chaturdashi (14)","Purnima (15)","Amavasya (30)"];
const MONTH_OPTS=["","Chaitra","Vaishakh","Jyeshtha","Ashadh","Shravan","Bhadrapad","Ashwin","Kartik","Margashirsha","Paush","Magh","Phalgun"];
const SECTIONS = [
  { t:"Personal", f:[
    ["name","Poora naam",{req:1}],
    ["nickname","Ghar ka naam / Nickname"],
    ["relation","Family mein rishta (jaise Papa, Bua, Bhaiya)",{req:1}],
    ["gender","Gender",{sel:["","Male","Female","Other"]}],
    ["dob","Janam tarikh – English date (optional)",{type:"date"}],
    ["tob","Janam samay (optional)",{type:"time"}],
    ["hs_year","Janam tithi: Vikram Samvat (date se apne aap)",{type:"number"}],
    ["hs_month","Hindu mahina",{sel:MONTH_OPTS}],
    ["hs_paksha","Paksha",{sel:["","Shukla Paksha","Krishna Paksha"]}],
    ["hs_tithi","Tithi",{sel:TITHI_OPTS}],
    ["pob","Janam sthan"],
    ["blood","Blood group",{sel:["","A+","A-","B+","B-","AB+","AB-","O+","O-"]}],
    ["height","Height (jaise 5'8\")"],
    ["gotra","Gotra"],
    ["rashi","Rashi / Nakshatra"],
  ]},
  { t:"Family", f:[
    ["father","Pita ka naam"],
    ["mother","Mata ka naam"],
    ["marital","Vaivahik sthiti",{sel:["","Unmarried","Married","Widowed","Divorced"]}],
    ["spouse","Pati / Patni ka naam"],
    ["anniversary","Shaadi ki saalgirah (optional)",{type:"date"}],
    ["children","Bachche (naam, umar)",{area:1}],
    ["siblings","Bhai-behen",{area:1}],
  ]},
  { t:"Family Tree ke liye jodo", note:"Sabse aasaan: neeche “Ek rishta jodo” mein bas ek rishta chuno (jaise “Amit ki Behen”) – mata-pita, bhai-behen, chacha, bua, mama sab rishte apne aap jud jayenge. Ya seedha pita / mata / jeevansaathi chuno.", f:[
    ["q_member","⚡ Ek rishta jodo: kiske…",{member:1}],
    ["q_type","…kya lagte hain?",{sel:["","Beta / Beti","Bhai / Behen","Pati / Patni","Pita / Mata"]}],
    ["father_id","Pita (app mein se)",{member:1}],
    ["mother_id","Mata (app mein se)",{member:1}],
    ["spouse_id","Pati / Patni (app mein se)",{member:1}],
  ]},
  { t:"Contact", f:[
    ["mobile","Mobile",{type:"tel"}],
    ["whatsapp","WhatsApp (agar alag ho)",{type:"tel"}],
    ["email","Email",{type:"email"}],
    ["address","Abhi ka pata",{area:1,full:1}],
    ["city","Sheher"],
    ["native","Mool gaon / Native place"],
  ]},
  { t:"Padhai aur Kaam", f:[
    ["education","Qualification (degree, college)",{area:1,full:1}],
    ["occupation","Kaam / Profession"],
    ["company","Company / Business ka naam"],
    ["workcity","Kaam ka sheher"],
    ["income","Income (optional)"],
  ]},
  { t:"Aur jaankari", f:[
    ["languages","Bhashayein"],
    ["hobbies","Shauk / Hobbies"],
    ["diet","Khaana",{sel:["","Veg","Non-veg","Eggetarian","Jain","Vegan"]}],
    ["medical","Health notes / Allergy (optional)",{area:1,full:1}],
    ["emergency","Emergency contact (naam + number)",{full:1}],
    ["about","Apne baare mein kuch",{area:1,full:1}],
  ]},
  { t:"Vrat aur puja", f:[
    ["vrat","Kaunse vrat rakhte hain (calendar mein yaad dilayega)",{checks:VRAT_OPTS_F,full:1}],
  ]},
  { t:"Bachchon ke liye", note:"Sirf bachchon ke liye – school aur agle teeke (vaccine) ki tareekh. Teeke ki tareekh calendar mein aayegi.", f:[
    ["school","School / College"],
    ["standard","Class"],
    ["activity","Tuition / Activity"],
    ["vac_name","Agla teeka (vaccine) – naam"],
    ["vac_date","Agle teeke ki tareekh",{type:"date"}],
  ]},
  { t:"Rishta ke liye (shaadi)", note:"Agar shaadi ki baat chal rahi ho. Ye “Aur → Shaadi-rishte” aur biodata PDF mein aata hai.", f:[
    ["manglik","Manglik",{sel:["","Nahi","Haan","Anshik (aanshik)","Pata nahi"]}],
    ["kundli","Kundli / Guna details",{area:1,full:1}],
    ["pref","Jeevansaathi kaisa chahiye",{area:1,full:1}],
  ]},
  { t:"Documents – sirf expiry date", note:"Sirf expiry date daalo, document number kabhi mat daalna. Expiry se pehle calendar mein yaad dilayega.", f:[
    ["exp_passport","Passport expiry",{type:"date"}],
    ["exp_license","Driving licence expiry",{type:"date"}],
    ["exp_health","Health insurance renewal",{type:"date"}],
    ["exp_life","Life insurance premium",{type:"date"}],
    ["exp_vehicle","Gaadi insurance",{type:"date"}],
    ["exp_puc","PUC",{type:"date"}],
    ["exp_other_name","Koi aur document (naam)"],
    ["exp_other","Uski expiry",{type:"date"}],
  ]},
  { t:"Swargiya (purvaj ke liye)", note:"Jo ab hamare beech nahi hain, unke liye. Punyatithi aur Pitru Paksha shraddh ki tithi apne aap nikal jayegi.", f:[
    ["alive","Sthiti",{sel:["Jeevit","Swargiya"]}],
    ["dod","Dehant ki tarikh",{type:"date"}],
    ["memories","Yaadein / unke baare mein",{area:1,full:1}],
  ]},
];
const ALL_FIELDS = SECTIONS.flatMap(s=>s.f);
const HS=["hs_year","hs_month","hs_paksha","hs_tithi"];
const DOCS=[["exp_passport","Passport"],["exp_license","Driving licence"],["exp_health","Health insurance"],["exp_life","Life insurance premium"],["exp_vehicle","Gaadi insurance"],["exp_puc","PUC"]];
const HIDE_IN_VIEW=new Set(["q_member","q_type","name","father_id","mother_id","spouse_id","alive","exp_other_name"]);
const PDF_SKIP=new Set(["q_member","q_type","vrat","school","standard","activity","vac_name","vac_date","medical","emergency","income","father_id","mother_id","spouse_id","alive","dod","memories","email","address","whatsapp",...DOCS.map(d=>d[0]),"exp_other","exp_other_name"]);

/* ======================= State ======================= */
let db=null, user=null, uid=null, isAdmin=false, canWrite=null, downloads=null;
let members=[], events=[], family={}, loaded=false, current=null;
let calYear=new Date().getFullYear();
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),2400)}
function setStatus(m,err){const s=$("#status");if(!m){s.style.display="none";return}s.style.display="block";s.className="notice"+(err?" err":"");s.innerHTML=m}
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const pad=n=>String(n).padStart(2,"0");
const isoOf=dt=>`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
function parseD(v){if(!v||!/^\d{4}-\d{2}-\d{2}$/.test(v))return null;const [y,m,d]=v.split("-").map(Number);return {y,m,d}}
function initials(n){return (n||"?").trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase()}
const okImg=p=>p && /^data:image\/(jpeg|png|webp);base64,/.test(p);
function avatar(m,cls=""){
  if(okImg(m.photo)) return `<div class="av ${cls}"><img alt="" src="${esc(m.photo)}"></div>`;
  return `<div class="av ${cls}">${esc(initials(m.name))}</div>`;
}
function age(dob,until){if(!dob)return null;const d=new Date(dob+"T00:00:00");if(isNaN(d))return null;const n=until?new Date(until+"T00:00:00"):new Date();let a=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()==d.getMonth()&&n.getDate()<d.getDate()))a--;return a>=0?a:null}
function fmtDate(v){if(!v)return"";const d=new Date(v+"T00:00:00");if(isNaN(d))return v;return d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
const isGone=m=>m.alive==="Swargiya";
const byId=id=>members.find(m=>m.id===id);
function myOwn(m){ const k=user&&user.key; return !!k && (m.ownerKey===k || m.ownerEmail===k); }
function canEditMember(m){ if(canWrite===false) return false; return isAdmin || (uid && (m.id===uid || m.createdBy===uid)) || myOwn(m); }
const canWriteShared=()=>!!db && canWrite!==false;

/* ======================= Panchang helpers ======================= */
function tithiObj(r){ if(!r) return {}; return {hs_year:String(r.vs),hs_month:r.month,hs_paksha:r.paksha,hs_tithi:r.raw===15?"Purnima (15)":r.raw===30?"Amavasya (30)":`${r.tithi} (${r.tithiNum})`}; }
function birthTithi(m){
  if(m.hs_month||m.hs_tithi) return {hs_year:m.hs_year,hs_month:m.hs_month,hs_paksha:m.hs_paksha,hs_tithi:m.hs_tithi};
  if(m.dob){ try{ return tithiObj(Panchang.compute(m.dob,m.tob)) }catch(e){} }
  return {};
}
function tithiText(o){
  const t=(o.hs_tithi||"").replace(/\s*\(\d+\)$/,"");
  const parts=[o.hs_month,o.hs_paksha,t].filter(Boolean).join(" ");
  const y=o.hs_year?`Vikram Samvat ${o.hs_year}`:"";
  return [parts,y].filter(Boolean).join(", ");
}
function rawFrom(o){ // -> {month, raw}
  if(!o.hs_month||!o.hs_tithi) return null;
  const n=+((o.hs_tithi.match(/\((\d+)\)/)||[])[1]); if(!n) return null;
  const month=o.hs_month.replace(/^Adhik\s+/,"");
  let raw = n===30?30 : n===15?15 : (o.hs_paksha==="Krishna Paksha"? n+15 : n);
  return {month,raw};
}
function deathTithi(m){ if(!m.dod) return null; try{ return Panchang.compute(m.dod) }catch(e){ return null } }
function shraddhTarget(r){ // Pitru Paksha: purnimanta Ashwin Krishna; Purnima -> Bhadrapad Purnima
  if(!r) return null;
  if(r.raw===15) return {month:"Bhadrapad",raw:15,label:"Purnima Shraddh"};
  if(r.raw===30) return {month:"Ashwin",raw:30,label:"Sarvapitri Amavasya"};
  const n=r.raw>15?r.raw-15:r.raw;
  return {month:"Ashwin",raw:n+15,label:`${r.tithi} Shraddh`};
}

/* ======================= Events for a year ======================= */
function yearEvents(year){
  const ev=[];
  const push=(iso,o)=>{const p=parseD(iso); if(!p) return; ev.push({iso,m:p.m,d:p.d,cat:"parivar",...o});};
  members.forEach(mb=>{
    const base={name:mb.name||"",rel:mb.relation||"",id:mb.id,mobile:mb.mobile||mb.whatsapp||"",spouse:mb.spouse_id&&byId(mb.spouse_id)?byId(mb.spouse_id).name:(mb.spouse||"")};
    const dob=parseD(mb.dob), ann=parseD(mb.anniversary);
    if(!isGone(mb)){
      if(dob){ const iso=`${year}-${pad(dob.m)}-${pad(dob.d)}`; const n=year-dob.y;
        push(iso,{...base,type:"Birthday",icon:"🎂",sub:n>0?`${n}va janamdin`:"",yearly:true}); }
      const bt=rawFrom(birthTithi(mb));
      if(bt){ const iso=Panchang.findInYear(year,bt.month,bt.raw);
        if(iso) push(iso,{...base,type:"Tithi Birthday",icon:"🪔",sub:tithiText(birthTithi(mb)).replace(/, Vikram.*$/,"")}); }
      if(ann){ const iso=`${year}-${pad(ann.m)}-${pad(ann.d)}`; const n=year-ann.y;
        push(iso,{...base,type:"Anniversary",icon:"💍",sub:(n>0?`${n} saal`:"")+(base.spouse?` · ${base.spouse} ke saath`:""),yearly:true}); }
      DOCS.forEach(([k,l])=>{ const p=parseD(mb[k]); if(p&&p.y===year) push(mb[k],{...base,type:"Expiry",icon:"📄",sub:l,private:true}); });
      const pv=parseD(mb.vac_date); if(pv&&pv.y===year) push(mb.vac_date,{...base,type:"Vaccine",icon:"💉",sub:mb.vac_name||"Teeka"});
      const po=parseD(mb.exp_other); if(po&&po.y===year) push(mb.exp_other,{...base,type:"Expiry",icon:"📄",sub:mb.exp_other_name||"Document",private:true});
    } else {
      const dd=parseD(mb.dod);
      if(dd){ push(`${year}-${pad(dd.m)}-${pad(dd.d)}`,{...base,type:"Punyatithi (date)",icon:"🙏",sub:year-dd.y>0?`${year-dd.y} varsh`:"",yearly:true});
        const r=deathTithi(mb);
        if(r){ const pt=Panchang.findInYear(year,r.monthName,r.raw);
          if(pt) push(pt,{...base,type:"Punyatithi (tithi)",icon:"🪔",sub:`${r.month} ${r.paksha} ${r.tithi}`});
          const st=shraddhTarget(r); const sd=st&&Panchang.findInYear(year,st.month,st.raw);
          if(sd) push(sd,{...base,type:"Shraddh",icon:"🌾",sub:`Pitru Paksha – ${st.label}`}); }
      }
    }
  });
  events.forEach(e=>{const p=parseD(e.date); if(p&&p.y===year) push(e.date,{name:e.title||"Event",rel:e.place||"",type:"Family event",icon:"🎉",sub:e.place||"",eid:e.id});});
  const keepers=v=>members.filter(m=>!isGone(m)&&(m.vrat||"").split(",").includes(v));
  festivalDates(year).forEach(f=>{const k=f.vrat?keepers(f.vrat):[]; push(f.iso,{name:L(f.name,f.hi),rel:"",type:"Tyohar",icon:f.icon,sub:(LANG==="hi"?"":f.hi)+(k.length?` · Vrat: ${k.map(m=>(m.name||"").split(" ")[0]).join(", ")}`:""),cat:"tyohar",fest:f});});
  vratDates(year).forEach(v=>{const k=keepers(v.vrat); push(v.iso,{name:L(v.label,VRAT_HI[v.vrat]||v.label),rel:"",type:"Vrat",icon:"🙏",sub:k.length?k.map(m=>(m.name||"").split(" ")[0]).join(", ")+" ka vrat":"",cat:"vrat",kept:k.length>0});});
  ev.sort((a,b)=>a.m-b.m||a.d-b.d||(a.cat==="parivar"?0:1)-(b.cat==="parivar"?0:1)||a.name.localeCompare(b.name));
  return ev;
}
function upcoming(days=30){
  const t=new Date(); t.setHours(0,0,0,0); const y=t.getFullYear();
  return [...yearEvents(y),...yearEvents(y+1)].map(e=>({...e,in:Math.round((new Date(e.iso+"T00:00:00")-t)/864e5)}))
    .filter(e=>e.in>=0&&e.in<=days).sort((a,b)=>a.in-b.in);
}
const TL={"Birthday":"Birthday – tarikh se","Tithi Birthday":"Birthday – tithi se","Anniversary":"Anniversary – tarikh se","Punyatithi (date)":"Punyatithi – tarikh se","Punyatithi (tithi)":"Punyatithi – tithi se","Shraddh":"Shraddh – tithi se","Expiry":"Expiry","Family event":"Family event"};
const tl=e=>TL[e.type]||e.type;
function gcalLink(e){
  const st=new Date(e.iso+"T00:00:00"); const en=new Date(st); en.setDate(en.getDate()+1);
  const f=x=>`${x.getFullYear()}${pad(x.getMonth()+1)}${pad(x.getDate())}`;
  const title=`${e.icon} ${e.name}${e.rel&&e.type!=="Family event"?` (${e.rel})`:""} – ${tl(e)}${e.type==="Expiry"?": "+e.sub:""}`;
  const details=`${e.sub||""}${e.mobile?"\nMobile: "+e.mobile:""}\n– Hamara Parivar app`;
  let u="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(title)+"&dates="+f(st)+"/"+f(en)+"&details="+encodeURIComponent(details);
  if(e.yearly) u+="&recur="+encodeURIComponent("RRULE:FREQ=YEARLY");
  return u;
}
function waText(e,when){
  const w = when===0?"Aaj":when===1?"Kal":fmtDate(e.iso)+" ko";
  switch(e.type){
    case "Birthday": return `🎂 ${w} ${e.name}${e.rel?` (${e.rel})`:""} ka janamdin hai (tarikh se)${e.sub?` – ${e.sub}`:""}! Dher saari badhaiyan aur aashirwad 🎉🙏`;
    case "Tithi Birthday": return `🪔 ${w} tithi ke anusaar ${e.name} ka janamdin hai (${e.sub}). Bahut bahut badhai! 🎉`;
    case "Anniversary": return `💍 ${w} ${e.name}${e.spouse?` aur ${e.spouse}`:""} ki shaadi ki saalgirah hai (tarikh se)${e.sub&&/saal/.test(e.sub)?` – ${e.sub.split(" ·")[0]}`:""}! Hardik shubhkamnayein 💐`;
    case "Punyatithi (date)": case "Punyatithi (tithi)": return `🙏 ${w} ${e.name} ki punyatithi hai (${e.type==="Shraddh"?"":e.type.includes("tithi")?"tithi se – "+e.sub:"tarikh se"}). Aaiye sab milkar unhe yaad karein aur shraddhanjali dein. 🪔`;
    case "Shraddh": return `🌾 ${w} ${e.name} ka shraddh hai (tithi se – ${e.sub}). 🙏`;
    case "Tyohar": return `${e.icon} ${w} ${e.fest?e.fest.name:e.name} hai! Aap sabko ${e.fest?e.fest.name:e.name} ki hardik shubhkamnayein 🙏✨`;
    case "Family event": return `🎉 ${w}: ${e.name}${e.sub?` – ${e.sub}`:""}. Sab zaroor aana! 🙏`;
    default: return "";
  }
}
const waLink=t=>"https://wa.me/?text="+encodeURIComponent(t);

/* ======================= Tabs ======================= */
const TABS=["members","calendar","tree","parivar","events","more"];
function showTab(t){
  if(!TABS.includes(t)) t="members";
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("on",b.dataset.tab===t));
  TABS.forEach(x=>{$("#v-"+x).style.display=x===t?"":"none"});
  $("#homeExtras").style.display=t==="members"?"":"none";
  $("#bdays").style.display=(t==="members"||t==="calendar")?"":"none";
  window.scrollTo(0,0);
  renderTab(t);
}
function curTab(){return (document.querySelector(".tab.on")||{}).dataset?.tab||"members"}
function renderTab(t){({members:renderMembers,calendar:renderCalendar,tree:renderTree,parivar:renderParivar,events:renderEvents,more:renderMore})[t]();}
function renderAll(){ renderTop(); renderTab(curTab()); }
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{showTab(b.dataset.tab);try{history.replaceState(null,"","#"+b.dataset.tab)}catch(e){}});
window.addEventListener("hashchange",()=>showTab(location.hash.slice(1)));

/* ======================= Top + upcoming ======================= */
function renderTop(){
  try{ renderHomeExtras(); }catch(e){ console.error(e) }
  const mine=byId(uid);
  $("#myBtn").innerHTML = mine ? avatar(mine,"sm") : "✍️";
  $("#myBtn").disabled = !db || !uid;
  $("#addBtn").style.display = (db && isAdmin) ? "" : "none";
  const alive=members.filter(m=>!isGone(m)).length;
  $("#countLine").textContent = members.length ? `${alive} member${alive!==1?"s":""}${members.length>alive?` · ${members.length-alive} purvaj`:""}` : "Family ka poora biodata, ek jagah";
  const up=loaded?upcoming(30).filter(e=>(!e.private||e.id===uid||isAdmin)&&(e.cat==="tyohar"?e.in<=10:e.cat==="vrat"?(e.kept&&e.in<=2):true)):[];
  window._up=up;
  $("#bdays").innerHTML = up.map((e,i)=>{
    const tx=waText(e,e.in);
    return `<div class="bday"><b>${e.icon} ${esc(e.name)}</b>${esc(tl(e))}${e.type==="Expiry"?": "+esc(e.sub):""} · <span class="when">${e.in===0?"Aaj!":e.in===1?"Kal":e.in+" din mein"}</span>
      ${tx&&e.in<=1?`<a class="wa" href="${esc(waLink(tx))}" target="_blank" rel="noopener">💬 WhatsApp pe bhejo</a>`:""}${POSTER_TYPES[e.type]?`<button class="pbtn" data-up="${i}">🖼️ Poster banao</button>`:""}</div>`;
  }).join("");
}

/* ======================= Members list ======================= */
function renderMembers(){
  const q=($("#search").value||"").toLowerCase().trim();
  $("#search").style.display = members.length>3 ? "" : "none";
  if(!loaded){ $("#grid").innerHTML=""; return; }
  if(!members.length){
    $("#grid").innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Abhi koi biodata nahi hai</h3>Upar <b>“Apna biodata bharo”</b> dabao aur shuruaat karo. Phir app family ke saath share karo.</div>`; return;
  }
  const list = members.filter(m=>!q || [m.name,m.nickname,m.relation,m.city,m.native,m.occupation].join(" ").toLowerCase().includes(q))
    .sort((a,b)=>(isGone(a)-isGone(b))||(a.name||"").localeCompare(b.name||""));
  if(!list.length){ $("#grid").innerHTML=`<div class="empty" style="grid-column:1/-1">Koi match nahi mila.</div>`; return; }
  $("#grid").innerHTML = list.map(m=>{
    const a=isGone(m)?null:age(m.dob);
    return `<button class="mcard${isGone(m)?" gone":""}" data-id="${esc(m.id)}">${avatar(m)}<div>
      <div class="mname">${isGone(m)?"🙏 Swa. ":""}${esc(m.name||"Bina naam")}</div>
      ${(()=>{const me=byId(uid); if(!me||me.id===m.id) return ""; const rr=relTo(m,me); return rr&&rr.exact?`<span class="pill">${m.gender==="Female"?"Aapki":"Aapke"} ${esc(rr.term)}</span>`:"";})()}
      <div class="mrel">${esc(m.relation||"")}${a!==null?` · ${a} saal`:""}${m.city&&!isGone(m)?` · ${esc(m.city)}`:""}</div>
      ${m.id===uid?'<span class="pill me">Aap</span>':""}
    </div></button>`;
  }).join("");
}
$("#bdays").addEventListener("click",ev=>{const b=ev.target.closest(".pbtn");if(b)openPoster(window._up[+b.dataset.up])});
$("#grid").addEventListener("click",e=>{const b=e.target.closest(".mcard");if(b)openView(b.dataset.id)});
$("#search").addEventListener("input",renderMembers);

/* ======================= Calendar ======================= */
let calFilter="sab";
const calFilt=e=>(!e.private||e.id===uid||isAdmin)&&(calFilter==="sab"?(e.cat!=="vrat"||e.kept):e.cat===calFilter);
function renderCalendar(){
  $("#calYear").textContent=calYear;
  const ev=yearEvents(calYear).filter(calFilt);
  const n=new Date(); const todayIso=isoOf(n);
  if(!ev.length){$("#cal").innerHTML=`<div class="empty"><h3>Is saal koi date nahi</h3>Jab members apni janam tarikh, anniversary ya dates bharenge, yahan month-wise dikhegi.</div>`;return}
  window._cal=ev;
  $("#cal").innerHTML=MONTHS.map((mn,i)=>{
    const list=ev.filter(e=>e.m===i+1); if(!list.length) return "";
    return `<div class="month"><h3>${mn} ${calYear}<small>${list.length} ${list.length>1?"dates":"date"}</small></h3>${list.map(e=>{
      const wd=new Date(e.iso+"T00:00:00").toLocaleDateString("hi-IN",{weekday:"short"});
      return `<div class="ev cat-${e.cat}${e.iso===todayIso?" today":""}${e.type==="Expiry"?" exp":""}"><div class="d">${e.d}<small>${esc(wd)}</small></div>
        <div class="who"><b>${e.icon} ${esc(e.name)}</b><span><b class="basis">${esc(tl(e))}</b>${e.rel&&e.type!=="Family event"?` · ${esc(e.rel)}`:""}${e.sub?` · ${esc(e.sub)}`:""}</span></div>
        ${POSTER_TYPES[e.type]?`<button class="pst" data-ci="${ev.indexOf(e)}" title="Wish poster">🖼️</button>`:""}<a class="rem" href="${esc(gcalLink(e))}" target="_blank" rel="noopener" title="Phone calendar mein reminder">🔔</a></div>`}).join("")}</div>`;
  }).join("");
}
$("#cal").addEventListener("click",ev=>{const b=ev.target.closest(".pst");if(b)openPoster(window._cal[+b.dataset.ci])});
$("#calChips").addEventListener("click",e=>{const c=e.target.closest(".chip");if(!c)return;calFilter=c.dataset.f;document.querySelectorAll("#calChips .chip").forEach(x=>x.classList.toggle("on",x===c));renderCalendar();});
$("#prevYear").onclick=()=>{calYear--;renderCalendar()};
$("#nextYear").onclick=()=>{calYear++;renderCalendar()};
async function downloadExcel(){
  const ev=yearEvents(calYear).filter(calFilt);
  if(!ev.length){toast("Is saal koi date nahi hai");return}
  if(typeof XLSX==="undefined"){ toast("Excel ban rahi hai…"); try{ await loadLib("xlsx"); }catch(e){ toast("Excel tool load nahi hua – internet check karo"); return; } }
  if(!downloads){toast("Is device pe download available nahi hai");return}
  const rows=[["Mahina","Tareekh","Din","Naam","Rishta","Event","Vivaran","Mobile"]];
  ev.forEach(e=>rows.push([MONTHS[e.m-1],fmtDate(e.iso),new Date(e.iso+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long"}),e.name,(e.type==="Family event"||e.cat!=="parivar")?"":e.rel,tl(e),e.sub||"",e.mobile||""]));
  const cols=[{wch:11},{wch:13},{wch:11},{wch:24},{wch:14},{wch:18},{wch:34},{wch:14}];
  const ws=XLSX.utils.aoa_to_sheet(rows); ws["!cols"]=cols; ws["!autofilter"]={ref:"A1:H"+rows.length};
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Saal "+calYear);
  MONTHS.forEach(mn=>{const r=rows.filter((x,j)=>j>0&&x[0]===mn); if(!r.length)return;
    const s=XLSX.utils.aoa_to_sheet([rows[0],...r]); s["!cols"]=cols; XLSX.utils.book_append_sheet(wb,s,mn.slice(0,3));});
  const buf=XLSX.write(wb,{bookType:"xlsx",type:"array"});
  try{await downloads.save({filename:`Parivar Calendar ${calYear}.xlsx`,data:new Blob([buf])});toast("Excel save ho gayi ✓")}
  catch(e){ if(e&&e.code!=="declined") toast("Download nahi hua"); }
}
$("#xlsBtn").onclick=downloadExcel;

/* ======================= Family tree ======================= */
function spouseOf(m){
  if(m.spouse_id&&byId(m.spouse_id)) return byId(m.spouse_id);
  return members.find(x=>x.spouse_id===m.id)||null;
}
const hasParentInApp=m=>(m.father_id&&byId(m.father_id))||(m.mother_id&&byId(m.mother_id));
const birthKey=m=>m.dob||"9999";
function renderTree(){
  if(!loaded){$("#tree").innerHTML="";return}
  if(!members.length){$("#tree").innerHTML=`<div class="empty"><h3>Tree khaali hai</h3>Pehle members jodo.</div>`;return}
  const seen=new Set();
  const node=(m)=>{
    if(seen.has(m.id)) return "";
    const sp=spouseOf(m); seen.add(m.id); if(sp) seen.add(sp.id);
    const ids=[m.id, sp&&sp.id].filter(Boolean);
    const kids=members.filter(k=>!seen.has(k.id)&&(ids.includes(k.father_id)||ids.includes(k.mother_id))).sort((a,b)=>birthKey(a).localeCompare(birthKey(b)));
    const person=p=>`<button class="tp${isGone(p)?" gone":""}" data-id="${esc(p.id)}">${avatar(p,"sm")}<span>${isGone(p)?"🙏 ":""}${esc((p.name||"").split(" ")[0]||"?")}</span><small>${esc(p.relation||"")}</small></button>`;
    const inner=kids.map(k=>node(k)).filter(Boolean);
    return `<li><div class="couple">${person(m)}${sp?`<span class="amp">❤</span>${person(sp)}`:""}</div>${inner.length?`<ul>${inner.map(x=>x).join("")}</ul>`:""}</li>`;
  };
  // roots: no parent in app, and not married to someone who has a parent in app
  const roots=members.filter(m=>!hasParentInApp(m) && !(spouseOf(m)&&hasParentInApp(spouseOf(m)))).sort((a,b)=>birthKey(a).localeCompare(birthKey(b)));
  let html=roots.map(node).filter(Boolean);
  members.forEach(m=>{ if(!seen.has(m.id)) html.push(node(m)); });
  const linked=members.some(m=>m.father_id||m.mother_id||m.spouse_id);
  $("#tree").innerHTML=(linked?"":`<div class="help">💡 Tree banane ke liye har member ke biodata mein <b>“Family Tree ke liye jodo”</b> section mein pita / mata / pati-patni chuno.</div>`)+
    `<div class="tree-scroll"><div class="tree"><ul>${html.join("")}</ul></div></div>`;
}
$("#tree").addEventListener("click",e=>{const b=e.target.closest(".tp");if(b)openView(b.dataset.id)});

/* ======================= Parivar (kuldevi etc.) ======================= */
const FAM_FIELDS=[["surname","Parivar ka naam / Upnaam"],["kuldevi","Kuldevi"],["kuldevta","Kuldevta"],["gotra","Gotra"],["mool_gaon","Mool gaon / Purvajon ka sthan"],["purohit","Kul purohit / Pandit ji (naam, sampark)"],["mandir","Kuldevi mandir ka sthan"],["riti","Riti-rivaaz aur paramparayein",1],["history","Parivar ka itihaas",1]];
function renderParivar(){
  const f={kuldevi:"Sachiyay Mata (सच्चियाय माता)",...(family||{})}; if(!f.kuldevi) f.kuldevi="Sachiyay Mata (सच्चियाय माता)";
  const rows=FAM_FIELDS.filter(([k])=>f[k]).map(([k,l])=>`<dt>${esc(l)}</dt><dd>${esc(f[k])}</dd>`).join("");
  const gone=members.filter(isGone);
  $("#parivar").innerHTML=`
    <div class="kdhero" id="kdHero"><img src="kuldevi.jpg" alt="Kuldevi Sachiyay Mata"><div class="kdcap">॥ जय सच्चियाय माता ॥<small>${L("Kuldevi – Sachiyay Mata","कुलदेवी – सच्चियाय माता")}</small></div></div>
    <div class="sec"><h4>🛕 Kul aur Parampara</h4>${rows?`<dl class="kv">${rows}</dl>`:`<p class="sub" style="margin:0">Abhi kuch nahi bhara gaya.${isAdmin?" Neeche Edit dabao.":" Owner yahan jaankari bharenge."}</p>`}
      ${isAdmin&&db?`<div class="footer-actions"><button class="btn" id="famEdit">✏️ Edit karo</button></div>`:""}</div>
    <div class="sec"><h4>🙏 Hamare Purvaj</h4>${gone.length?gone.map(m=>{
      const r=deathTithi(m), st=shraddhTarget(r);
      return `<button class="mcard gone" data-id="${esc(m.id)}" style="margin-top:8px">${avatar(m)}<div><div class="mname">Swa. ${esc(m.name)}</div>
        <div class="mrel">${esc(m.relation||"")}${m.dod?` · Dehant: ${esc(fmtDate(m.dod))}`:""}</div>
        ${r?`<div class="mrel">🪔 Punyatithi: ${esc(r.month+" "+r.paksha+" "+r.tithi)}${st?` · Shraddh: ${esc(st.label)}`:""}</div>`:""}</div></button>`}).join("")
      :`<p class="sub" style="margin:0">Kisi member ke biodata mein “Sthiti: Swargiya” chunoge to woh yahan dikhenge.</p>`}</div>`;
  const b=$("#famEdit"); if(b) b.onclick=openFamForm;
  $("#kdHero").onclick=()=>{const lb=$("#lightbox");lb.innerHTML=`<img alt="Sachiyay Mata" src="kuldevi.jpg"><div class="lb-actions"><button class="btn" id="lbClose">🙏 Band karo</button></div>`;lb.classList.add("open");$("#lbClose").onclick=()=>lb.classList.remove("open");};
  $("#parivar").querySelectorAll(".mcard").forEach(x=>x.onclick=()=>openView(x.dataset.id));
}
function openFamForm(){
  const f=family||{};
  openSheet(`<div class="sheet-head"><h2>Kul aur Parampara</h2><button class="x" id="cls">×</button></div>
    <form id="famForm"><div class="sec"><div class="fgrid">${FAM_FIELDS.map(([k,l,a])=>`<label class="f${a?" full":""}">${esc(l)}${a?`<textarea name="${k}" maxlength="4000">${esc(f[k]||"")}</textarea>`:`<input name="${k}" value="${esc(f[k]||"")}" maxlength="200">`}</label>`).join("")}</div></div>
    <div class="footer-actions"><button type="button" class="btn plain" id="cancelBtn">Cancel</button><button class="btn" id="saveBtn">💾 Save karo</button></div></form>`);
  $("#cls").onclick=closeSheet; $("#cancelBtn").onclick=closeSheet;
  $("#famForm").onsubmit=async e=>{e.preventDefault(); const fd=new FormData(e.target); const data={};
    FAM_FIELDS.forEach(([k])=>data[k]=String(fd.get(k)||"").trim()); data.updatedAt=Date.now();
    $("#saveBtn").disabled=true;
    try{ await db.collection("family").doc("info").set(data); family=data; closeSheet(); renderParivar(); toast("Save ho gaya ✓"); }
    catch(err){ toast("Save nahi hua"); $("#saveBtn").disabled=false; }};
}

/* ======================= Events & album ======================= */
function renderEvents(){
  if(!loaded){$("#eventsList").innerHTML="";return}
  $("#addEvent").style.display=canWriteShared()?"":"none";
  const today=isoOf(new Date());
  const list=[...events].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const up=list.filter(e=>(e.date||"")>=today).reverse(), past=list.filter(e=>(e.date||"")<today);
  const card=e=>`<button class="evcard" data-id="${esc(e.id)}"><div class="evd">${e.date?`<b>${new Date(e.date+"T00:00:00").getDate()}</b>${esc(new Date(e.date+"T00:00:00").toLocaleDateString("en-IN",{month:"short",year:"2-digit"}))}`:"—"}</div>
    <div class="who"><b>${esc(e.title||"Event")}</b><span>${esc(e.place||"")}${e.photoCount?` · 📷 ${e.photoCount}`:""}</span></div><span class="chev">›</span></button>`;
  $("#eventsList").innerHTML = !list.length?`<div class="empty"><h3>Abhi koi event nahi</h3>Shaadi, puja, get-together – tareekh aur photos ke saath yahan jodo.</div>`:
    (up.length?`<h4 class="lbl">Aane wale</h4>${up.map(card).join("")}`:"")+(past.length?`<h4 class="lbl">Yaadein</h4>${past.map(card).join("")}`:"");
}
$("#eventsList").addEventListener("click",e=>{const b=e.target.closest(".evcard");if(b)openEvent(b.dataset.id)});
$("#addEvent").onclick=()=>openEventForm();
function openEventForm(id){
  const e=id?events.find(x=>x.id===id)||{}:{};
  openSheet(`<div class="sheet-head"><h2>${id?"Event edit":"Naya event"}</h2><button class="x" id="cls">×</button></div>
    <form id="evForm"><div class="sec"><div class="fgrid">
      <label class="f full">Event ka naam <span class="req">*</span><input name="title" maxlength="120" value="${esc(e.title||"")}" placeholder="jaise Rahul ki shaadi, Diwali puja"></label>
      <label class="f">Tareekh<input type="date" name="date" value="${esc(e.date||"")}"></label>
      <label class="f">Jagah<input name="place" maxlength="120" value="${esc(e.place||"")}"></label>
      <label class="f full">Vivaran<textarea name="desc" maxlength="2000">${esc(e.desc||"")}</textarea></label>
    </div></div>
    <div class="footer-actions">${id&&(isAdmin||e.createdBy===uid)?'<button type="button" class="btn danger" id="delEv">Delete</button>':""}<button type="button" class="btn plain" id="cancelBtn">Cancel</button><button class="btn" id="saveBtn">💾 Save karo</button></div>
    <div class="confirm" id="confirmBox">Event aur uski saari photos delete karni hain?<div class="footer-actions"><button type="button" class="btn plain" id="noDel">Nahi</button><button type="button" class="btn danger" id="yesDel">Haan, delete</button></div></div></form>`);
  $("#cls").onclick=closeSheet; $("#cancelBtn").onclick=()=>id?openEvent(id):closeSheet();
  const d=$("#delEv"); if(d){d.onclick=()=>$("#confirmBox").classList.add("open");$("#noDel").onclick=()=>$("#confirmBox").classList.remove("open");
    $("#yesDel").onclick=async()=>{ try{ const ps=await loadPhotos(id); for(const p of ps){ try{await db.collection("photos").doc(p.id).delete()}catch(x){} }
      await db.collection("events").doc(id).delete(); events=events.filter(x=>x.id!==id); closeSheet(); renderAll(); toast("Delete ho gaya"); }catch(x){toast("Delete nahi hua")} };}
  $("#evForm").onsubmit=async ev=>{ev.preventDefault(); const fd=new FormData(ev.target);
    const data={...e,title:String(fd.get("title")||"").trim(),date:String(fd.get("date")||""),place:String(fd.get("place")||"").trim(),desc:String(fd.get("desc")||"").trim(),updatedAt:Date.now()};
    delete data.id; if(!data.title){toast("Event ka naam likho");return}
    data.createdBy=e.createdBy||uid; const eid=id||("e_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
    $("#saveBtn").disabled=true;
    try{ await db.collection("events").doc(eid).set(data); const i=events.findIndex(x=>x.id===eid); const rec={id:eid,...data}; if(i>=0)events[i]=rec; else events.push(rec); renderAll(); openEvent(eid); toast("Save ho gaya ✓"); }
    catch(x){ toast("Save nahi hua – permission check karo"); $("#saveBtn").disabled=false; }};
}
async function loadPhotos(eid){
  try{ const snap=await db.collection("photos").where("eventId","==",eid).get(); return docsFrom(snap).sort((a,b)=>(a.at||0)-(b.at||0)); }catch(e){ return []; }
}
async function openEvent(id){
  const e=events.find(x=>x.id===id); if(!e) return; current="ev:"+id;
  const edit=canWriteShared()&&(isAdmin||e.createdBy===uid);
  const tx=waText({type:"Family event",name:e.title,sub:e.place,iso:e.date},null);
  openSheet(`<div class="sheet-head"><h2>${esc(e.title||"Event")}</h2><button class="x" id="cls">×</button></div>
    <div class="sec"><dl class="kv">${e.date?`<dt>Tareekh</dt><dd>${esc(fmtDate(e.date))}</dd>`:""}${e.place?`<dt>Jagah</dt><dd>${esc(e.place)}</dd>`:""}${e.desc?`<dt>Vivaran</dt><dd>${esc(e.desc)}</dd>`:""}</dl>
      <div class="footer-actions">${e.date&&e.date>=isoOf(new Date())?`<a class="btn ghost" style="text-decoration:none" href="${esc(gcalLink({iso:e.date,icon:"🎉",name:e.title,type:"Family event",sub:e.place||""}))}" target="_blank" rel="noopener">🔔 Reminder</a><a class="btn ghost" style="text-decoration:none" href="${esc(waLink(tx))}" target="_blank" rel="noopener">💬 WhatsApp</a>`:""}${edit?'<button class="btn plain" id="editEv">✏️ Edit</button>':""}</div></div>
    <div id="evExtras"></div>
    <div class="sec"><h4>📷 Photo album</h4>
      ${canWriteShared()?`<label class="btn" style="cursor:pointer;margin-bottom:10px">+ Photos jodo<input type="file" accept="image/*" multiple id="phIn" hidden></label>`:""}
      <div class="album" id="album"><p class="sub">Photos load ho rahi hain…</p></div></div>`);
  $("#cls").onclick=closeSheet; const ee=$("#editEv"); if(ee) ee.onclick=()=>openEventForm(id);
  const pi=$("#phIn"); if(pi) pi.onchange=async ev=>{
    const files=[...ev.target.files]; let ok=0;
    for(const f of files){ toast(`Photo ${ok+1}/${files.length} upload ho rahi hai…`);
      try{ const data=await shrinkPhoto(f,1000,95000); const pid="p_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
        await db.collection("photos").doc(pid).set({eventId:id,data,by:uid,at:Date.now()}); ok++; }catch(x){ console.error(x); toast("Ek photo upload nahi hui"); } }
    if(ok){ const cnt=(await loadPhotos(id)).length; try{ await db.collection("events").doc(id).update({photoCount:cnt}); e.photoCount=cnt; }catch(x){}
      toast(`${ok} photo jud gayi ✓`); showAlbum(id); renderEvents(); }
  };
  showAlbum(id); renderEventExtras(id);
}
async function showAlbum(id){
  const ps=await loadPhotos(id); const al=$("#album"); if(!al||current!=="ev:"+id) return;
  if(!ps.length){al.innerHTML=`<p class="sub">Abhi koi photo nahi.</p>`;return}
  al.innerHTML=ps.filter(p=>okImg(p.data)).map(p=>`<button class="ph" data-pid="${esc(p.id)}"><img alt="" loading="lazy" src="${esc(p.data)}"></button>`).join("");
  al.querySelectorAll(".ph").forEach(b=>b.onclick=()=>{
    const p=ps.find(x=>x.id===b.dataset.pid); const lb=$("#lightbox");
    lb.innerHTML=`<img alt="" src="${esc(p.data)}"><div class="lb-actions">${downloads?'<button class="btn plain" id="lbDl">⬇️ Save</button>':""}${(isAdmin||p.by===uid)&&canWriteShared()?'<button class="btn danger" id="lbDel" style="background:#fff">Delete</button>':""}<button class="btn" id="lbClose">Band karo</button></div>`;
    lb.classList.add("open");
    $("#lbClose").onclick=()=>lb.classList.remove("open");
    const dl=$("#lbDl"); if(dl) dl.onclick=async()=>{ try{ const blob=await (await fetch(p.data)).blob(); await downloads.save({filename:"family-photo.jpg",data:blob}); }catch(x){ if(x&&x.code!=="declined") toast("Save nahi hui"); } };
    const del=$("#lbDel"); if(del) del.onclick=async()=>{ try{ await db.collection("photos").doc(p.id).delete(); lb.classList.remove("open");
      const e=events.find(x=>x.id===id); const cnt=ps.length-1; try{await db.collection("events").doc(id).update({photoCount:cnt}); if(e)e.photoCount=cnt;}catch(x){}
      showAlbum(id); renderEvents(); toast("Photo delete ho gayi"); }catch(x){toast("Delete nahi hui")} };
  });
}
$("#lightbox").addEventListener("click",e=>{if(e.target.id==="lightbox")e.target.classList.remove("open")});

/* ======================= Emergency ======================= */
function renderEmergency(){
  const list=members.filter(m=>!isGone(m)).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  if(!list.length){$("#emergency").innerHTML=`<div class="empty">Abhi koi member nahi.</div>`;return}
  const tel=v=>v?`<a href="tel:${esc(v.replace(/[^\d+]/g,""))}">${esc(v)}</a>`:"—";
  $("#emergency").innerHTML=`<div class="footer-actions" style="margin:0 0 10px"><button class="btn plain" id="copyEm">📋 Poori list copy karo</button></div>`+
    list.map(m=>`<div class="emc"><div class="bg ${m.blood?"":"none"}">${esc(m.blood||"?")}</div><div class="who">
      <b>${esc(m.name)}</b><span>${esc(m.relation||"")}${m.city?` · ${esc(m.city)}`:""}</span>
      <div class="emrow">📱 ${tel(m.mobile)}</div>
      ${m.emergency?`<div class="emrow">🆘 ${esc(m.emergency)}</div>`:""}
      ${m.medical?`<div class="emrow">🩺 ${esc(m.medical)}</div>`:""}</div></div>`).join("");
  $("#copyEm").onclick=async()=>{ const t="🆘 PARIVAR EMERGENCY LIST\n\n"+list.map(m=>`${m.name} (${m.relation||""})\nBlood: ${m.blood||"-"} | Mobile: ${m.mobile||"-"}${m.emergency?"\nEmergency: "+m.emergency:""}${m.medical?"\nHealth: "+m.medical:""}`).join("\n\n");
    try{await navigator.clipboard.writeText(t);toast("Copy ho gaya ✓")}catch(e){toast("Copy nahi hua")} };
}

/* ======================= Sheet / view ======================= */
function openSheet(html){$("#sheet").innerHTML=html;$("#overlay").classList.add("open");document.body.style.overflow="hidden";$("#sheet").scrollTop=0}
function closeSheet(){$("#overlay").classList.remove("open");document.body.style.overflow="";current=null}
$("#overlay").addEventListener("click",e=>{if(e.target.id==="overlay")closeSheet()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){ if($("#lightbox").classList.contains("open")) $("#lightbox").classList.remove("open"); else closeSheet(); }});

function viewValue(m,k){
  let v=m[k];
  if(k==="dob"||k==="anniversary"||k==="dod"||k.startsWith("exp_")&&k!=="exp_other_name") v=fmtDate(v)+(k==="dob"&&!isGone(m)&&age(m.dob)!==null?` (${age(m.dob)} saal)`:"")+(k==="dod"&&m.dob?` (${age(m.dob,m.dod)} varsh ki aayu)`:"");
  if(k==="exp_other") v=`${m.exp_other_name||"Document"}: ${fmtDate(m.exp_other)}`;
  return v;
}
function sectionRows(m,s,skip){
  const rows=[];
  s.f.forEach(([k,l])=>{
    if(skip&&skip.has(k)) return;
    if(k==="hs_year"){ const tt=tithiText(birthTithi(m)); if(tt) rows.push(["Janam tithi (Hindu)",tt]); return; }
    if(HS.includes(k)||HIDE_IN_VIEW.has(k)||!m[k]) return;
    rows.push([fieldLabel(k,l).replace(/\s*\(.*\)$/,"").replace(/\s*–.*$/,""),k==="vrat"?String(m[k]).split(",").join(", "):viewValue(m,k)]);
  });
  if(s.t.startsWith("Swargiya") && isGone(m) && (!skip)){
    const r=deathTithi(m), st=shraddhTarget(r);
    if(r) rows.push(["Punyatithi (tithi)",`${r.month} ${r.paksha} ${r.tithi}`]);
    if(st) rows.push(["Pitru Paksha shraddh",st.label]);
  }
  if(s.t.startsWith("Family Tree")){
    [["father_id","Pita"],["mother_id","Mata"],["spouse_id","Jeevansaathi"]].forEach(([k,l])=>{const x=byId(m[k]); if(x) rows.push([l,x.name]);});
  }
  return rows;
}
function biodataText(m){
  let out=`*${isGone(m)?"Swa. ":""}${m.name||""}*${m.relation?` (${m.relation})`:""}\n`;
  SECTIONS.forEach(s=>{ if(s.t.startsWith("Documents")) return; const rows=sectionRows(m,s); if(rows.length) out+=`\n— ${s.t} —\n`+rows.map(([l,v])=>`${l}: ${v}`).join("\n")+"\n"; });
  return out.trim();
}
function openView(id){
  const m=byId(id); if(!m) return; current=id;
  const mine=m.id===uid||isAdmin;
  const secs=SECTIONS.map(s=>{
    if(s.t.startsWith("Documents")&&!mine) return "";
    const rows=sectionRows(m,s).map(([l,v])=>`<dt>${esc(l)}</dt><dd>${esc(v)}</dd>`).join("");
    return rows?`<div class="sec"><h4>${esc(LANG==="hi"?secTitle(s.t):s.t.startsWith("Family Tree")?"Rishte":s.t.replace(" (purvaj ke liye)","").replace(" – sirf expiry date"," (expiry)"))}</h4><dl class="kv">${rows}</dl></div>`:"";
  }).join("");
  const y=new Date().getFullYear();
  const rem=[...yearEvents(y),...yearEvents(y+1)].filter(e=>e.id===m.id&&e.iso>=isoOf(new Date())&&e.type!=="Expiry");
  const uniq=[]; rem.forEach(e=>{if(!uniq.some(u=>u.type===e.type))uniq.push(e)});
  openSheet(`
    <div class="sheet-head"><h2>Biodata</h2><button class="x" aria-label="Band karo" id="cls">×</button></div>
    <div class="profile-top">${avatar(m,"big")}<div>
      <h3>${isGone(m)?"🙏 Swa. ":""}${esc(m.name||"Bina naam")}</h3>
      <div class="mrel">${esc(m.relation||"")}${m.nickname?` · “${esc(m.nickname)}”`:""}</div>
      ${m.id===uid?'<span class="pill me">Aapka biodata</span>':""}
    </div></div>
    ${secs||'<div class="sec">Abhi zyada details nahi bhari gayi.</div>'}
    ${(()=>{ const rels=members.filter(o=>o.id!==m.id).map(o=>({o,r:relTo(o,m)})).filter(x=>x.r).sort((a,b)=>a.r.len-b.r.len||(a.o.dob||"").localeCompare(b.o.dob||""));
      if(!rels.length) return `<div class="sec"><h4>🔗 Inke rishte</h4><p class="sub" style="margin:0;font-size:14px">Abhi koi rishta juda nahi. Edit karke “⚡ Ek rishta jodo” mein ek rishta chuno – baaki apne aap aa jayenge.</p></div>`;
      return `<div class="sec"><h4>🔗 ${esc((m.name||"").split(" ")[0])} ke rishte (apne aap)</h4><div class="rels">${rels.map(x=>`<button class="relrow" data-rid="${esc(x.o.id)}">${avatar(x.o,"sm")}<span class="rn">${isGone(x.o)?"🙏 ":""}${esc(x.o.name)}</span><span class="rt${x.r.exact?"":" fuzzy"}">${esc(x.r.term)}</span></button>`).join("")}</div></div>`; })()}
    ${uniq.length?`<div class="sec"><h4>🔔 Reminder lagao</h4><div class="actions">${uniq.map(e=>`<a class="btn ghost sm" href="${esc(gcalLink(e))}" target="_blank" rel="noopener">${e.icon} ${esc(tl(e))}: ${esc(fmtDate(e.iso))}</a>`).join("")}</div>
      ${uniq.some(e=>POSTER_TYPES[e.type])?`<h4 style="margin-top:12px">🖼️ Wish poster</h4><div class="actions">${uniq.filter(e=>POSTER_TYPES[e.type]).map((e,i)=>`<button class="btn plain sm vpst" data-vi="${uniq.indexOf(e)}">${e.icon} ${esc(tl(e))}</button>`).join("")}</div>`:""}</div>`:""}
    <div class="footer-actions">
      <button class="btn plain" id="copyBtn">📋 Copy</button>
      ${downloads&&!isGone(m)?'<button class="btn plain" id="pngBtn">🖼️ Photo</button><button class="btn plain" id="pdfBtn">📄 PDF</button>':""}
      ${canEditMember(m)?'<button class="btn" id="editBtn">✏️ Edit</button>':""}
    </div>`);
  $("#cls").onclick=closeSheet;
  $("#copyBtn").onclick=async()=>{try{await navigator.clipboard.writeText(biodataText(m));toast("Copy ho gaya ✓")}catch(e){toast("Copy nahi hua")}};
  const eb=$("#editBtn"); if(eb) eb.onclick=()=>openForm(m.id);
  document.querySelectorAll(".relrow").forEach(b=>b.onclick=()=>openView(b.dataset.rid));
  document.querySelectorAll(".vpst").forEach(b=>b.onclick=()=>openPoster(uniq[+b.dataset.vi]));
  const pb=$("#pngBtn"); if(pb) pb.onclick=()=>exportBiodata(m,"png");
  const fb=$("#pdfBtn"); if(fb) fb.onclick=()=>exportBiodata(m,"pdf");
}

/* ======================= Biodata PDF / image ======================= */
function cardHTML(m){
  const secs=SECTIONS.filter(s=>!s.t.startsWith("Documents")&&!s.t.startsWith("Swargiya")).map(s=>{
    const rows=sectionRows(m,s,PDF_SKIP); if(!rows.length) return "";
    return `<div class="bc-sec"><div class="bc-h">${esc(s.t==="Family Tree ke liye jodo"?"Parivar":s.t)}</div><table>${rows.map(([l,v])=>`<tr><td class="l">${esc(l)}</td><td>${esc(v)}</td></tr>`).join("")}</table></div>`;
  }).join("");
  return `<div class="bc"><div class="bc-top"><div class="bc-logo"><img src="${KULDEVI_DATA}" alt=""></div><div class="bc-om">॥ श्री गणेशाय नमः ॥ &nbsp; ॥ श्री महावीराय नमः ॥<br>॥ जय सच्चियाय माता ॥ &nbsp; ॥ श्री काला भैरूजी नमः ॥</div><div class="bc-title">BIODATA</div></div>
    <div class="bc-head">${okImg(m.photo)?`<img class="bc-ph" src="${esc(m.photo)}">`:""}<div><div class="bc-name">${esc(m.name||"")}</div>
    ${m.dob?`<div class="bc-sub">Janam: ${esc(fmtDate(m.dob))}${m.tob?", "+esc(m.tob):""}${m.pob?" · "+esc(m.pob):""}</div>`:""}
    ${tithiText(birthTithi(m))?`<div class="bc-sub">${esc(tithiText(birthTithi(m)))}</div>`:""}</div></div>${secs}
    <div class="bc-foot">Gulecha Parivar</div></div>`;
}
let exporting=false;
async function exportBiodata(m,kind){
  if(exporting) return;
  try{ await loadLib("h2c"); if(kind==="pdf") await loadLib("pdf"); }catch(e){ toast("Tool load nahi hua – internet check karo"); return; }
  exporting=true; toast("Ban raha hai…");
  const host=$("#exportHost"); host.innerHTML=cardHTML(m);
  try{
    if(document.fonts&&document.fonts.ready) await document.fonts.ready;
    const canvas=await html2canvas(host.firstElementChild,{scale:2,backgroundColor:"#ffffff",useCORS:true});
    const fname=(m.name||"biodata").replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"_")+"_biodata";
    if(kind==="png"){
      const blob=await new Promise(r=>canvas.toBlob(r,"image/png"));
      await downloads.save({filename:fname+".png",data:blob});
    } else {
      const pdf=new window.jspdf.jsPDF({unit:"mm",format:"a4"}); const W=210,H=297;
      const ih=canvas.height*W/canvas.width; const img=canvas.toDataURL("image/jpeg",0.92);
      let y=0; pdf.addImage(img,"JPEG",0,0,W,ih); y=H;
      while(y<ih-1){ pdf.addPage(); pdf.addImage(img,"JPEG",0,-y,W,ih); y+=H; }
      await downloads.save({filename:fname+".pdf",data:pdf.output("blob")});
    }
    toast("Save ho gaya ✓");
  }catch(e){ console.error(e); if(!e||e.code!=="declined") toast("Ban nahi paaya"); }
  finally{ host.innerHTML=""; exporting=false; }
}
