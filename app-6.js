/* Janam Patrika core: sidereal (Lahiri) positions, lagna, nakshatra, panchang, Vimshottari dasha.
   Needs global `Astronomy` (astronomy-engine). */
const Kundli=(()=>{
  const RASHI=["Mesh","Vrishabh","Mithun","Kark","Simha","Kanya","Tula","Vrishchik","Dhanu","Makar","Kumbh","Meen"];
  const RASHI_HI=["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
  const LORD=["Mangal","Shukra","Budh","Chandra","Surya","Budh","Shukra","Mangal","Guru","Shani","Shani","Guru"];
  const NAK=["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
  const DASHA=[["Ketu",7],["Shukra",20],["Surya",6],["Chandra",10],["Mangal",7],["Rahu",18],["Guru",16],["Shani",19],["Budh",17]];
  const YOGA=["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyana","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"];
  const KARANA_MOV=["Bava","Balava","Kaulava","Taitila","Gara","Vanija","Vishti"];
  const VAAR=["Ravivar","Somvar","Mangalvar","Budhvar","Guruvar","Shukravar","Shanivar"];
  const GRAHA=[["Surya","Su","Sun"],["Chandra","Ch","Moon"],["Mangal","Ma","Mars"],["Budh","Bu","Mercury"],["Guru","Gu","Jupiter"],["Shukra","Sk","Venus"],["Shani","Sa","Saturn"]];
  const n360=x=>((x%360)+360)%360, R=Math.PI/180;
  function ayanamsa(jdTT){ const T=(jdTT-2451545)/36525; return 23.85306+1.39722*T+0.00018*T*T; } // Lahiri (approx, ~arcmin)
  function tropLon(body,t){
    if(body==="Sun") return Astronomy.SunPosition(t).elon;
    if(body==="Moon") return Astronomy.EclipticGeoMoon(t).lon;
    const v=Astronomy.GeoVector(body,t,true); const r=Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(t),v);
    return n360(Math.atan2(r.y,r.x)/R);
  }
  function speed(body,t){ const a=tropLon(body,t.AddDays(-0.5)), b=tropLon(body,t.AddDays(0.5)); let d=b-a; if(d>180)d-=360; if(d<-180)d+=360; return d; }
  function tzOffsetMin(tz,date){ try{ const f=new Intl.DateTimeFormat("en-US",{timeZone:tz,hour12:false,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});
      const p=Object.fromEntries(f.formatToParts(date).map(x=>[x.type,x.value])); const asUTC=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute,+p.second); return Math.round((asUTC-date.getTime())/60000); }catch(e){ return 330; } }
  /* dob "YYYY-MM-DD", tob "HH:MM" (local of tz), lat, lon (east +), tz IANA */
  function compute(dob,tob,lat,lon,tz){
    const [y,mo,d]=dob.split("-").map(Number); const [hh,mm]=(tob||"12:00").split(":").map(Number);
    tz=tz||"Asia/Kolkata";
    let guess=new Date(Date.UTC(y,mo-1,d,hh,mm)); let off=tzOffsetMin(tz,guess); let utc=new Date(guess.getTime()-off*60000); off=tzOffsetMin(tz,utc); utc=new Date(guess.getTime()-off*60000);
    const t=Astronomy.MakeTime(utc); const jdTT=t.tt+2451545; const ay=ayanamsa(jdTT);
    const sid=x=>n360(x-ay);
    const planets=GRAHA.map(([nm,ab,body])=>{ const L=sid(tropLon(body,t)); return {nm,ab,lon:L,retro:body!=="Sun"&&body!=="Moon"&&speed(body,t)<0}; });
    const T=(jdTT-2451545)/36525; const node=n360(125.04452-1934.136261*T+0.0020708*T*T);
    planets.push({nm:"Rahu",ab:"Ra",lon:sid(node),retro:true},{nm:"Ketu",ab:"Ke",lon:sid(node+180),retro:true});
    // Lagna
    const eps=23.4392911-0.0130042*T; const lst=n360((Astronomy.SiderealTime(t)*15)+lon); const ra=lst*R, e=eps*R, ph=lat*R;
    const asc=n360(Math.atan2(Math.cos(ra),-(Math.sin(ra)*Math.cos(e)+Math.tan(ph)*Math.sin(e)))/R);
    const lagna=sid(asc);
    const info=L=>{ const s=Math.floor(L/30), deg=L-s*30, nk=Math.floor(L/(360/27)), pada=Math.floor((L%(360/27))/(360/108))+1; return {sign:s,deg,nak:nk,pada}; };
    planets.forEach(p=>Object.assign(p,info(p.lon)));
    const lg=info(lagna); planets.forEach(p=>p.house=((p.sign-lg.sign+12)%12)+1);
    const moon=planets[1], sun=planets[0];
    // panchang
    const el=n360(moon.lon-sun.lon), tithiN=Math.floor(el/12)+1;
    const yogaN=Math.floor(n360(moon.lon+sun.lon)/(360/27));
    const kIdx=Math.floor(el/6); const karana=kIdx===0?"Kimstughna":kIdx>=57?["Shakuni","Chatushpada","Naga"][kIdx-57]:KARANA_MOV[(kIdx-1)%7];
    const local=new Date(utc.getTime()+off*60000); const vaar=VAAR[local.getUTCDay()];
    // Vimshottari
    const nakLen=360/27, startLord=moon.nak%9, frac=(moon.lon%nakLen)/nakLen;
    const yr=365.2425*864e5; let cur=utc.getTime()-frac*DASHA[startLord][1]*yr; const dasha=[];
    for(let i=0;i<9;i++){ const [nm,yrs]=DASHA[(startLord+i)%9]; const end=cur+yrs*yr; dasha.push({nm,from:new Date(cur),to:new Date(end)}); cur=end; }
    const balance=(1-frac)*DASHA[startLord][1];
    return {utc,tz,off,lat,lon,ayanamsa:ay,lagna:{lon:lagna,...lg},planets,tithiN,paksha:tithiN<=15?"Shukla":"Krishna",yoga:YOGA[yogaN],karana,vaar,dasha,balance,
      moonSign:moon.sign,moonNak:moon.nak,moonPada:moon.pada,sunSign:sun.sign};
  }
  const dms=x=>{ const d=Math.floor(x), m=Math.floor((x-d)*60), s=Math.round(((x-d)*60-m)*60); return `${d}°${String(m).padStart(2,"0")}'${String(s).padStart(2,"0")}"`; };
  return {compute,RASHI,RASHI_HI,LORD,NAK,dms,tzOffsetMin};
})();

/* ======================= Milan (Ashtakoot) ======================= */
const Milan=(()=>{
  const varnaOf=s=>({0:"Kshatriya",4:"Kshatriya",8:"Kshatriya",1:"Vaishya",5:"Vaishya",9:"Vaishya",2:"Shudra",6:"Shudra",10:"Shudra",3:"Brahmin",7:"Brahmin",11:"Brahmin"})[s];
  const VR={Brahmin:4,Kshatriya:3,Vaishya:2,Shudra:1};
  function vashyaOf(sign,deg){ if(sign===8) return deg<15?"Manav":"Chatushpad"; if(sign===9) return deg<15?"Chatushpad":"Jalchar";
    return ["Chatushpad","Chatushpad","Manav","Jalchar","Vanchar","Manav","Manav","Keet",null,null,"Manav","Jalchar"][sign]; }
  const VI={Chatushpad:0,Manav:1,Jalchar:2,Vanchar:3,Keet:4};
  const VM=[[2,1,1,0,1],[1,2,0.5,0,1],[1,0.5,2,1,1],[0,0,1,2,0],[1,1,1,0,2]];
  const YONI=["Ghoda","Haathi","Bhed","Saanp","Saanp","Kutta","Billi","Bhed","Billi","Chuha","Chuha","Gaay","Bhains","Baagh","Bhains","Baagh","Hiran","Hiran","Kutta","Bandar","Nevla","Bandar","Sher","Ghoda","Sher","Gaay","Haathi"];
  const YENEMY=[["Ghoda","Bhains"],["Haathi","Sher"],["Bhed","Bandar"],["Saanp","Nevla"],["Kutta","Hiran"],["Billi","Chuha"],["Gaay","Baagh"]];
  const LORDS=["Mangal","Shukra","Budh","Chandra","Surya","Budh","Shukra","Mangal","Guru","Shani","Shani","Guru"];
  const FR={Surya:{f:["Chandra","Mangal","Guru"],e:["Shukra","Shani"]},Chandra:{f:["Surya","Budh"],e:[]},Mangal:{f:["Surya","Chandra","Guru"],e:["Budh"]},
    Budh:{f:["Surya","Shukra"],e:["Chandra"]},Guru:{f:["Surya","Chandra","Mangal"],e:["Budh","Shukra"]},Shukra:{f:["Budh","Shani"],e:["Surya","Chandra"]},Shani:{f:["Budh","Shukra"],e:["Surya","Chandra","Mangal"]}};
  const rel=(a,b)=>FR[a].f.includes(b)?"f":FR[a].e.includes(b)?"e":"n";
  const GANA=n=>[0,4,6,7,12,14,16,21,26].includes(n)?"Deva":[1,3,5,10,11,19,20,24,25].includes(n)?"Manushya":"Rakshasa";
  const NADI=n=>["Adi","Madhya","Antya","Antya","Madhya","Adi"][n%6];
  const MANGAL_H=[1,2,4,7,8,12];
  function manglik(k){ const ma=k.planets.find(p=>p.nm==="Mangal"); const fromL=ma.house, fromM=((ma.sign-k.moonSign+12)%12)+1;
    return {lagna:MANGAL_H.includes(fromL),moon:MANGAL_H.includes(fromM),is:MANGAL_H.includes(fromL)||MANGAL_H.includes(fromM),fromL,fromM}; }
  function match(boy,girl){ // boy/girl: results of Kundli.compute
    const b={s:boy.moonSign,d:boy.planets[1].deg,n:boy.moonNak}, g={s:girl.moonSign,d:girl.planets[1].deg,n:girl.moonNak};
    const rows=[];
    const vb=varnaOf(b.s), vg=varnaOf(g.s); rows.push(["Varna",1,VR[vb]>=VR[vg]?1:0,`${vb} / ${vg}`]);
    const wb=vashyaOf(b.s,b.d), wg=vashyaOf(g.s,g.d); rows.push(["Vashya",2,VM[VI[wb]][VI[wg]],`${wb} / ${wg}`]);
    const t1=((b.n-g.n+27)%27+1)%9, t2=((g.n-b.n+27)%27+1)%9, good=x=>![3,5,7].includes(x); rows.push(["Tara",3,(good(t1)?1.5:0)+(good(t2)?1.5:0),`${t1||9} / ${t2||9}`]);
    const yb=YONI[b.n], yg=YONI[g.n]; const yen=YENEMY.some(([x,y])=>(x===yb&&y===yg)||(x===yg&&y===yb)); rows.push(["Yoni",4,yb===yg?4:yen?0:2,`${yb} / ${yg}`]);
    const lb=LORDS[b.s], lg=LORDS[g.s]; let gm; if(lb===lg) gm=5; else { const r=[rel(lb,lg),rel(lg,lb)].sort().join(""); gm={ff:5,fn:4,nn:3,ef:1,en:0.5,ee:0}[r]; }
    rows.push(["Graha Maitri",5,gm,`${lb} / ${lg}`]);
    const gb=GANA(b.n), gg=GANA(g.n); const gk=[gb,gg].sort().join("-"); rows.push(["Gana",6,gb===gg?6:{"Deva-Manushya":5,"Deva-Rakshasa":1,"Manushya-Rakshasa":0}[gk],`${gb} / ${gg}`]);
    const bk=((b.s-g.s+12)%12)+1; rows.push(["Bhakoot",7,[2,12,5,9,6,8].includes(bk)?0:7,`${Kundli.RASHI[b.s]} / ${Kundli.RASHI[g.s]}`]);
    const nb=NADI(b.n), ng=NADI(g.n); rows.push(["Nadi",8,nb===ng?0:8,`${nb} / ${ng}`]);
    const total=rows.reduce((s,r)=>s+r[2],0);
    const mb=manglik(boy), mg=manglik(girl);
    return {rows,total,mb,mg};
  }
  return {match,manglik};
})();

/* ======================= Place search (autocomplete) ======================= */
async function geoSearch(q){
  q=q.trim(); if(q.length<3) return [];
  try{ const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`); const j=await r.json();
    const out=(j.results||[]).map(x=>({label:[x.name,x.admin2,x.admin1,x.country].filter((v,i,a)=>v&&a.indexOf(v)===i).join(", "),name:[x.name,x.admin2,x.admin1].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(", "),lat:x.latitude,lon:x.longitude,tz:x.timezone||"Asia/Kolkata",cc:x.country_code}));
    out.sort((a,b)=>(b.cc==="IN")-(a.cc==="IN")); if(out.length) return out; }catch(e){}
  try{ const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(q)}`,{headers:{"Accept-Language":"en"}}); const j=await r.json();
    return j.map(x=>{ const a=x.address||{}; const nm=[a.village||a.town||a.city||a.hamlet||x.name,a.state_district||a.county,a.state].filter(Boolean).join(", ");
      return {label:x.display_name,name:nm||x.display_name,lat:+x.lat,lon:+x.lon,tz:(a.country_code||"in")==="in"?"Asia/Kolkata":"",cc:(a.country_code||"").toUpperCase()}; }); }catch(e){ return []; }
}
function attachPlace(input,onPick){
  if(!input||input._geo) return; input._geo=true; input.setAttribute("autocomplete","off");
  const box=document.createElement("div"); box.className="geobox"; input.after(box); let t=null, seq=0;
  input.addEventListener("input",()=>{ clearTimeout(t); const q=input.value; if(q.trim().length<3){ box.innerHTML=""; return; }
    t=setTimeout(async()=>{ const my=++seq; box.innerHTML=`<div class="geoi muted">Dhoondh rahe hain…</div>`; const res=await geoSearch(q); if(my!==seq) return;
      box.innerHTML=res.length?res.map((r,i)=>`<button type="button" class="geoi" data-i="${i}">📍 ${esc(r.label)}<small>${r.lat.toFixed(3)}°, ${r.lon.toFixed(3)}°</small></button>`).join(""):`<div class="geoi muted">Kuch nahi mila – thoda alag likh ke dekho (jaise "Padru Barmer")</div>`;
      box.querySelectorAll("button.geoi").forEach(b=>b.onclick=()=>{ const r=res[+b.dataset.i]; input.value=r.name; box.innerHTML=""; onPick(r); }); },450); });
  input.addEventListener("blur",()=>setTimeout(()=>box.innerHTML="",300));
}
(function(){ const orig=window.openForm; window.openForm=function(...a){ orig(...a); const f=$("#bform"); if(!f||!f.pob) return;
  attachPlace(f.pob,r=>{ f.pob_lat.value=r.lat.toFixed(4); f.pob_lon.value=r.lon.toFixed(4); if(f.pob_tz) f.pob_tz.value=r.tz||"Asia/Kolkata"; toast("📍 Sthan aur latitude/longitude bhar gaye ✓"); }); }; })();

/* ======================= Chart drawing ======================= */
function northChart(k,title,ascSign){
  const S=300, P=[[150,78],[78,36],[34,78],[78,150],[34,222],[78,264],[150,222],[222,264],[266,222],[222,150],[266,78],[222,36]];
  const N=[[150,128],[78,14],[14,78],[128,150],[14,222],[78,290],[150,174],[222,290],[288,222],[174,150],[288,78],[222,14]];
  const asc=ascSign??k.lagna.sign; const byH={}; k.planets.forEach(p=>{ const h=((p.sign-asc+12)%12); (byH[h]=byH[h]||[]).push(p.ab+(p.retro&&!["Ra","Ke"].includes(p.ab)?"ᴿ":"")); });
  if(ascSign==null) (byH[0]=byH[0]||[]).unshift("La");
  let txt=""; for(let h=0;h<12;h++){ const [x,y]=P[h], [nx,ny]=N[h]; txt+=`<text x="${nx}" y="${ny+4}" class="kn">${((asc+h)%12)+1}</text>`;
    (byH[h]||[]).forEach((s,i,arr)=>{ txt+=`<text x="${x}" y="${y-((arr.length-1)*8)+i*16+5}" class="kp">${s}</text>`; }); }
  return `<div class="kchart"><div class="kct">${esc(title)}</div><svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="${S-2}" height="${S-2}" fill="#fffaf2" stroke="#7a1533" stroke-width="2"/>
    <path d="M1 1L${S-1} ${S-1}M${S-1} 1L1 ${S-1}M150 1L${S-1} 150L150 ${S-1}L1 150Z" fill="none" stroke="#7a1533" stroke-width="1.6"/>${txt}</svg></div>`;
}
const GHI={Surya:"सूर्य",Chandra:"चंद्र",Mangal:"मंगल",Budh:"बुध",Guru:"गुरु",Shukra:"शुक्र",Shani:"शनि",Rahu:"राहु",Ketu:"केतु"};
const fmtD=d=>d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
async function ensureAstro(){ if(window.Astronomy) return true; try{ await loadLib("astro"); return !!window.Astronomy; }catch(e){ return false; } }
async function placeFor(m){ if(m.pob_lat&&m.pob_lon) return {lat:+m.pob_lat,lon:+m.pob_lon,tz:m.pob_tz||"Asia/Kolkata",guess:false};
  if(m.pob){ const r=await geoSearch(m.pob); if(r[0]) return {lat:r[0].lat,lon:r[0].lon,tz:r[0].tz||"Asia/Kolkata",guess:true,name:r[0].label}; } return null; }

function patrikaHTML(m,k,pl){
  const pc=Panchang.compute(m.dob,m.tob); const now=Date.now(); const md=k.planets[1];
  const head=`<div class="pk-top"><img src="${KULDEVI_DATA}"><div><div class="pk-om">॥ श्री गणेशाय नमः ॥</div><div class="pk-om">॥ जय सच्चियाय माता ॥ ॥ जय काला भैरूजी ॥</div><div class="pk-title">जन्म पत्रिका · Janam Patrika</div></div><img src="${KULDEVTA_DATA}"></div>`;
  const row=(a,b)=>`<tr><td class="l">${a}</td><td>${b}</td></tr>`;
  return `<div class="pk">${head}
   <div class="pk-name">${esc(m.name)}</div>
   <div class="pk-two"><table>${row("Janam tarikh",fmtD(new Date(m.dob+"T00:00:00"))+" · "+k.vaar)}${row("Janam samay",esc(m.tob)+" ("+k.tz.replace("Asia/Kolkata","IST")+")")}${row("Janam sthan",esc(m.pob||"")+`<br><small>${k.lat.toFixed(3)}°N, ${k.lon.toFixed(3)}°E${pl.guess?" (andaaz)":""}</small>`)}
     ${row("Vikram Samvat",pc?pc.vs:"")}${row("Maas / Paksha",pc?`${pc.month} ${pc.paksha}`:"")}${row("Tithi",pc?pc.tithi:"")}</table>
    <table>${row("Lagna",`${Kundli.RASHI[k.lagna.sign]} (${Kundli.RASHI_HI[k.lagna.sign]}) ${Kundli.dms(k.lagna.deg)}`)}${row("Rashi (Chandra)",`${Kundli.RASHI[k.moonSign]} (${Kundli.RASHI_HI[k.moonSign]})`)}${row("Rashi swami",Kundli.LORD[k.moonSign])}
     ${row("Nakshatra",`${Kundli.NAK[k.moonNak]} – charan ${k.moonPada}`)}${row("Yoga / Karana",`${k.yoga} / ${k.karana}`)}${row("Surya rashi",Kundli.RASHI[k.sunSign])}</table></div>
   <div class="pk-charts">${northChart(k,"Lagna Kundli")}${northChart(k,"Chandra Kundli",k.moonSign)}</div>
   <table class="pk-grid"><tr><th>Grah</th><th>Rashi</th><th>Ansh</th><th>Nakshatra (charan)</th><th>Bhav</th></tr>
     ${k.planets.map(p=>`<tr><td>${p.nm} ${GHI[p.nm]||""}${p.retro&&!["Rahu","Ketu"].includes(p.nm)?" (Vakri)":""}</td><td>${Kundli.RASHI[p.sign]}</td><td>${Kundli.dms(p.deg)}</td><td>${Kundli.NAK[p.nak]} (${p.pada})</td><td>${p.house}</td></tr>`).join("")}</table>
   <div class="pk-sub">Vimshottari Mahadasha <small>(janam ke samay ${k.dasha[0].nm} ki ${k.balance.toFixed(1)} varsh baaki)</small></div>
   <table class="pk-grid"><tr><th>Mahadasha</th><th>Se</th><th>Tak</th></tr>${k.dasha.map(d=>`<tr class="${now>=d.from&&now<d.to?"cur":""}"><td>${d.nm}${now>=d.from&&now<d.to?" ← abhi":""}</td><td>${fmtD(d.from)}</td><td>${fmtD(d.to)}</td></tr>`).join("")}</table>
   ${(()=>{ const mg=Milan.manglik(k); return `<div class="pk-note">Mangal: Lagna se ${mg.fromL}va bhav, Chandra se ${mg.fromM}va bhav → <b>${mg.is?"Manglik":"Manglik nahi"}</b></div>`; })()}
   <div class="pk-foot">Lahiri ayanamsa · ganana app dwara – shubh karya se pehle pandit ji se milan kar lein · Gulecha Parivar</div></div>`;
}
function fitPk(){ document.querySelectorAll(".pk-wrap").forEach(w=>{ const pk=w.querySelector(".pk"); if(!pk) return; const sc=Math.min(1,(w.clientWidth-2)/760); pk.style.transform=`scale(${sc})`; w.style.height=(pk.offsetHeight*sc+2)+"px"; w.style.overflow="hidden"; }); }
window.addEventListener("resize",fitPk);
async function pdfFromHTML(html,fname){
  try{ await loadLib("h2c"); await loadLib("pdf"); }catch(e){ toast("Internet check karo"); return; }
  const host=$("#exportHost"); host.innerHTML=html;
  try{ if(document.fonts&&document.fonts.ready) await document.fonts.ready;
    const cv=await html2canvas(host.firstElementChild,{scale:2,backgroundColor:"#ffffff"});
    const pdf=new window.jspdf.jsPDF({unit:"mm",format:"a4"}); const W=210,H=297, ih=cv.height*W/cv.width, img=cv.toDataURL("image/jpeg",0.92);
    pdf.addImage(img,"JPEG",0,0,W,ih); let y=H; while(y<ih-1){ pdf.addPage(); pdf.addImage(img,"JPEG",0,-y,W,ih); y+=H; }
    await downloads.save({filename:fname,data:pdf.output("blob")}); toast("PDF ban gayi ✓");
  }catch(e){ console.error(e); if(!e||e.code!=="declined") toast("PDF nahi bani"); } finally{ host.innerHTML=""; }
}
async function openPatrika(id){
  const m=byId(id); if(!m) return;
  if(!m.dob||!m.tob){ toast("Patrika ke liye janam tarikh aur janam samay dono chahiye – Edit karke bharo"); return; }
  openSheet(`<div class="sheet-head"><h2>🪐 Janam Patrika</h2><button class="x" id="cls">×</button></div><div id="pkBody"><p class="sub">Graho ki ganana ho rahi hai…</p></div>`); $("#cls").onclick=closeSheet;
  if(!(await ensureAstro())){ $("#pkBody").innerHTML=`<div class="notice err">Ganana ka tool load nahi hua – internet check karo.</div>`; return; }
  const pl=await placeFor(m); if(!pl){ $("#pkBody").innerHTML=`<div class="notice err">Janam sthan nahi mila. Biodata Edit karke “Janam sthan” likho aur list se sahi jagah chuno.</div>`; return; }
  const k=Kundli.compute(m.dob,m.tob,pl.lat,pl.lon,pl.tz); const html=patrikaHTML(m,k,pl);
  $("#pkBody").innerHTML=`${pl.guess?`<div class="help">📍 Sthan andaaz se liya: ${esc(pl.name||"")}. Sahi karne ke liye biodata mein janam sthan list se chuno.</div>`:""}<div class="pk-wrap">${html}</div>
    <div class="footer-actions">${downloads?'<button class="btn" id="pkPdf">📤 PDF / WhatsApp</button>':""}</div>`;
  fitPk(); const b=$("#pkPdf"); if(b) b.onclick=()=>pdfFromHTML(html,`${(m.name||"patrika").replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"_")}_Janam_Patrika.pdf`);
}

/* ======================= Kundli milan UI ======================= */
function eligible(){ return members.filter(m=>!isGone(m)&&m.dob&&m.marital!=="Married"&&m.marital!=="Widowed"&&(age(m.dob)||0)>=16).sort((a,b)=>(a.name||"").localeCompare(b.name||"")); }
function openMilan(preId){
  const list=eligible();
  openSheet(`<div class="sheet-head"><h2>💞 Kundli Milan</h2><button class="x" id="cls">×</button></div>
    <div class="sec"><h4>Parivar se</h4><label class="f full">Ladka / Ladki<select id="mlA">${list.map(m=>`<option value="${esc(m.id)}" ${m.id===preId?"selected":""}>${esc(m.name)} (${m.gender==="Female"?"Ladki":"Ladka"})</option>`).join("")||'<option value="">— koi unmarried member nahi —</option>'}</select></label>
      <p class="sub" style="font-size:13px;margin:6px 0 0">Iske biodata mein janam tarikh, samay aur sthan bhara hona chahiye.</p></div>
    <div class="sec"><h4>Rishte wale ki jaankari</h4><div class="fgrid">
      <label class="f full">Naam<input id="mlN" maxlength="80"></label>
      <label class="f">Janam tarikh<input id="mlD" type="date"></label><label class="f">Janam samay<input id="mlT" type="time"></label>
      <label class="f full">Janam sthan<input id="mlP" placeholder="jaise Jodhpur"></label></div><div id="mlGeo" class="sub" style="font-size:13px"></div></div>
    <div class="footer-actions"><button class="btn" id="mlGo">💞 Milan karo</button></div><div id="mlOut"></div>`);
  $("#cls").onclick=closeSheet; let other=null;
  attachPlace($("#mlP"),r=>{ other=r; $("#mlGeo").textContent=`📍 ${r.lat.toFixed(3)}°, ${r.lon.toFixed(3)}° ✓`; });
  $("#mlGo").onclick=async()=>{ const a=byId($("#mlA").value); const n=$("#mlN").value.trim(), d=$("#mlD").value, t=$("#mlT").value;
    if(!a){ toast("Parivar se ladka/ladki chuno"); return; } if(!a.tob){ toast(`${a.name} ka janam samay biodata mein bharo`); return; }
    if(!d||!t){ toast("Rishte wale ki janam tarikh aur samay bharo"); return; }
    if(!other){ const r=await geoSearch($("#mlP").value||""); other=r[0]||null; } if(!other){ toast("Rishte wale ka janam sthan list se chuno"); return; }
    $("#mlOut").innerHTML=`<p class="sub">Ganana ho rahi hai…</p>`;
    if(!(await ensureAstro())){ $("#mlOut").innerHTML=`<div class="notice err">Tool load nahi hua – internet check karo.</div>`; return; }
    const pa=await placeFor(a); if(!pa){ toast(`${a.name} ka janam sthan biodata mein chuno`); return; }
    const ka=Kundli.compute(a.dob,a.tob,pa.lat,pa.lon,pa.tz), ko=Kundli.compute(d,t,other.lat,other.lon,other.tz||"Asia/Kolkata");
    const aBoy=a.gender!=="Female"; const boy=aBoy?ka:ko, girl=aBoy?ko:ka; const bn=aBoy?a.name:n||"Ladka", gn=aBoy?(n||"Ladki"):a.name;
    const r=Milan.match(boy,girl); const v=r.total>=33?"Uttam (bahut achha)":r.total>=25?"Achha":r.total>=18?"Madhyam (theek)":"Kam – vichaar karein";
    const mg=(x,nm)=>`${esc(nm)}: <b>${x.is?"Manglik":"Manglik nahi"}</b>`;
    const mgNote=r.mb.is===r.mg.is?(r.mb.is?"Dono Manglik – dosh nirast (cancel) maana jaata hai.":"Manglik dosh nahi."):"Ek Manglik, ek nahi – pandit ji se salah zaroor lein.";
    const html=`<div class="pk"><div class="pk-top"><img src="${KULDEVI_DATA}"><div><div class="pk-om">॥ जय सच्चियाय माता ॥ ॥ जय काला भैरूजी ॥</div><div class="pk-title">कुंडली मिलान · Kundli Milan</div></div><img src="${KULDEVTA_DATA}"></div>
      <div class="pk-two"><table><tr><td class="l">Ladka</td><td><b>${esc(bn)}</b><br>${Kundli.RASHI[boy.moonSign]} rashi · ${Kundli.NAK[boy.moonNak]} (${boy.moonPada})</td></tr></table>
        <table><tr><td class="l">Ladki</td><td><b>${esc(gn)}</b><br>${Kundli.RASHI[girl.moonSign]} rashi · ${Kundli.NAK[girl.moonNak]} (${girl.moonPada})</td></tr></table></div>
      <table class="pk-grid"><tr><th>Koot</th><th>Ladka / Ladki</th><th>Gun</th><th>Kul</th></tr>${r.rows.map(x=>`<tr><td>${x[0]}</td><td>${esc(x[3])}</td><td><b>${x[2]}</b></td><td>${x[1]}</td></tr>`).join("")}
        <tr class="cur"><td colspan="2"><b>Kul Gun</b></td><td colspan="2"><b>${r.total} / 36</b></td></tr></table>
      <div class="pk-score"><b>${r.total}</b>/36 gun · ${v}</div>
      <div class="pk-note">Manglik: ${mg(r.mb,bn)} · ${mg(r.mg,gn)}<br>${mgNote}</div>
      <div class="pk-foot">Ashtakoot milan (Chandra nakshatra/rashi se) · ganana app dwara – antim nirnay pandit ji se poochh kar lein · Gulecha Parivar</div></div>`;
    $("#mlOut").innerHTML=`<div class="pk-wrap">${html}</div><div class="footer-actions">${downloads?'<button class="btn" id="mlPdf">📤 PDF / WhatsApp</button>':""}</div>`;
    fitPk(); const b=$("#mlPdf"); if(b) b.onclick=()=>pdfFromHTML(html,`Kundli_Milan_${bn.split(" ")[0]}_${gn.split(" ")[0]}.pdf`.replace(/[^\w.-]/g,"_")); };
}
(function(){ const orig=window.openView; window.openView=function(id){ orig(id); const m=byId(id); if(!m) return; const fa=document.querySelector("#sheet .footer-actions:last-of-type"); if(!fa) return;
  if(m.dob&&!isGone(m)){ const b=document.createElement("button"); b.className="btn plain"; b.textContent="🪐 Janam Patrika"; b.onclick=()=>openPatrika(m.id); fa.prepend(b); }
  if(eligible().some(x=>x.id===m.id)){ const b=document.createElement("button"); b.className="btn plain"; b.textContent="💞 Kundli milan"; b.onclick=()=>openMilan(m.id); fa.prepend(b); } }; })();
(function(){ const orig=window.renderShaadi; window.renderShaadi=function(){ orig(); const mb=$("#moreBody"); if(!mb) return; const d=document.createElement("div"); d.className="footer-actions"; d.style.margin="0 0 10px";
  d.innerHTML=`<button class="btn" id="mlOpen">💞 Kundli milan karo</button>`; mb.prepend(d); $("#mlOpen").onclick=()=>openMilan(); }; })();
