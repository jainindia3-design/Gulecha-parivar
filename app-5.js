/* ======================= Extra features: dashboard, backup, invite, directory, tree poster, blood search ======================= */
const COMPLETE=[["photo","Photo"],["dob","Janam tarikh"],["gender","Gender"],["mobile","Mobile"],["city","Sheher"],["blood","Blood group"],["education","Padhai"],["occupation","Kaam"],["_link","Rishta (⚡ Ek rishta jodo)"],["native","Mool gaon"]];
function completion(m){ const miss=[]; COMPLETE.forEach(([k,l])=>{ const ok=k==="_link"?(m.father_id||m.mother_id||m.spouse_id||m.sib_of||members.some(x=>x.father_id===m.id||x.mother_id===m.id||x.spouse_id===m.id)):!!m[k]; if(!ok) miss.push(l); });
  return {pct:Math.round(100*(COMPLETE.length-miss.length)/COMPLETE.length),miss}; }
const APP_URL=()=>location.origin+location.pathname;
function inviteText(name){ return `🙏 ${name?name+" ji, ":""}Gulecha Parivar ka apna app taiyaar hai!\n\n👉 ${APP_URL()}\n\n1️⃣ Link kholo\n2️⃣ ✉️ Email ya 📱 Mobile OTP se login karo (wahi number/email jo maine joda hai)\n3️⃣ "✍️ Apna biodata bharo" – photo aur janam tarikh zaroor daalna\n4️⃣ "⚡ Ek rishta jodo" mein bas ek rishta chuno – baaki apne aap jud jayenge\n5️⃣ Chrome ⋮ → "Add to Home screen" (iPhone: Safari → Share → Add to Home Screen)\n\nJai Sachiyay Mata 🙏`; }
function waTo(num,text){ const d=String(num||"").replace(/[^\d]/g,""); const n=d.length===10?"91"+d:d; return (n?`https://wa.me/${n}`:"https://wa.me/")+"?text="+encodeURIComponent(text); }

/* ---- last seen (for dashboard) ---- */
(function(){ let done=false; setInterval(()=>{ if(done||!db||!loaded) return; const me=byId(uid); if(!me) return; done=true;
  if(!me.lastSeen||Date.now()-me.lastSeen>6*36e5){ db.collection("members").doc(me.id).update({lastSeen:Date.now()}).catch(()=>{}); } },3000); })();

/* ---- nudge on home ---- */
(function(){ const orig=window.renderHomeExtras; window.renderHomeExtras=function(){ orig(); try{
  const me=byId(uid); if(!me||!loaded) return; const c=completion(me); if(c.pct>=80) return;
  const el=document.createElement("button"); el.className="cta"; el.id="ctaFill";
  el.innerHTML=`<span>📝</span><div><b>${L("Aapka biodata","आपका बायोडाटा")} ${c.pct}% ${L("bhara hai","भरा है")}</b><small>${esc(L("Baaki: ","बाकी: ")+c.miss.slice(0,3).join(", "))}${c.miss.length>3?"…":""}</small><div class="pbar"><i style="width:${c.pct}%"></i></div></div>›`;
  el.onclick=()=>openForm(me.id); const h=$("#homeExtras"); const kd=$("#kdCard"); kd?kd.after(el):h.prepend(el); }catch(e){console.error(e)} }; })();

/* ---- Admin dashboard ---- */
function renderDash(){
  const alive=members.filter(m=>!isGone(m)); const list=alive.map(m=>({m,c:completion(m)})).sort((a,b)=>a.c.pct-b.c.pct);
  const seen=alive.filter(m=>m.lastSeen).length, full=list.filter(x=>x.c.pct>=80).length;
  const ago=t=>{ if(!t) return "Kabhi nahi khola"; const d=Math.floor((Date.now()-t)/864e5); return d<=0?"Aaj khola":d===1?"Kal khola":d+" din pehle"; };
  $("#moreBody").innerHTML=`<div class="dstats"><div><b>${alive.length}</b>Members</div><div><b>${seen}</b>Ne app khola</div><div><b>${full}</b>Biodata poora</div></div>
    <div class="help">Jinka biodata adhoora hai unhe <b>💬 Yaad dilao</b> se WhatsApp karo.</div>
    ${list.map(({m,c})=>`<div class="sec drow">${avatar(m,"sm")}<div class="who"><b>${esc(m.name)}</b><span>${ago(m.lastSeen)} · ${c.pct}% bhara</span><div class="pbar"><i style="width:${c.pct}%"></i></div>
      ${c.miss.length?`<span style="font-size:12px">Baaki: ${esc(c.miss.join(", "))}</span>`:""}</div>
      ${c.pct<100||!m.lastSeen?`<a class="btn sm ghost" style="text-decoration:none" target="_blank" rel="noopener" href="${esc(waTo(m.whatsapp||m.mobile, m.lastSeen?`🙏 ${m.name} ji, Gulecha Parivar app mein aapka biodata ${c.pct}% bhara hai. Kripya ye bhi jod dijiye: ${c.miss.join(", ")}.\n👉 ${APP_URL()}`:inviteText(m.name)))}">💬 Yaad dilao</a>`:""}</div>`).join("")}`;
}

/* ---- Invite buttons on access list ---- */
(function(){ const orig=window.renderAccess; window.renderAccess=async function(){ await orig(); const add=()=>{ const box=$("#acList"); if(!box) return;
    box.querySelectorAll(".relrow").forEach(r=>{ if(r.querySelector(".invbtn")) return; const key=(r.querySelector("small")||{}).textContent||""; const id=key.split(" · ")[0].trim(); const nm=(r.querySelector(".rn")||{}).firstChild?.textContent||"";
      const a=document.createElement("a"); a.className="btn sm invbtn"; a.style.textDecoration="none"; a.target="_blank"; a.rel="noopener"; a.textContent="📲 Invite";
      a.href=id.includes("@")?"https://wa.me/?text="+encodeURIComponent(inviteText(nm)):waTo(id,inviteText(nm)); r.insertBefore(a,r.querySelector("[data-acdel]")); }); };
  const mo=new MutationObserver(add); const b=$("#acList"); if(b) mo.observe(b,{childList:true,subtree:true}); add(); }; })();

/* ---- Backup ---- */
const BK_COLS=["members","family","events","notices","recipes","stories","rsvp","expenses","allowed","photos"];
function renderBackup(){
  $("#moreBody").innerHTML=`<div class="help">Poore parivar ka data (biodata, photos, events, notice, recipes…) ek file mein phone pe save hoga. <b>Mahine mein ek baar</b> backup le lo aur file WhatsApp/Drive pe sambhal ke rakho.<br><br>Wapas laane ke liye: ☰ Aur → 📥 Purana data laao → ye file chuno.</div>
    <div class="sec"><label class="chk"><input type="checkbox" id="bkPh" checked> Event photos bhi shaamil karo (file badi hogi)</label>
    <div class="footer-actions"><button class="btn" id="bkGo">📦 Backup lo</button></div><div id="bkMsg" class="sub"></div></div>`;
  $("#bkGo").onclick=async()=>{ const b=$("#bkGo"); b.disabled=true; const out={app:"Gulecha Parivar",at:new Date().toISOString(),collections:{}};
    for(const c of BK_COLS){ if(c==="photos"&&!$("#bkPh").checked) continue; $("#bkMsg").textContent=`${c} le rahe hain…`;
      try{ const snap=await db.collection(c).get(); out.collections[c]=docsFrom(snap).map(d=>{const {id,...data}=d; return {id,data};}); }catch(e){ out.collections[c]=[]; } }
    const n=Object.values(out.collections).reduce((s,a)=>s+a.length,0);
    try{ await downloads.save({filename:`Gulecha-Parivar-backup-${isoOf(new Date())}.json`,data:new Blob([JSON.stringify(out)],{type:"application/json"})}); $("#bkMsg").textContent=`✓ ${n} record ka backup ban gaya.`; }
    catch(e){ $("#bkMsg").textContent="Save nahi hua."; } b.disabled=false; };
}

/* ---- Parivar directory PDF ---- */
function renderDirectory(){
  const list=members.filter(m=>!isGone(m)).sort((a,b)=>(a.dob||"9999").localeCompare(b.dob||"9999"));
  $("#moreBody").innerHTML=`<div class="help">Sab members ki photo, naam, umar, sheher aur mobile ek sundar PDF kitaab mein – print karke ghar mein rakho ya WhatsApp pe bhejo. (Jinhone mobile "sirf admin" rakha hai, unka number nahi aayega.)</div>
    <div class="sec"><b>${list.length}</b> members · janam ke kram mein
    <div class="footer-actions"><button class="btn" id="dirGo">📄 PDF banao</button></div><div id="dirMsg" class="sub"></div></div>`;
  $("#dirGo").onclick=async()=>{ const b=$("#dirGo"); b.disabled=true; $("#dirMsg").textContent="Ban raha hai…";
    try{ await loadLib("h2c"); await loadLib("pdf"); }catch(e){ $("#dirMsg").textContent="Tool load nahi hua – internet check karo"; b.disabled=false; return; }
    const pdf=new window.jspdf.jsPDF({unit:"mm",format:"a4"}); const host=$("#exportHost"); const per=8;
    const pages=[]; for(let i=0;i<list.length;i+=per) pages.push(list.slice(i,i+per));
    const card=m=>{ const a=age(m.dob); const mob=isPrivate(m,"mobile")?"":(m.mobile||"");
      return `<div class="dc">${okImg(m.photo)?`<img src="${m.photo}">`:`<div class="dci">${esc(initials(m.name))}</div>`}<div><b>${esc(m.name)}</b>
        <span>${[a!==null?a+" saal":"",m.city||"",m.blood?("🩸 "+m.blood):""].filter(Boolean).map(esc).join(" · ")}</span>${mob?`<span>📱 ${esc(mob)}</span>`:""}${m.occupation?`<span>${esc(m.occupation)}</span>`:""}</div></div>`; };
    try{ for(let p=0;p<pages.length;p++){
        host.innerHTML=`<div class="dirpage">${p===0?`<div class="dhead"><img src="${KULDEVI_DATA}"><div><div class="dt">Gulecha Parivar</div><div class="ds">गुलेच्छा परिवार · Parivar Directory · ${new Date().getFullYear()}</div></div></div>`:""}
          <div class="dgrid">${pages[p].map(card).join("")}</div><div class="dfoot">॥ जय सच्चियाय माता ॥ · पृष्ठ ${p+1}/${pages.length}</div></div>`;
        if(document.fonts&&document.fonts.ready) await document.fonts.ready;
        const cv=await html2canvas(host.firstElementChild,{scale:2,backgroundColor:"#ffffff"});
        if(p) pdf.addPage(); pdf.addImage(cv.toDataURL("image/jpeg",0.9),"JPEG",0,0,210,297); $("#dirMsg").textContent=`Page ${p+1}/${pages.length}…`; }
      await downloads.save({filename:`Gulecha-Parivar-Directory-${new Date().getFullYear()}.pdf`,data:pdf.output("blob")}); $("#dirMsg").textContent="✓ PDF ban gayi";
    }catch(e){ console.error(e); $("#dirMsg").textContent="PDF nahi bani"; } finally{ host.innerHTML=""; b.disabled=false; } };
}

/* ---- Family tree poster ---- */
(function(){ const orig=window.renderTree; window.renderTree=function(){ orig(); const t=$("#tree"); if(!t||!members.length) return;
  const bar=document.createElement("div"); bar.className="footer-actions"; bar.style.margin="0 0 10px";
  bar.innerHTML=`<button class="btn" id="treeImg">🖼️ Tree ki photo banao</button>`; t.prepend(bar);
  $("#treeImg").onclick=async()=>{ toast("Tree ki photo ban rahi hai…"); try{ await loadLib("h2c"); }catch(e){ toast("Internet check karo"); return; }
    const host=$("#exportHost"); const tr=t.querySelector(".tree"); if(!tr) return;
    host.innerHTML=`<div class="treeposter"><div class="dhead"><img src="${KULDEVI_DATA}"><div><div class="dt">Gulecha Parivar – Vansh Vriksh</div><div class="ds">गुलेच्छा परिवार · ॥ जय सच्चियाय माता ॥ ॥ जय काला भैरूजी ॥</div></div></div>${tr.outerHTML}</div>`;
    try{ if(document.fonts&&document.fonts.ready) await document.fonts.ready; const el=host.firstElementChild; el.style.width=Math.max(900,host.querySelector(".tree").scrollWidth+80)+"px";
      const cv=await html2canvas(el,{scale:2,backgroundColor:"#fffaf6"}); const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
      await downloads.save({filename:"Gulecha-Parivar-Vansh-Vriksh.png",data:blob}); toast("Tree ki photo ban gayi ✓"); }
    catch(e){ console.error(e); toast("Nahi bani"); } finally{ host.innerHTML=""; } }; }; })();

/* ---- Blood group search in emergency ---- */
(function(){ const orig=window.renderEmergency; let bg=""; window.renderEmergency=function(){ orig(); const box=$("#emergency"); if(!box) return;
  const groups=[...new Set(members.filter(m=>!isGone(m)&&m.blood).map(m=>m.blood))].sort(); if(!groups.length) return;
  const chips=document.createElement("div"); chips.className="chips";
  chips.innerHTML=`<button class="chip ${bg?"":"on"}" data-bg="">Sab</button>`+groups.map(g=>`<button class="chip ${bg===g?"on":""}" data-bg="${esc(g)}">🩸 ${esc(g)}</button>`).join("");
  box.prepend(chips);
  if(bg) box.querySelectorAll(".emc").forEach(c=>{ const t=(c.querySelector(".bg")||{}).textContent; c.style.display=t===bg?"":"none"; });
  chips.onclick=e=>{ const c=e.target.closest(".chip"); if(!c) return; bg=c.dataset.bg; window.renderEmergency(); };
  box.querySelectorAll(".emc").forEach(c=>{ const nm=(c.querySelector("b")||{}).textContent; const m=members.find(x=>x.name===nm); if(m&&isPrivate(m,"mobile")){ const r=c.querySelector(".emrow"); if(r) r.textContent="📱 (sirf admin)"; } }); }; })();
