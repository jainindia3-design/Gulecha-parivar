/* ======================= Panchang · Choghadiya · Hora · Navkarsi (sheher ke hisab se) ======================= */
const PK=(()=>{
  const R=Math.PI/180, n360=x=>((x%360)+360)%360, P=Panchang;
  const elong=J=>n360(P.moon(J)-P.sun(J)), sidM=J=>n360(P.moon(J)-P.ayan(J)), sidS=J=>n360(P.sun(J)-P.ayan(J));
  const NAK=["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravan","Dhanishtha","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
  const YOG=["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyana","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"];
  const KAR=["Bava","Balava","Kaulava","Taitila","Gara","Vanija","Vishti (Bhadra)"];
  const RASHI=["Mesh","Vrishabh","Mithun","Kark","Simha","Kanya","Tula","Vrishchik","Dhanu","Makar","Kumbh","Meen"];
  const VAAR=["Ravivar","Somvar","Mangalvar","Budhvar","Guruvar","Shukravar","Shanivar"];
  const karName=k=>k===0?"Kimstughna":k>=57?["Shakuni","Chatushpada","Naga"][k-57]:KAR[(k-1)%7];
  /* time when f(J) (deg, increasing ~speed°/day) reaches target */
  function cross(f,J,target,speed){ for(let i=0;i<12;i++){ let d=target-f(J); d=((d+540)%360)-180; J+=d/speed; if(Math.abs(d)<1e-4) break; } return J; }
  /* sunrise/sunset (JD, UT) for local date */
  function sunRS(y,m,d,lat,lon){
    const n=Math.round(P.jd(y,m,d,12)-2451545), Js=n-lon/360;
    const M=n360(357.5291+0.98560028*Js), C=1.9148*Math.sin(M*R)+0.02*Math.sin(2*M*R)+0.0003*Math.sin(3*M*R);
    const L=n360(M+C+180+102.9372), Jt=2451545+Js+0.0053*Math.sin(M*R)-0.0069*Math.sin(2*L*R);
    const dec=Math.asin(Math.sin(L*R)*Math.sin(23.4397*R));
    const cw=(Math.sin(-0.833*R)-Math.sin(lat*R)*Math.sin(dec))/(Math.cos(lat*R)*Math.cos(dec));
    if(cw<-1||cw>1) return null; const w=Math.acos(cw)/R/360; return {rise:Jt-w,set:Jt+w,noon:Jt};
  }
  function tzOff(tz,iso){ try{ const f=new Intl.DateTimeFormat("en-US",{timeZone:tz||"Asia/Kolkata",timeZoneName:"shortOffset"});
      const s=f.formatToParts(new Date(iso+"T12:00:00Z")).find(p=>p.type==="timeZoneName").value; const m=s.match(/GMT([+-])(\d+)(?::(\d+))?/);
      return m?(m[1]==="-"?-1:1)*(+m[2]+(+m[3]||0)/60):0; }catch(e){ return 5.5; } }
  function day(iso,pl){
    const [y,m,d]=iso.split("-").map(Number), off=tzOff(pl.tz,iso);
    const rs=sunRS(y,m,d,pl.lat,pl.lon); if(!rs) return null;
    const nx=new Date(Date.UTC(y,m-1,d+1)), rs2=sunRS(nx.getUTCFullYear(),nx.getUTCMonth()+1,nx.getUTCDate(),pl.lat,pl.lon);
    const J=rs.rise, e=elong(J), t=Math.floor(e/12), nk=Math.floor(sidM(J)/(360/27)), yg=Math.floor(n360(sidM(J)+sidS(J))/(360/27)), kr=Math.floor(e/6);
    const tEnd=cross(elong,J,(t+1)*12,12.19), nEnd=cross(sidM,J,(nk+1)*360/27,13.2), yEnd=cross(J2=>n360(sidM(J2)+sidS(J2)),J,(yg+1)*360/27,14.2), kEnd=cross(elong,J,(kr+1)*6,12.19);
    const t2=(t+1)%30, nk2=(nk+1)%27;
    const pc=Panchang.compute(iso)||{};
    const tName=r=>r===14?"Purnima":r===29?"Amavasya":Panchang.TITHI[r%15];
    return { iso,off,rise:rs.rise,set:rs.set,noon:rs.noon,nextRise:rs2?rs2.rise:rs.rise+1, wd:new Date(Date.UTC(y,m-1,d)).getUTCDay(),
      tithi:{name:tName(t),paksha:t<15?"Shukla":"Krishna",end:tEnd,next:tName(t2)}, nak:{name:NAK[nk],end:nEnd,next:NAK[nk2]},
      yoga:{name:YOG[yg],end:yEnd}, karan:{name:karName(kr),end:kEnd}, mRashi:RASHI[Math.floor(sidM(J)/30)], sRashi:RASHI[Math.floor(sidS(J)/30)],
      maas:pc.month||"", vs:pc.vs||"" };
  }
  return {day,VAAR,tzOff};
})();

const PLACE_KEY="gp_place";
const DEF_PLACE={name:"Barmer, Rajasthan",lat:25.7521,lon:71.3967,tz:"Asia/Kolkata",def:1};
function getPlace(){ try{ return JSON.parse(localStorage.getItem(PLACE_KEY))||DEF_PLACE; }catch(e){ return DEF_PLACE; } }
function setPlace(p){ try{ localStorage.setItem(PLACE_KEY,JSON.stringify(p)); }catch(e){} }
const CHOG=[["Udveg","bad"],["Char","mid"],["Labh","good"],["Amrit","good"],["Kaal","bad"],["Shubh","good"],["Rog","bad"]];
const CH_DAY=[0,3,6,2,5,1,4];      // Ravi..Shani – din ka pehla choghadiya
const HORA=[["Surya","☀️","Sarkari kaam, pita"],["Shukra","💎","Kharidi, shringar, kala"],["Budh","📚","Padhai, vyapar, likhna"],["Chandra","🌙","Yatra, mata, ghar"],["Shani","⚙️","Mehnat, purana kaam"],["Guru","🙏","Dharm, shiksha, shubh"],["Mangal","🔥","Zameen, himmat, khel"]];
const H_DAY=[0,3,6,2,5,1,4];       // Ravi=Surya, Som=Chandra, Mangal, Budh, Guru, Shukra, Shani (index in HORA)
const RAHU=[8,2,7,5,6,4,3];
let pkDate=null;

function pkFmt(J,base){ const ms=(J-2440587.5)*864e5+base.off*36e5, dt=new Date(ms); let h=dt.getUTCHours(), mi=dt.getUTCMinutes();
  const sameDay=dt.toISOString().slice(0,10)===base.iso; const ap=h<12?"AM":"PM"; const h12=h%12||12;
  return `${h12}:${String(mi).padStart(2,"0")} ${ap}${sameDay?"":" <small>("+(dt.getTime()>Date.parse(base.iso+"T00:00:00Z")?"agle din":"pichhle din")+")</small>"}`; }
function pkSlots(a,b,n){ const out=[], w=(b-a)/n; for(let i=0;i<n;i++) out.push([a+i*w,a+(i+1)*w]); return out; }

function openPanchang(iso){
  pkDate=iso||pkDate||isoOf(new Date());
  openSheet(`<div class="sheet-head"><h2>🕉️ ${L("Panchang","पंचांग")}</h2><button class="x" id="cls">×</button></div><div id="pkBody"></div>`);
  $("#cls").onclick=closeSheet; renderPanchang();
}
function renderPanchang(){
  const pl=getPlace(), iso=pkDate, D=PK.day(iso,pl), box=$("#pkBody"); if(!box) return;
  const nowJ=Date.now()/864e5+2440587.5;
  const dt=new Date(iso+"T00:00:00Z");
  const head=`<div class="sec pk-loc"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <div style="flex:1;min-width:160px"><b>📍 ${esc(pl.name)}</b><div class="sub" style="font-size:12px">${pl.lat.toFixed(2)}°, ${pl.lon.toFixed(2)}° · ${esc(pl.tz||"")}</div></div>
      <button class="btn sm plain" id="pkGps">🎯 Meri location</button><button class="btn sm plain" id="pkCity">🔎 Sheher badlo</button></div>
      ${pl.def?`<div class="help" style="margin:8px 0 0">Apna sheher chuno – sunrise, navkarsi, choghadiya usi hisab se aayenge. Ghumne jao to <b>🎯 Meri location</b> dabao.</div>`:""}
      <div id="pkCityBox" style="display:none;margin-top:8px"><input id="pkCityIn" placeholder="Sheher ka naam likho (jaise Surat, Chennai, Dubai)" style="width:100%"></div></div>
    <div class="pk-date"><button class="btn sm plain" id="pkPrev">‹</button><input type="date" id="pkD" value="${iso}"><button class="btn sm plain" id="pkNext">›</button><button class="btn sm plain" id="pkToday">Aaj</button></div>`;
  if(!D){ box.innerHTML=head+`<div class="empty">Is jagah par is din suryoday/suryast nahi hota.</div>`; wirePk(pl); return; }
  const F=J=>pkFmt(J,D), dayLen=D.set-D.rise, nightLen=D.nextRise-D.set, wd=D.wd;
  const isNow=(a,b)=>nowJ>=a&&nowJ<b;
  const row=(k,v)=>`<div class="pk-r"><span>${k}</span><b>${v}</b></div>`;
  const panch=`<div class="sec"><h4>📅 ${dt.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"})} · ${PK.VAAR[wd]}</h4>
    ${row("Maas · Samvat",`${esc(D.maas)} · VS ${D.vs}`)}
    ${row("Tithi",`${D.tithi.paksha} ${D.tithi.name} <small>– ${F(D.tithi.end)} tak, phir ${D.tithi.next}</small>`)}
    ${row("Nakshatra",`${D.nak.name} <small>– ${F(D.nak.end)} tak, phir ${D.nak.next}</small>`)}
    ${row("Yoga",`${D.yoga.name} <small>– ${F(D.yoga.end)} tak</small>`)}
    ${row("Karan",`${D.karan.name} <small>– ${F(D.karan.end)} tak</small>`)}
    ${row("Chandra rashi · Surya rashi",`${D.mRashi} · ${D.sRashi}`)}
    ${row("🌅 Suryoday",F(D.rise))}${row("🌇 Suryast",F(D.set))}
    ${row("Dinmaan",`${Math.floor(dayLen*24)} ghante ${Math.round((dayLen*24%1)*60)} min`)}
    ${row("☀️ Abhijit muhurat",`${F(D.noon-dayLen/30)} – ${F(D.noon+dayLen/30)}`)}
    ${row("⚠️ Rahu kaal",(()=>{const s=pkSlots(D.rise,D.set,8)[RAHU[wd]-1];return `${F(s[0])} – ${F(s[1])}`;})())}</div>`;
  const jain=[["🙏 Navkarsi",D.rise+48/1440],["Porsi",D.rise+dayLen/4],["Sadh Porsi",D.rise+dayLen*3/8],["Purimaddh",D.rise+dayLen/2],["Avaddh",D.rise+dayLen*3/4],["🌇 Chauvihar / Suryast",D.set]];
  const jainH=`<div class="sec" id="pkJain"><h4>🪷 Pachchakhan samay (Jain)</h4>${jain.map(([k,J])=>row(k,F(J)+(isNow(J-1/1440,J+30/1440)?" <span class='pk-now'>abhi</span>":""))).join("")}
    <p class="sub" style="font-size:12px;margin:6px 0 0">Navkarsi = suryoday + 48 min · Porsi = din ka ¼ · Sadh Porsi = ⅜ · Purimaddh = ½ · Avaddh = ¾. Thoda samay (2–3 min) upar rakh lena achha hai.</p></div>`;
  const chog=(start,end,first,step,label)=>`<h5 class="pk-h5">${label}</h5>`+pkSlots(start,end,8).map(([a,b],i)=>{ const c=CHOG[(first+i*step)%7];
      return `<div class="pk-c ${c[1]} ${isNow(a,b)?"now":""}"><span>${c[0]}</span><small>${F(a)} – ${F(b)}</small></div>`; }).join("");
  const chogH=`<div class="sec" id="pkChog"><h4>⏱️ Choghadiya</h4><div class="pk-leg"><span class="good">Shubh</span><span class="mid">Theek (yatra)</span><span class="bad">Ashubh</span></div>
    ${chog(D.rise,D.set,CH_DAY[wd],1,"☀️ Din")}${chog(D.set,D.nextRise,CH_DAY[(wd+4)%7],5,"🌙 Raat")}</div>`;
  const horas=[...pkSlots(D.rise,D.set,12),...pkSlots(D.set,D.nextRise,12)];
  const horaH=`<div class="sec" id="pkHora"><h4>🪐 Hora</h4>${horas.map(([a,b],i)=>{ const h=HORA[(H_DAY[wd]+i)%7];
      return `${i===12?'<h5 class="pk-h5">🌙 Raat</h5>':i===0?'<h5 class="pk-h5">☀️ Din</h5>':""}<div class="pk-c ${isNow(a,b)?"now":""}"><span>${h[1]} ${h[0]}</span><small>${F(a)} – ${F(b)}<br>${h[2]}</small></div>`; }).join("")}</div>`;
  const y0=new Date().getFullYear();
  const finder=`<div class="sec" id="pkFind"><h4>🔎 Tithi se tarikh dhoondo</h4><p class="sub" style="font-size:13px;margin:0 0 8px">Kisi ka birthday / anniversary tithi se yaad ho to yahan chuno.</p>
    <div class="fgrid"><label class="f">Maas<select id="tfM">${Panchang.MAAS.map(m=>`<option>${m}</option>`).join("")}</select></label>
    <label class="f">Paksha<select id="tfP"><option value="s">Shukla (sudi)</option><option value="k">Krishna (vadi)</option></select></label>
    <label class="f">Tithi<select id="tfT">${[...Panchang.TITHI,"Purnima / Amavasya"].map((t,i)=>`<option value="${i+1}">${i+1}. ${t}</option>`).join("")}</select></label>
    <label class="f">Saal<select id="tfY">${[-1,0,1,2,3,4,5].map(k=>`<option ${k===0?"selected":""}>${y0+k}</option>`).join("")}</select></label></div>
    <div class="footer-actions"><button class="btn" id="tfGo">Tarikh dhoondo</button></div><div id="tfOut"></div></div>`;
  const jump=`<div class="pk-jump">${[["pkJain","🪷 Navkarsi"],["pkChog","⏱️ Choghadiya"],["pkHora","🪐 Hora"],["pkFind","🔎 Tithi se tarikh"]].map(([i,t])=>`<button class="chip" data-pkj="${i}">${t}</button>`).join("")}</div>`;
  box.innerHTML=head+jump+panch+jainH+chogH+horaH+finder;
  box.querySelectorAll("[data-pkj]").forEach(b=>b.onclick=()=>{ const el=$("#"+b.dataset.pkj); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); });
  wirePk(pl);
}
function wirePk(pl){
  const go=d=>{ pkDate=d; renderPanchang(); };
  const shift=n=>{ const t=new Date(pkDate+"T00:00:00Z"); t.setUTCDate(t.getUTCDate()+n); go(t.toISOString().slice(0,10)); };
  $("#pkPrev").onclick=()=>shift(-1); $("#pkNext").onclick=()=>shift(1); $("#pkToday").onclick=()=>go(isoOf(new Date()));
  $("#pkD").onchange=e=>{ if(e.target.value) go(e.target.value); };
  $("#pkCity").onclick=()=>{ const b=$("#pkCityBox"); b.style.display=""; const inp=$("#pkCityIn"); inp.focus();
    if(typeof attachPlace==="function") attachPlace(inp,r=>{ setPlace({name:r.name,lat:r.lat,lon:r.lon,tz:r.tz||"Asia/Kolkata"}); toast("📍 "+r.name); renderPanchang(); }); };
  $("#pkGps").onclick=()=>{ if(!navigator.geolocation){ toast("Is phone mein location nahi mili"); return; } toast("Location dhoondh rahe hain…");
    navigator.geolocation.getCurrentPosition(async p=>{ const lat=p.coords.latitude, lon=p.coords.longitude; let name=`Meri location`;
      try{ const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=${lat}&lon=${lon}`,{headers:{"Accept-Language":"en"}}); const j=await r.json(); const a=j.address||{};
        name=[a.city||a.town||a.village||a.county,a.state].filter(Boolean).join(", ")||name; }catch(e){}
      setPlace({name,lat,lon,tz:Intl.DateTimeFormat().resolvedOptions().timeZone||"Asia/Kolkata"}); renderPanchang(); },
      ()=>toast("Location ki permission nahi mili – 🔎 Sheher badlo se chuno"),{timeout:15000}); };
  const tf=$("#tfGo"); if(tf) tf.onclick=()=>{
    const M=$("#tfM").value, k=$("#tfP").value==="k", t=+$("#tfT").value, Y=+$("#tfY").value;
    const raw=k?15+t:t; const out=$("#tfOut");
    const scan=r=>Panchang.yearDays(Y).filter(x=>x.raw===r).map(x=>x.iso).filter(d=>{ const c=Panchang.compute(d); return c&&!c.adhik&&c.monthName===M; });
    let hits=scan(raw); if(!hits.length&&raw<30) hits=scan(raw+1);
    const nm=`${M} ${k?"Krishna":"Shukla"} ${t===15?(k?"Amavasya":"Purnima"):Panchang.TITHI[t-1]}`;
    out.innerHTML=hits.length?hits.map(d=>{ const dd=new Date(d+"T00:00:00Z");
        return `<div class="pk-hit"><div><b>${dd.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"})}</b><br><small>${esc(nm)}</small></div><button class="btn sm" data-pkgo="${d}">Panchang</button></div>`; }).join("")
      :`<p class="sub">${Y} mein ${esc(nm)} nahi mili (adhik maas / kshaya tithi ho sakti hai). Doosra saal dekho.</p>`;
    out.querySelectorAll("[data-pkgo]").forEach(b=>b.onclick=()=>{ go(b.dataset.pkgo); $("#sheet").scrollTop=0; });
  };
}

/* styles */
(function(){ const s=document.createElement("style"); s.textContent=`
.pk-date{display:flex;gap:6px;align-items:center;margin:0 0 12px}.pk-date input{flex:1;min-width:0;padding:8px;border-radius:10px;border:1px solid #ddd;font-size:16px}
.pk-r{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px dashed #eadfd6;font-size:14px}.pk-r:last-of-type{border:0}.pk-r span{color:#7a6a62}.pk-r b{text-align:right;font-weight:600}.pk-r small{font-weight:400;color:#8a7a72}
.pk-h5{margin:12px 0 6px;font-size:14px;color:#8a2a2a}.pk-c{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:10px;margin:4px 0;background:#faf5f1;font-size:14px}
.pk-c small{text-align:right;color:#6a5a52}.pk-c.good{background:#e7f5ec}.pk-c.good span{color:#1e7a45;font-weight:700}.pk-c.bad{background:#fbe9e7}.pk-c.bad span{color:#b3261e;font-weight:700}.pk-c.mid{background:#fff6e0}.pk-c.mid span{color:#9a6a00;font-weight:700}
.pk-c.now{outline:2px solid #c2185b;box-shadow:0 0 0 4px #c2185b22}.pk-c.now span::after{content:" • abhi";color:#c2185b;font-size:12px}
.pk-leg{display:flex;gap:6px;font-size:12px}.pk-leg span{padding:2px 8px;border-radius:8px}.pk-leg .good{background:#e7f5ec}.pk-leg .mid{background:#fff6e0}.pk-leg .bad{background:#fbe9e7}
.pk-now{background:#c2185b;color:#fff;border-radius:6px;padding:1px 6px;font-size:11px}.pk-hit{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px;background:#faf5f1;border-radius:10px;margin-top:8px}
.panchang{cursor:pointer}.pk-jump{display:flex;gap:6px;overflow-x:auto;margin:0 0 10px;padding-bottom:2px}.pk-jump .chip{white-space:nowrap}`; document.head.appendChild(s); })();

/* entry points: More tile, home "Aaj" card, calendar button */
if(typeof MORE_TILES!=="undefined"&&!MORE_TILES.some(t=>t[0]==="panchang")) MORE_TILES.unshift(["panchang","🕉️","Panchang · Choghadiya · Navkarsi","पंचांग · चौघड़िया · नवकारसी"]);
(function(){ const orig=openMore; openMore=function(k){ if(k==="panchang"){ openPanchang(); return; } return orig(k); }; })();
$("#homeExtras").addEventListener("click",e=>{ if(e.target.closest(".panchang")) openPanchang(isoOf(new Date())); });
(function(){ const bar=document.querySelector("#v-calendar .cal-bar"); if(bar&&!$("#pkCalBtn")){ const b=document.createElement("button"); b.className="btn plain"; b.id="pkCalBtn"; b.textContent="🕉️ Panchang"; b.onclick=()=>openPanchang(); bar.appendChild(b); } })();
