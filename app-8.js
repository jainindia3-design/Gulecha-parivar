/* ======================= Join via QR + approval + password ======================= */
const JOIN_URL="https://jainindia3-design.github.io/Gulecha-parivar/?join=1";

/* ---------- 1) Naya (approval se pehle) user ---------- */
function startPending(){
  window.PENDING=true;
  try{ localStorage.removeItem("gp_cache_v1"); }catch(e){}
  members=[]; events=[]; notices=[]; family={}; loaded=false; isAdmin=false;
  const nav=document.querySelector("nav.tabs"); if(nav) nav.style.display="none";
  ["#addBtn","#msgBtn","#bdays"].forEach(s=>{ const e=$(s); if(e) e.style.display="none"; });
  document.querySelectorAll("section[id^='v-']").forEach(s=>s.style.display=s.id==="v-members"?"":"none");
  uid=sessionStorage.getItem("gp_pmid")||("m_"+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
  sessionStorage.setItem("gp_pmid",uid);
  renderAll=renderPending; renderTop=()=>{}; showTab=()=>{}; renderTab=()=>{};
  setStatus("");
  db.collection("members").onSnapshot(snap=>{
    members=docsFrom(snap); loaded=true;
    const pd=window._pendingDoc; if(pd&&pd.mid){ uid=pd.mid; sessionStorage.setItem("gp_pmid",uid); }
    if(!$("#bform")) renderPending();
  }, err=>{ console.error(err); setStatus("Load nahi hua – rules check karo / internet dekho.",true); });
}
function renderPending(){
  const pd=window._pendingDoc;
  const fam=members.filter(m=>!m._pending&&m.name).sort((a,b)=>a.name.localeCompare(b.name));
  const myBtn=$("#myBtn"); if(myBtn){ myBtn.innerHTML="✍️"; myBtn.disabled=false; myBtn.onclick=()=>openForm(uid,"self"); }
  $("#countLine").textContent="Swagat hai 🙏";
  $("#homeExtras").innerHTML=`
    <div class="sec" style="text-align:center">
      <div style="font-size:40px">🙏</div>
      <h3 style="margin:6px 0">${pd?"Aapka biodata admin ko bhej diya gaya hai ✅":"Gulecha Parivar mein aapka swagat hai"}</h3>
      <p class="sub" style="font-size:15px">${pd?"Admin ki manzoori (approval) ke baad aapko poora app – sabke biodata, calendar, family tree – dikhne lagega. Tab tak aap apna biodata badal sakte ho.":"Pehle apna <b>poora biodata</b> bharo. Admin ki manzoori ke baad poora app khul jayega."}</p>
      <button class="cta" id="pFill" style="margin:10px auto"><span>✍️</span><div><b>${pd?"Apna biodata dekho / badlo":"Apna biodata bharo"}</b><small>Photo, janam tarikh, rishte – sab yahin</small></div>›</button>
      <button class="btn plain" id="pPw" style="margin-top:6px">🔑 Password banao / badlo</button>
      <button class="btn plain" id="pRe" style="margin-top:6px">🔄 Approval check karo</button>
      <button class="btn plain" id="pOut" style="margin-top:6px">🚪 Logout</button>
    </div>
    <div class="sec"><h4>👪 Parivar ke sadasya (${fam.length})</h4>
      <p class="sub" style="margin:0 0 8px">Abhi sirf naam dikh rahe hain. Rishta jodne ke liye biodata form mein “Ek rishta jodo” se apne pita / pati / mata chuno.</p>
      ${fam.length?`<div style="display:flex;flex-wrap:wrap;gap:6px">${fam.map(m=>`<span class="chip" style="cursor:default">${esc(m.name)}</span>`).join("")}</div>`:'<p class="sub">Naam abhi load nahi hue.</p>'}
    </div>`;
  $("#grid")&&($("#grid").innerHTML=""); const sr=$("#search"); if(sr) sr.style.display="none";
  $("#pFill").onclick=()=>{ (pd&&byId(uid))?openView(uid):openForm(uid,"self"); };
  $("#pPw").onclick=()=>openPasswordSheet();
  $("#pRe").onclick=()=>location.reload();
  $("#pOut").onclick=()=>user&&user.signOut();
}

/* ---------- 2) Password banao / badlo (sab users) ---------- */
function passwordHTML(){
  const has=user&&user.hasPassword&&user.hasPassword();
  return `<div class="help">${has?"Naya password likho – agli baar email + is password se login hoga.":"Aap abhi Google / OTP se login karte ho. Yahan password bana lo – phir <b>email + password</b> se bhi login kar paoge."}</div>
    <div class="sec"><div class="fgrid">
      ${user&&user.email?`<label class="f full">Email<input value="${esc(user.email)}" disabled></label>`:`<label class="f full">Apna email<input id="pwMail" type="email" autocapitalize="off" placeholder="naam@gmail.com"></label>`}
      <label class="f">Naya password (6+ akshar)<input id="pw1" type="password" autocomplete="new-password"></label>
      <label class="f">Dobara likho<input id="pw2" type="password" autocomplete="new-password"></label></div>
      <div class="footer-actions"><button class="btn" id="pwSave">🔑 Password save karo</button>${user&&user.email?'<button class="btn plain" id="pwMailBtn">📧 Email se reset link bhejo</button>':""}</div>
      <div id="pwMsg" class="sub" style="margin-top:8px"></div></div>`;
}
function wirePassword(root){
  const msg=(t,ok)=>{ const m=root.querySelector("#pwMsg"); m.textContent=t; m.style.color=ok?"#2f7d5b":"#b3261e"; };
  root.querySelector("#pwSave").onclick=async()=>{
    const a=root.querySelector("#pw1").value, b=root.querySelector("#pw2").value, em=(root.querySelector("#pwMail")||{}).value||"";
    if(a.length<6){ msg("Password kam se kam 6 akshar ka rakho"); return; } if(a!==b){ msg("Dono password ek jaise nahi hain"); return; }
    msg("Save ho raha hai…",true);
    try{ await user.setPassword(a,em); msg("✅ Password ban gaya! Ab email + password se login kar sakte ho.",true); root.querySelector("#pw1").value=root.querySelector("#pw2").value=""; }
    catch(e){ const c=(e&&e.code)||""; msg(/recent-login/.test(c)?"Suraksha ke liye ek baar Logout karke dobara login karo, phir turant password banao.":/need-email/.test(c)?"Upar apna email likho.":/email-already-in-use|credential-already-in-use/.test(c)?"Is email ka alag account pehle se hai – us email se 'Password bhool gaye?' use karo.":/weak-password/.test(c)?"Password thoda mazboot rakho (6+ akshar).":"Nahi hua: "+(c||e.message||e)); }
  };
  const rb=root.querySelector("#pwMailBtn"); if(rb) rb.onclick=async()=>{ try{ await user.resetMail(); msg("Reset link "+user.email+" pe bhej diya ✓ (Spam bhi dekhna)",true); }catch(e){ msg("Nahi bheja ja saka"); } };
}
function openPasswordSheet(){
  openSheet(`<div class="sheet-head"><h2>🔑 Password</h2><button class="x" id="cls">×</button></div>${passwordHTML()}`);
  $("#cls").onclick=closeSheet; wirePassword($("#sheet"));
}
function renderPassword(){ $("#moreBody").innerHTML=passwordHTML(); wirePassword($("#moreBody")); }
if(typeof MORE_TILES!=="undefined"&&!MORE_TILES.some(t=>t[0]==="password")) MORE_TILES.push(["password","🔑","Password banao / badlo","पासवर्ड बनाएँ / बदलें"]);

/* ---------- 3) Admin: naam list + join requests ---------- */
let joinReqs=[], _joinWatch=false;
function afterMembers(){
  if(!isAdmin||!db||window.PENDING) return;
  const list=members.filter(m=>m.name).map(m=>({id:m.id,name:m.name,gender:m.gender||"",father_id:m.father_id||"",mother_id:m.mother_id||"",spouse_id:m.spouse_id||"",sib_of:m.sib_of||""}));
  const sig=JSON.stringify(list);
  if(localStorage.getItem("gp_names_sig")!==sig){ db.collection("pub").doc("names").set({list,at:Date.now()}).then(()=>{ try{localStorage.setItem("gp_names_sig",sig)}catch(e){} }).catch(e=>console.warn("names",e)); }
  if(!_joinWatch){ _joinWatch=true;
    db.collection("pending").onSnapshot(snap=>{ joinReqs=docsFrom(snap).sort((a,b)=>(b.at||0)-(a.at||0)); joinBar(); }, ()=>{}); }
}
function joinBar(){
  let bar=$("#joinBar");
  if(!bar){ bar=document.createElement("div"); bar.id="joinBar"; const he=$("#homeExtras"); he.parentNode.insertBefore(bar,he); }
  bar.innerHTML=joinReqs.length?`<button class="noticebar" id="jbBtn" style="background:#fff4e0;border-color:#e0a040">🙋 <b>${joinReqs.length} naye sadasya</b> approval ka intezaar kar rahe hain – dekho ›</button>`:"";
  const b=$("#jbBtn"); if(b) b.onclick=openJoinRequests;
}
function reqSummary(r){
  const d=r.rec||{}; const nm=id=>(byId(id)||{}).name||"";
  const rows=[["Mobile/Email",r.key],["Janam tarikh",d.dob],["Pita",nm(d.father_id)],["Mata",nm(d.mother_id)],["Pati/Patni",nm(d.spouse_id)],["Shahar",d.city||d.address],["Mobile",d.mobile]].filter(x=>x[1]);
  const later=Object.keys(r.later||{}).map(id=>nm(id)).filter(Boolean);
  return rows.map(([k,v])=>`<div class="sub" style="font-size:14px"><b>${esc(k)}:</b> ${esc(v)}</div>`).join("")+(later.length?`<div class="sub" style="font-size:14px"><b>Rishta judega:</b> ${esc(later.join(", "))}</div>`:"");
}
function openJoinRequests(){
  const body=joinReqs.length?joinReqs.map(r=>{ const d=r.rec||{};
    return `<div class="sec"><div style="display:flex;gap:10px;align-items:center">${avatar({...d,id:r.mid},"sm")}<div><b style="font-size:17px">${esc(d.name||r.name||"(naam nahi bhara)")}</b><div class="sub" style="font-size:13px">${r.at?new Date(r.at).toLocaleString("en-IN"):""}</div></div></div>
      <div style="margin:8px 0">${reqSummary(r)}</div>
      <div class="footer-actions"><button class="btn" data-ok="${esc(r.id)}">✅ Approve</button><button class="btn plain" data-see="${esc(r.id)}">👁 Poora biodata</button><button class="btn danger" data-no="${esc(r.id)}">❌ Mana karo</button></div></div>`; }).join("")
    :'<div class="empty">Koi naya request nahi hai.</div>';
  openSheet(`<div class="sheet-head"><h2>🙋 Join requests</h2><button class="x" id="cls">×</button></div>${body}`);
  $("#cls").onclick=closeSheet;
  $("#sheet").querySelectorAll("[data-ok]").forEach(b=>b.onclick=()=>approveJoin(b.dataset.ok,b));
  $("#sheet").querySelectorAll("[data-no]").forEach(b=>b.onclick=async()=>{ if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Pakka mana?";return}
    try{ await db.collection("pending").doc(b.dataset.no).delete(); toast("Request hata diya"); openJoinRequests(); }catch(e){ toast("Nahi hua"); } });
  $("#sheet").querySelectorAll("[data-see]").forEach(b=>b.onclick=()=>{ const r=joinReqs.find(x=>x.id===b.dataset.see); if(!r) return; const d=r.rec||{};
    const rows=ALL_FIELDS.filter(([k])=>d[k]&&!/_id$|^pob_|^photo$|^hide$/.test(k)).map(([k,l])=>`<div class="relrow" style="cursor:default"><span class="rn"><small class="sub">${esc(l)}</small><br>${esc(String(d[k]))}</span></div>`).join("");
    openSheet(`<div class="sheet-head"><h2>${esc(d.name||"")}</h2><button class="x" id="cls">×</button></div><div class="sec">${reqSummary(r)}</div><div class="sec">${rows||"<p class='sub'>Kuch nahi bhara</p>"}</div><button class="btn" id="backReq">‹ Wapas</button>`);
    $("#cls").onclick=closeSheet; $("#backReq").onclick=openJoinRequests; });
}
async function approveJoin(key,btn){
  const r=joinReqs.find(x=>x.id===key); if(!r) return;
  const d={...(r.rec||{})}; delete d._pending; const mid=r.mid||("m_"+Date.now().toString(36));
  if(!d.name){ toast("Inhone naam nahi bhara – pehle biodata bharwao"); return; }
  delete d.ownerKey; delete d.ownerEmail; if(key.includes("@")) d.ownerEmail=key; else d.ownerKey=key;
  d.createdBy=d.createdBy||mid; d.updatedAt=Date.now(); d.approvedBy=uid; d.approvedAt=Date.now();
  btn.disabled=true; btn.textContent="Ho raha hai…";
  try{
    await db.collection("members").doc(mid).set(d);
    for(const [oid,u] of Object.entries(r.later||{})){ const o=byId(oid); if(!o) continue; const upd={}; for(const k in u) if(!o[k]) upd[k]=u[k];
      if(Object.keys(upd).length){ try{ await db.collection("members").doc(oid).update(upd); }catch(e){} } }
    await db.collection("allowed").doc(key).set({name:d.name,memberId:mid,addedAt:Date.now(),addedBy:uid,via:"qr"});
    await db.collection("pending").doc(key).delete();
    toast(`${d.name} parivar mein jud gaye ✓`); setTimeout(openJoinRequests,300);
  }catch(e){ console.error(e); toast("Approve nahi hua – rules update kiye? ("+(e.code||"")+")"); btn.disabled=false; btn.textContent="✅ Approve"; }
}

/* ---------- 4) QR card in Family access ---------- */
(function(){
  if(typeof renderAccess!=="function") return;
  const orig=renderAccess;
  renderAccess=async function(){
    await orig();
    const box=document.createElement("div"); box.className="sec"; box.style.textAlign="center";
    box.innerHTML=`<h4>📱 Join QR – koi bhi scan karke juda sake</h4>
      <img src="join-qr.png" alt="Join QR" style="width:220px;max-width:70%;border-radius:12px;background:#fff;padding:8px">
      <p class="sub" style="font-size:14px">Scan → apna account + password banao → biodata bharo → aap <b>Approve</b> karo → poora app khul jayega. Approval se pehle unhe sirf naam dikhenge.</p>
      <div class="footer-actions" style="justify-content:center"><button class="btn" id="qrShare">📤 QR share karo</button><button class="btn plain" id="qrWa">💬 WhatsApp link</button><button class="btn plain" id="qrReq">🙋 Requests (${joinReqs.length})</button></div>`;
    const mb=$("#moreBody"); mb.insertBefore(box,mb.firstChild);
    $("#qrShare").onclick=async()=>{ try{ const bl=await (await fetch("join-qr-poster.jpg")).blob(); await downloads.save({filename:"Gulecha-Parivar-Join-QR.jpg",data:bl}); }catch(e){ toast("Share nahi hua"); } };
    $("#qrWa").onclick=()=>window.open("https://wa.me/?text="+encodeURIComponent("🙏 Gulecha Parivar app se judiye!\nIs link ko kholiye, apna account + password banaiye aur apna biodata bhariye:\n"+JOIN_URL),"_blank");
    $("#qrReq").onclick=openJoinRequests;
  };
})();
