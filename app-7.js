/* ======================= 📨 Sandesh (admin → poora parivar) ======================= */
let messages=[], msgReads={}, msgSub=false;
const LR_KEY="gp_msg_lastread";
const lastRead=()=>{ try{ return +localStorage.getItem(LR_KEY)||0; }catch(e){ return 0; } };
const setLastRead=t=>{ try{ localStorage.setItem(LR_KEY,String(t)); }catch(e){} };
const myKey=()=>(user&&user.key)||uid||"";
function unreadCount(){ const lr=lastRead(); return messages.filter(m=>(m.at||0)>lr).length; }
function updBadge(){ const b=$("#msgBadge"); if(!b) return; const n=unreadCount(); b.textContent=n>9?"9+":n||""; b.style.display=n?"":"none"; }
function fmtTime(t){ const d=new Date(t); return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"})+" · "+d.toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"}); }
function fileSize(n){ return n>1048576?(n/1048576).toFixed(1)+" MB":Math.max(1,Math.round(n/1024))+" KB"; }
async function notify(m){
  try{ if(!("Notification" in window)||Notification.permission!=="granted") return;
    const body=(m.text||"").slice(0,140)||(m.file?("📎 "+m.file.name):"Naya sandesh");
    const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
    const opt={body,icon:"icon-192.png",badge:"icon-192.png",tag:"gp-"+m.id,data:{url:location.pathname+"#msg"}};
    if(reg&&reg.showNotification) reg.showNotification("📨 Gulecha Parivar – naya sandesh",opt); else new Notification("📨 Gulecha Parivar – naya sandesh",opt);
  }catch(e){}
}
function startMsgs(){
  if(msgSub||!db) return; msgSub=true; let first=true;
  db.collection("messages").onSnapshot(snap=>{
    const prev=new Set(messages.map(x=>x.id)); messages=docsFrom(snap).sort((a,b)=>(b.at||0)-(a.at||0));
    if(!first){ messages.filter(x=>!prev.has(x.id)&&x.by!==myKey()&&(x.at||0)>lastRead()).forEach(notify); }
    first=false; updBadge(); try{ window.renderHomeExtras(); }catch(e){}
    if($("#msgList")) renderMsgList();
  },()=>{});
  if(isAdmin) db.collection("msgreads").onSnapshot(snap=>{ msgReads={}; docsFrom(snap).forEach(r=>{ (msgReads[r.msg]=msgReads[r.msg]||[]).push(r); }); if($("#msgList")) renderMsgList(); },()=>{});
}
setInterval(()=>{ if(db&&loaded&&!msgSub) startMsgs(); },1500);

/* header button + home banner */
(function(){ const add=$("#addBtn"); if(add&&!$("#msgBtn")){ const b=document.createElement("button"); b.className="iconbtn"; b.id="msgBtn"; b.title="Sandesh"; b.setAttribute("aria-label","Sandesh");
    b.innerHTML=`🔔<span id="msgBadge" class="badge" style="display:none"></span>`; add.before(b); b.onclick=openMsgs; } })();
(function(){ const orig=window.renderHomeExtras; window.renderHomeExtras=function(){ orig(); try{
  const n=unreadCount(); if(!n) return; const m=messages[0]; const el=document.createElement("button"); el.className="msgbar"; el.id="msgBar";
  el.innerHTML=`<span>📨</span><div><b>${n} naya sandesh${n>1?"":""}</b><small>${esc((m.text||(m.file?"📎 "+m.file.name:"")).slice(0,90))}</small></div>›`;
  el.onclick=openMsgs; const kd=$("#kdCard"); kd?kd.after(el):$("#homeExtras").prepend(el); }catch(e){} }; })();
window.addEventListener("hashchange",()=>{ if(location.hash==="#msg") openMsgs(); });
if(location.hash==="#msg") setTimeout(()=>{ if(loaded) openMsgs(); },2500);

/* files: stored in chunks */
const CHUNK=700000;
async function saveFileChunks(id,dataUrl){ const parts=[]; for(let i=0;i<dataUrl.length;i+=CHUNK) parts.push(dataUrl.slice(i,i+CHUNK));
  for(let i=0;i<parts.length;i++){ await db.collection("msgfiles").doc(`${id}_${i}`).set({msg:id,i,data:parts[i]}); } return parts.length; }
async function loadFile(m){ const snap=await db.collection("msgfiles").where("msg","==",m.id).get(); const parts=docsFrom(snap).sort((a,b)=>a.i-b.i);
  if(parts.length!==m.file.chunks) throw new Error("adhoori file"); return parts.map(p=>p.data).join(""); }
const readAsDataURL=f=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f); });

function openMsgs(){
  setLastRead(Date.now()); updBadge(); try{ window.renderHomeExtras(); }catch(e){}
  const canNotify="Notification" in window;
  openSheet(`<div class="sheet-head"><h2>📨 Parivar Sandesh</h2><button class="x" id="cls">×</button></div>
    ${canNotify&&Notification.permission!=="granted"?`<div class="notice">🔔 Naye sandesh ki notification ke liye <button class="btn sm" id="notifOn">Notification chalu karo</button></div>`:""}
    ${isAdmin?`<div class="sec"><h4>✍️ Sabko sandesh bhejo</h4><textarea id="msgText" class="ta" maxlength="3000" placeholder="Sandesh likho… (jaise: 20 Dec ko Delhi mein shaadi hai, sab zaroor aana)"></textarea>
      <div class="actions" style="margin-top:8px;align-items:center"><label class="btn plain sm" style="cursor:pointer">📎 PDF / Photo jodo<input type="file" id="msgFile" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" hidden></label><span id="msgFileName" class="sub" style="font-size:13px"></span></div>
      <label class="chk" style="margin-top:8px"><input type="checkbox" id="msgPin"> 📌 Ghar screen pe notice bhi lagao</label>
      <div class="footer-actions"><button class="btn" id="msgSend">📤 Sabko bhejo</button></div><div id="msgProg" class="sub"></div></div>`:""}
    <div id="msgList"></div>`);
  $("#cls").onclick=closeSheet;
  const nb=$("#notifOn"); if(nb) nb.onclick=async()=>{ try{ const p=await Notification.requestPermission(); toast(p==="granted"?"🔔 Notification chalu ✓":"Notification ki ijazat nahi mili – phone settings mein allow karo"); openMsgs(); }catch(e){ toast("Is phone pe notification nahi ho payega"); } };
  if(isAdmin){ let file=null;
    $("#msgFile").onchange=e=>{ const f=e.target.files[0]; if(!f) return; if(f.size>6*1048576){ toast("File 6 MB se chhoti honi chahiye"); e.target.value=""; return; } file=f; $("#msgFileName").textContent=`📎 ${f.name} (${fileSize(f.size)})`; };
    $("#msgSend").onclick=async()=>{ const text=$("#msgText").value.trim(); if(!text&&!file){ toast("Sandesh likho ya file jodo"); return; }
      const b=$("#msgSend"); b.disabled=true; const id="msg_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      try{ const doc={text,by:myKey(),byName:(byId(uid)||{}).name||"Admin",at:Date.now()};
        if(file){ $("#msgProg").textContent="File upload ho rahi hai…"; let du=await readAsDataURL(file);
          if(file.type.startsWith("image/")&&file.size>400000){ try{ du=await shrinkPhoto(file,1600,600000); }catch(e){} }
          const chunks=await saveFileChunks(id,du); doc.file={name:file.name,type:file.type||"application/octet-stream",size:file.size,chunks};
          if(file.type.startsWith("image/")){ try{ doc.thumb=await shrinkPhoto(file,480,60000); }catch(e){} } }
        await db.collection("messages").doc(id).set(doc);
        if($("#msgPin").checked&&text){ try{ await db.collection("notices").doc("n_"+id).set({text:"📨 "+text,by:uid,at:Date.now(),pinned:true}); }catch(e){} }
        setLastRead(Date.now()); toast("Sandesh sabko chala gaya ✓"); openMsgs();
      }catch(e){ console.error(e); toast("Nahi gaya – internet ya permission check karo"); b.disabled=false; $("#msgProg").textContent=""; } }; }
  renderMsgList();
}
function renderMsgList(){
  const box=$("#msgList"); if(!box) return;
  if(!messages.length){ box.innerHTML=`<div class="empty">Abhi koi sandesh nahi.${isAdmin?"":" Admin jab bhejenge, yahan dikhega."}</div>`; return; }
  const alive=members.filter(m=>!isGone(m)).length;
  box.innerHTML=messages.map(m=>{ const rd=msgReads[m.id]||[];
    const wa=`https://wa.me/?text=${encodeURIComponent("📨 Gulecha Parivar sandesh:\n\n"+(m.text||"")+(m.file?`\n\n📎 ${m.file.name} – app mein dekhein`:"")+"\n\n👉 "+location.origin+location.pathname+"#msg")}`;
    return `<div class="sec msg" data-id="${esc(m.id)}"><div class="mhd"><b>${esc(m.byName||"Admin")}</b><span>${fmtTime(m.at)}</span></div>
      ${m.text?`<div class="mtx">${esc(m.text)}</div>`:""}
      ${m.thumb&&okImg(m.thumb)?`<img class="mth" src="${esc(m.thumb)}" alt="">`:""}
      ${m.file?`<button class="mfile" data-f="${esc(m.id)}"><span>${m.file.type==="application/pdf"?"📄":m.file.type.startsWith("image/")?"🖼️":"📎"}</span><div><b>${esc(m.file.name)}</b><small>${fileSize(m.file.size||0)} · kholne / save karne ke liye dabao</small></div></button>`:""}
      <div class="footer-actions" style="margin-top:8px">${isAdmin?`<span class="sub" style="font-size:13px;margin-right:auto">👁 ${rd.length}/${alive} ne dekha</span>`:""}
        <a class="btn sm ghost" style="text-decoration:none" href="${esc(wa)}" target="_blank" rel="noopener">💬 WhatsApp pe bhi</a>
        ${isAdmin?`<button class="btn sm danger mdel" data-id="${esc(m.id)}">Hatao</button>`:""}</div></div>`; }).join("");
  box.querySelectorAll(".mfile").forEach(b=>b.onclick=async()=>{ const m=messages.find(x=>x.id===b.dataset.f); if(!m) return; toast("File khul rahi hai…");
    try{ const du=await loadFile(m); const blob=await (await fetch(du)).blob();
      if(downloads) await downloads.save({filename:m.file.name,data:blob}); else { const u=URL.createObjectURL(blob); window.open(u,"_blank"); } }
    catch(e){ if(!e||e.code!=="declined") toast("File nahi khuli – dobara try karo"); } });
  box.querySelectorAll(".mdel").forEach(b=>b.onclick=async()=>{ if(b.dataset.sure!=="1"){ b.dataset.sure="1"; b.textContent="Pakka?"; return; }
    const m=messages.find(x=>x.id===b.dataset.id); try{ if(m&&m.file) for(let i=0;i<m.file.chunks;i++){ try{ await db.collection("msgfiles").doc(`${m.id}_${i}`).delete(); }catch(e){} }
      await db.collection("messages").doc(b.dataset.id).delete(); toast("Hata diya"); }catch(e){ toast("Nahi hua"); } });
  // read receipts (one per person per message)
  const k=myKey(); if(k&&!isAdmin) messages.slice(0,20).forEach(m=>{ const key="gp_rd_"+m.id; try{ if(localStorage.getItem(key)) return; localStorage.setItem(key,"1"); }catch(e){}
    db.collection("msgreads").doc(`${m.id}__${k}`.replace(/[\/]/g,"_")).set({msg:m.id,who:k,name:(byId(uid)||{}).name||"",at:Date.now()}).catch(()=>{}); });
}
