/* ======================= Form ======================= */
function fieldHTML([k,l,o={}],v,selfId){
  if(o.type==="hidden") return `<input type="hidden" name="${k}" value="${esc(v??"")}">`;
  const cls="f"+((o.full||o.area)?" full":"");
  const lab=`${esc(fieldLabel(k,l))}${o.req?' <span class="req">*</span>':""}`;
  v=v??"";
  if(o.checks){ const on=String(v).split(","); return `<div class="${cls}"><div class="flabel">${lab}</div><div class="checks">${o.checks.map(x=>`<label class="chk"><input type="checkbox" name="${k}" value="${esc(x)}" ${on.includes(x)?"checked":""}> ${esc(x)}</label>`).join("")}</div></div>`; }
  if(o.member){
    const opts=members.filter(x=>x.id!==selfId).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    return `<label class="${cls}">${lab}<select name="${k}"><option value="">— koi nahi —</option>${opts.map(x=>`<option value="${esc(x.id)}" ${x.id===v?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>`;
  }
  if(o.sel){ const list=o.sel.includes(v)||!v?o.sel:[...o.sel,v];
    return `<label class="${cls}">${lab}<select name="${k}">${list.map(x=>`<option ${x===v?"selected":""} value="${esc(x)}">${x?esc(x):"— chuniye —"}</option>`).join("")}</select></label>`; }
  if(o.area) return `<label class="${cls}">${lab}<textarea name="${k}" maxlength="2000">${esc(v)}</textarea></label>`;
  return `<label class="${cls}">${lab}<input name="${k}" type="${o.type||"text"}" value="${esc(v)}" maxlength="200" ${o.req?"required":""}></label>`;
}
let pendingPhoto;
function openForm(id, isNew){
  const m = id ? (byId(id)||{id}) : {};
  current = id||null; pendingPhoto=undefined;
  const selfId = id || "__new__";
  const title = isNew==="other" ? "Naya member" : (id===uid && !byId(uid)) ? "Apna biodata bharo" : "Biodata edit karo";
  openSheet(`
    <div class="sheet-head"><h2>${title}</h2><button class="x" aria-label="Band karo" id="cls">×</button></div>
    <form id="bform" novalidate>
      <div class="sec"><div class="photo-row"><div id="photoPrev">${avatar(m,"big")}</div>
        <div class="actions"><label class="btn plain" style="cursor:pointer">📷 Photo chuno<input type="file" accept="image/*" id="photoIn" hidden></label>
        ${m.photo?'<button type="button" class="btn danger" id="rmPhoto">Hatao</button>':""}</div></div></div>
      ${SECTIONS.map((s,i)=>`<details class="sec fsec" ${i<2||(s.t.startsWith("Swargiya")&&isGone(m))?"open":""}><summary><h4>${esc(secTitle(s.t))}</h4></summary>${s.note?`<p class="sub" style="margin:0 0 8px;font-size:14px">${esc(s.note)}</p>`:""}<div class="fgrid">${s.f.map(f=>fieldHTML(f,f[0]==="alive"?(m.alive||"Jeevit"):m[f[0]],selfId)).join("")}</div>${i===0?'<div id="tithiNote" class="help" style="display:none;margin:10px 0 0"></div>':""}</details>`).join("")}
      <div class="footer-actions">
        ${id && !isNew && (isAdmin || m.createdBy===uid) && m.id!==uid ?'<button type="button" class="btn danger" id="delBtn">Delete</button>':""}
        <button type="button" class="btn plain" id="cancelBtn">Cancel</button>
        <button type="submit" class="btn" id="saveBtn">💾 Save karo</button>
      </div>
      <div class="confirm" id="confirmBox">Sach mein <b>${esc(m.name||"is member")}</b> ka biodata delete karna hai?
        <div class="footer-actions"><button type="button" class="btn plain" id="noDel">Nahi</button><button type="button" class="btn danger" id="yesDel">Haan, delete</button></div></div>
    </form>`);
  const f=$("#bform");
  $("#cls").onclick=closeSheet; $("#cancelBtn").onclick=()=> (id && byId(id)) ? openView(id) : closeSheet();
  const autoTithi=(force)=>{
    const dob=f.dob.value, tob=f.tob.value; if(!dob) return;
    if(!force && (f.hs_month.value||f.hs_tithi.value)) return;
    let r; try{ r=Panchang.compute(dob,tob) }catch(e){ return } if(!r) return;
    const o=tithiObj(r);
    for(const k of HS){ const el=f[k]; if(el.tagName==="SELECT" && ![...el.options].some(x=>x.value===o[k])){ const op=document.createElement("option"); op.value=op.textContent=o[k]; el.appendChild(op);} el.value=o[k]; }
    const n=$("#tithiNote"); n.style.display="block";
    n.textContent=`✨ ${tithiText(o)} – English date${tob?" aur janam samay":""} se apne aap nikali gayi. Panchang/kundli se ek baar mila lena.`;
  };
  const viaUpd=()=>{ const X=byId(f.q_member.value), d=REL_DEFS[f.q_type.value]; let box=$("#qViaBox");
    if(!box){ box=document.createElement("label"); box.id="qViaBox"; box.className="f full"; f.q_type.closest("label").after(box); }
    if(!X||!d||d[0]==="self"){ box.innerHTML=""; box.style.display="none"; return; }
    const c=relVia(X,d[0]); box.style.display="";
    box.innerHTML=c.length?`Kiske through? (${esc(X.name.split(" ")[0])} ke ${esc(VIA_NAME[d[0]]||"")})<select id="qVia">${c.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select>`
      :`<span class="help" style="margin:0">⚠️ ${esc(X.name)} ke ${esc(VIA_NAME[d[0]]||"")} abhi app mein nahi hain. Pehle unka biodata jodo, phir ye rishta judega.</span>`; };
  const preview=()=>{ let pv=$("#qPrev"); if(!pv){ pv=document.createElement("div"); pv.id="qPrev"; pv.className="help"; pv.style.margin="6px 0 0"; pv.style.gridColumn="1/-1"; f.q_type.closest("label").after(pv); }
    const X=byId(f.q_member.value), t=f.q_type.value, nm=(f.name.value||"Ye vyakti").trim();
    if(!X||!t){ pv.style.display="none"; return; } pv.style.display="";
    let warn=""; const d=REL_DEFS[t]; const myDob=f.dob.value;
    if(d&&myDob&&X.dob){ const older=myDob<X.dob; if(["parent"].includes(d[1])&&d[0]==="self"&&!older) warn="⚠️ Umar ke hisaab se ye ulta lag raha hai – dhyan se chuno!"; if(d[1]==="child"&&d[0]==="self"&&older) warn="⚠️ Umar ke hisaab se ye ulta lag raha hai – kya aap “Pita/Mata” chunna chahte the?"; }
    pv.innerHTML=`➡️ <b>${esc(nm)}</b>, <b>${esc(X.name)}</b> ke <b>${esc(t)}</b> hain.${warn?`<br><span style="color:#b3261e">${warn}</span>`:""}`; };
  f.q_member.addEventListener("change",()=>{viaUpd();preview();}); f.q_type.addEventListener("change",()=>{viaUpd();preview();}); f.name.addEventListener("input",preview); f.dob.addEventListener("change",preview);
  f.dob.addEventListener("change",()=>autoTithi(true));
  f.tob.addEventListener("change",()=>autoTithi(true));
  autoTithi(false);
  $("#photoIn").onchange=async e=>{const file=e.target.files[0]; if(!file) return;
    try{ pendingPhoto=await shrinkSquare(file); $("#photoPrev").innerHTML=avatar({photo:pendingPhoto},"big");}catch(err){toast("Photo load nahi hui")}};
  const rp=$("#rmPhoto"); if(rp) rp.onclick=()=>{pendingPhoto="";$("#photoPrev").innerHTML=avatar({name:m.name},"big")};
  const dbn=$("#delBtn"); if(dbn){ dbn.onclick=()=>$("#confirmBox").classList.add("open"); $("#noDel").onclick=()=>$("#confirmBox").classList.remove("open"); $("#yesDel").onclick=()=>removeMember(id); }
  f.onsubmit=e=>{e.preventDefault();save(id,m,isNew)};
}
function loadImg(file){return new Promise((res,rej)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);res(img)};img.onerror=rej;img.src=url;})}
async function shrinkSquare(file){
  const img=await loadImg(file); const S=480,c=document.createElement("canvas");c.width=S;c.height=S;const x=c.getContext("2d");
  const s=Math.min(img.width,img.height);x.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,S,S);return c.toDataURL("image/jpeg",0.82);
}
async function shrinkPhoto(file,max,limit){
  const img=await loadImg(file); let w=img.width,h=img.height,scale=Math.min(1,max/Math.max(w,h)),q=0.75,out;
  for(let i=0;i<8;i++){ const c=document.createElement("canvas"); c.width=Math.round(w*scale); c.height=Math.round(h*scale);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height); out=c.toDataURL("image/jpeg",q);
    if(out.length<=limit) return out; if(q>0.5) q-=0.1; else scale*=0.8; }
  return out;
}
let saving=false;
const VIA_NAME={dada:"dada ji",dadi:"dadi ji",nana:"nana ji",nani:"nani ji",dadaBro:"bade/chhote dada",dadaSis:"bua dadi",nanaBro:"bade/chhote nana",nanaSis:"nana ji ki behen",cousinsM:"chachere/mamere bhai",cousinsF:"chacheri/mameri behen",spouseFather:"sasur",spouseMother:"saas",spouseFatherBro:"chacha sasur / bade sasur",spouseFatherSis:"bua saas",spouseMotherBro:"mama sasur",spouseMotherSis:"mausi saas",spouseBrothers:"pati/patni ke bhai",spouseSisters:"pati/patni ki behen",father:"pita",mother:"mata",spouse:"pati/patni",husband:"pati",wife:"patni",sons:"beta",daughters:"beti",brothers:"bhai",sisters:"behen",fatherBro:"chacha/taau",fatherSis:"bua",motherBro:"mama",motherSis:"mausi","fatherSibs+motherSibs":"chacha/bua/mama/mausi"};
function siblingsOf(m){ if(!m) return []; return members.filter(k=>k.id!==m.id&&((k.father_id&&k.father_id===m.father_id)||(k.mother_id&&k.mother_id===m.mother_id)||k.sib_of===m.id||m.sib_of===k.id||(k.sib_of&&k.sib_of===m.sib_of))); }
function childrenOf(m){ return m?members.filter(k=>k.father_id===m.id||k.mother_id===m.id):[]; }
function relVia(X,via){
  const fa=byId(X.father_id), mo=byId(X.mother_id), sp=spouseOf(X);
  const G2=(list,g)=>list.filter(p=>!g||p.gender===g);
  switch(via){
    case "father": return fa?[fa]:[]; case "mother": return mo?[mo]:[];
    case "spouse": return sp?[sp]:[]; case "husband": return sp&&sp.gender!=="Female"?[sp]:[]; case "wife": return sp&&sp.gender!=="Male"?[sp]:[];
    case "sons": return G2(childrenOf(X),"Male"); case "daughters": return G2(childrenOf(X),"Female");
    case "brothers": return G2(siblingsOf(X),"Male"); case "sisters": return G2(siblingsOf(X),"Female");
    case "fatherBro": return G2(siblingsOf(fa),"Male"); case "fatherSis": return G2(siblingsOf(fa),"Female");
    case "motherBro": return G2(siblingsOf(mo),"Male"); case "motherSis": return G2(siblingsOf(mo),"Female");
    case "fatherSibs+motherSibs": return [...siblingsOf(fa),...siblingsOf(mo)];
    case "dada": { const x=fa&&byId(fa.father_id); return x?[x]:[]; } case "dadi": { const x=fa&&byId(fa.mother_id); return x?[x]:[]; }
    case "nana": { const x=mo&&byId(mo.father_id); return x?[x]:[]; } case "nani": { const x=mo&&byId(mo.mother_id); return x?[x]:[]; }
    case "dadaBro": return G2(siblingsOf(fa&&byId(fa.father_id)),"Male"); case "dadaSis": return G2(siblingsOf(fa&&byId(fa.father_id)),"Female");
    case "nanaBro": return G2(siblingsOf(mo&&byId(mo.father_id)),"Male"); case "nanaSis": return G2(siblingsOf(mo&&byId(mo.father_id)),"Female");
    case "cousinsM": case "cousinsF": { const cs=[...siblingsOf(fa),...siblingsOf(mo)].flatMap(childrenOf).filter(c=>c.id!==X.id&&!siblingsOf(X).some(s=>s.id===c.id)); return G2(cs,via==="cousinsM"?"Male":"Female"); }
  }
  const sfa=sp&&byId(sp.father_id), smo=sp&&byId(sp.mother_id);
  switch(via){
    case "spouseFather": return sfa?[sfa]:[]; case "spouseMother": return smo?[smo]:[];
    case "spouseFatherBro": return G2(siblingsOf(sfa),"Male"); case "spouseFatherSis": return G2(siblingsOf(sfa),"Female");
    case "spouseMotherBro": return G2(siblingsOf(smo),"Male"); case "spouseMotherSis": return G2(siblingsOf(smo),"Female");
    case "spouseBrothers": return G2(siblingsOf(sp),"Male"); case "spouseSisters": return G2(siblingsOf(sp),"Female");
  } return [];
}
function linkAs(data,M,link,later){
  const fem=data.gender==="Female";
  if(link==="child"){ const sp=spouseOf(M); if(M.gender==="Female"){ data.mother_id=M.id; if(sp) data.father_id=sp.id; } else { data.father_id=M.id; if(sp) data.mother_id=sp.id; } }
  if(link==="sibling"){ if(M.father_id||M.mother_id){ data.father_id=M.father_id||""; data.mother_id=M.mother_id||""; } else data.sib_of=M.sib_of||M.id; }
  if(link==="spouse"){ data.spouse_id=M.id; if(!M.spouse_id) later.push([M.id,{spouse_id:"__SELF__"}]); }
  if(link==="parent"){ later.push([M.id,fem?{mother_id:"__SELF__"}:{father_id:"__SELF__"}]);
    if(data.spouse_id) later.push([M.id,fem?{father_id:data.spouse_id}:{mother_id:data.spouse_id}]);
    siblingsOf(M).forEach(s=>{ if(!s.father_id&&!s.mother_id) later.push([s.id,fem?{mother_id:"__SELF__"}:{father_id:"__SELF__"}]); }); }
}
async function save(id,old,isNew){
  if(saving) return;
  const fd=new FormData($("#bform")); const data={};
  ALL_FIELDS.forEach(([k,,o])=>{data[k]=o&&o.checks?fd.getAll(k).join(","):String(fd.get(k)||"").trim()});
  if(!data.name){toast("Naam zaroori hai");return}
  const qX=byId(data.q_member), qT=data.q_type; delete data.q_member; delete data.q_type;
  const qViaId=($("#qVia")||{}).value||"";
  const later=[]; // updates to other members' docs
  if(qX&&qT&&REL_DEFS[qT]){
    const [via,link,g]=REL_DEFS[qT]; if(!data.gender) data.gender=g;
    let M=qX; if(via!=="self"){ const c=relVia(qX,via); M=byId(qViaId)||(c.length===1?c[0]:null);
      if(!M){ toast(c.length?"“Kiske through” mein vyakti chuno":`${qX.name} ka ${VIA_NAME[via]||"rishta"} pehle app mein jodo`); return; } }
    linkAs(data,M,link,later);
  } else if(qX&&qT){
    const xFem=qX.gender==="Female";
    if(qT==="Beta / Beti"){ if(xFem){ data.mother_id=qX.id; const sp=spouseOf(qX); if(sp&&!data.father_id) data.father_id=sp.id; } else { data.father_id=qX.id; const sp=spouseOf(qX); if(sp&&!data.mother_id) data.mother_id=sp.id; } }
    if(qT==="Bhai / Behen"){ if(!qX.father_id&&!qX.mother_id){ toast(`Pehle ${qX.name} ke mata-pita jodo, tab bhai-behen apne aap judenge`); } else { data.father_id=qX.father_id||data.father_id; data.mother_id=qX.mother_id||data.mother_id; } }
    if(qT==="Pati / Patni"){ data.spouse_id=qX.id; if(!qX.spouse_id) later.push([qX.id,{spouse_id:"__SELF__"}]); }
    if(qT==="Pita / Mata"){ const fem=data.gender==="Female"; later.push([qX.id,fem?{mother_id:"__SELF__"}:{father_id:"__SELF__"}]);
      if(data.spouse_id) later.push([qX.id,fem?{father_id:data.spouse_id}:{mother_id:data.spouse_id}]); }
  }
  delete data.relation; if(old.relation) data.relation=old.relation;
  data.photo = pendingPhoto!==undefined ? pendingPhoto : (old.photo||"");
  if(old.ownerKey) data.ownerKey=old.ownerKey;
  if(old.ownerEmail) data.ownerEmail=old.ownerEmail;
  if(old.sib_of && !data.sib_of) data.sib_of=old.sib_of;
  if(isAdmin && !data.ownerEmail && data.email && data.email.includes("@")) data.ownerEmail=data.email.trim().toLowerCase();
  if(isAdmin && !data.ownerKey && data.mobile){ const k=normKey(data.mobile); if(k) data.ownerKey=k; }
  data.updatedAt=Date.now(); data.updatedBy=uid; data.createdBy=old.createdBy||uid;
  const docId = id || ("m_"+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
  saving=true; $("#saveBtn").disabled=true; $("#saveBtn").textContent="Save ho raha hai…";
  try{
    await db.collection("members").doc(docId).set(data);
    const i=members.findIndex(x=>x.id===docId); const rec={id:docId,...data};
    if(i>=0) members[i]=rec; else members.push(rec);
    for(const [oid,upd] of later){ const u={}; for(const k in upd) u[k]=upd[k]==="__SELF__"?docId:upd[k];
      const o=byId(oid); if(!o) continue; if(Object.keys(u).every(k=>o[k])) continue;
      for(const k in u) if(o[k]) delete u[k];
      try{ await db.collection("members").doc(oid).update(u); Object.assign(o,u); }
      catch(err){ toast(`${o.name} ki profile mein rishta jodne ki permission nahi – owner se jodwao`); } }
    renderAll(); toast("Save ho gaya ✓"); openView(docId);
  }catch(err){
    console.error(err); toast("Save nahi hua – shayad edit ki permission nahi hai");
    $("#saveBtn").disabled=false; $("#saveBtn").textContent="💾 Save karo";
  }finally{saving=false}
}
async function removeMember(id){
  try{ await db.collection("members").doc(id).delete(); members=members.filter(m=>m.id!==id); renderAll(); closeSheet(); toast("Delete ho gaya"); }
  catch(e){ toast("Delete nahi hua – permission nahi hai"); }
}
$("#myBtn").onclick=()=>{ if(!uid) return; byId(uid) ? openView(uid) : openForm(uid,"self"); };
$("#addBtn").onclick=()=>openForm(null,"other");

const FESTIVALS=[
 ["Makar Sankranti","मकर संक्रांति",null,"01-14",0,"🪁"],
 ["Vasant Panchami","वसंत पंचमी","Magh",5,10,"🌼"],
 ["Maha Shivratri","महाशिवरात्रि","Phalgun",29,23.75,"🔱","Mahashivratri"],
 ["Holika Dahan","होलिका दहन","Phalgun",15,19,"🔥"],
 ["Holi","होली","Phalgun",15,19,"🎨",null,1],
 ["Nav Varsh · Chaitra Navratri","नव संवत्सर","Chaitra",1,7,"🚩","Navratri"],
 ["Ram Navami","राम नवमी","Chaitra",9,12,"🏹"],
 ["Hanuman Jayanti","हनुमान जयंती","Chaitra",15,7,"🙏"],
 ["Akshaya Tritiya","अक्षय तृतीया","Vaishakh",3,10,"✨"],
 ["Buddha Purnima","बुद्ध पूर्णिमा","Vaishakh",15,7,"☸️"],
 ["Guru Purnima","गुरु पूर्णिमा","Ashadh",15,7,"🙏"],
 ["Nag Panchami","नाग पंचमी","Shravan",5,7,"🐍"],
 ["Raksha Bandhan","रक्षा बंधन","Shravan",15,10,"🪢"],
 ["Janmashtami","जन्माष्टमी","Bhadrapad",23,23.75,"🦚","Janmashtami"],
 ["Ganesh Chaturthi","गणेश चतुर्थी","Bhadrapad",4,12,"🐘"],
 ["Anant Chaturdashi","अनंत चतुर्दशी","Bhadrapad",14,7,"🪔"],
 ["Pitru Paksha aarambh","पितृ पक्ष आरंभ","Bhadrapad",15,7,"🌾"],
 ["Sarvapitri Amavasya","सर्वपितृ अमावस्या","Ashwin",30,7,"🌾"],
 ["Sharad Navratri","शारदीय नवरात्रि","Ashwin",1,7,"🪔","Navratri"],
 ["Durga Ashtami","दुर्गा अष्टमी","Ashwin",8,7,"🌺"],
 ["Dussehra","दशहरा","Ashwin",10,14,"🏹"],
 ["Sharad Purnima","शरद पूर्णिमा","Ashwin",15,20,"🌕"],
 ["Karwa Chauth","करवा चौथ","Kartik",19,20.5,"🌙","Karwa Chauth"],
 ["Dhanteras","धनतेरस","Kartik",28,19,"🪙"],
 ["Diwali","दीपावली","Kartik",30,19,"🪔"],
 ["Govardhan Puja","गोवर्धन पूजा","Kartik",1,7,"🐄"],
 ["Bhai Dooj","भाई दूज","Kartik",2,12,"👫"],
 ["Chhath Puja","छठ पूजा","Kartik",6,7,"🌅"],
 ["Dev Uthani Ekadashi","देवउठनी एकादशी","Kartik",11,7,"🙏"],
 ["Kartik Purnima","कार्तिक पूर्णिमा","Kartik",15,7,"🌕"],
];
function festivalDates(year){
  const out=[];
  FESTIVALS.forEach(([n,hi,mon,raw,h,icon,vrat,off])=>{
    let iso;
    if(!mon) iso=`${year}-${raw}`;
    else { iso=Panchang.findInYearT(year,mon,raw,h)||Panchang.findInYear(year,mon,raw); if(iso&&off){const d=new Date(iso+"T00:00:00");d.setDate(d.getDate()+off);iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;} }
    if(iso&&iso.startsWith(String(year))) out.push({iso,name:n,hi,icon,vrat:vrat||null});
  });
  return out.sort((a,b)=>a.iso.localeCompare(b.iso));
}
const VRAT_OPTS=["Ekadashi","Purnima","Amavasya","Pradosh","Sankashti Chaturthi","Karwa Chauth","Navratri","Mahashivratri","Janmashtami","Somvar","Mangalvar","Guruvar","Shanivar"];
const VRAT_HI={"Ekadashi":"एकादशी","Purnima":"पूर्णिमा","Amavasya":"अमावस्या","Pradosh":"प्रदोष","Sankashti Chaturthi":"संकष्टी चतुर्थी"};
const _vcache={};
function vratDates(year){
  if(_vcache[year]) return _vcache[year];
  const days=Panchang.yearDays(year), out=[];
  const add=(i,type,key)=>{ if(i>0&&days[i-1][key]===days[i][key]) return; let label=type;
    if(type==="Ekadashi"){ try{const c=Panchang.compute(days[i].iso); label=`${c.month} ${c.paksha.split(" ")[0]} Ekadashi`;}catch(e){} }
    out.push({iso:days[i].iso,vrat:type,label}); };
  const hit=(i,key,t)=>{const c=days[i][key],p=i>0?days[i-1][key]:null; if(c===t) return true; if(p===null) return false;
    if(t===30) return p===29&&c===1; return p<t&&c>t&&c-p===2; };
  days.forEach((d,i)=>{
    if(hit(i,"raw",11)||hit(i,"raw",26)) add(i,"Ekadashi","raw");
    if(hit(i,"eve",15)) add(i,"Purnima","eve");
    if(hit(i,"raw",30)) add(i,"Amavasya","raw");
    if(hit(i,"eve",13)||hit(i,"eve",28)) add(i,"Pradosh","eve");
    if(hit(i,"night",19)) add(i,"Sankashti Chaturthi","night");
  });
  return _vcache[year]=out;
}

/* ======================= Language (Hinglish / हिंदी) ======================= */
let LANG="hn"; try{ LANG=localStorage.getItem("parivar_lang")||"hn" }catch(e){}
const TAB_ICON={members:"🏠",calendar:"📅",tree:"🌳",parivar:"🛕",events:"🎉",more:"☰"};
const HI_TABS={members:"घर",calendar:"कैलेंडर",tree:"वृक्ष",parivar:"कुल",events:"कार्यक्रम",more:"और"};
const HN_TABS={members:"Ghar",calendar:"Calendar",tree:"Tree",parivar:"Kul",events:"Events",more:"Aur"};
const HI_SEC={"Personal":"व्यक्तिगत","Family":"परिवार","Family Tree ke liye jodo":"वंश वृक्ष के लिए जोड़ें","Contact":"संपर्क","Padhai aur Kaam":"पढ़ाई और काम","Aur jaankari":"और जानकारी","Vrat aur puja":"व्रत और पूजा","Bachchon ke liye":"बच्चों के लिए","Rishta ke liye (shaadi)":"रिश्ते के लिए (विवाह)","Documents – sirf expiry date":"दस्तावेज़ – सिर्फ समाप्ति तिथि","Swargiya (purvaj ke liye)":"स्वर्गीय (पूर्वजों के लिए)"};
const HI_F={name:"पूरा नाम",nickname:"घर का नाम",relation:"परिवार में रिश्ता",gender:"लिंग",dob:"जन्म तारीख (अंग्रेज़ी)",tob:"जन्म समय",hs_year:"जन्म तिथि: विक्रम संवत",hs_month:"हिंदू महीना",hs_paksha:"पक्ष",hs_tithi:"तिथि",pob:"जन्म स्थान",blood:"ब्लड ग्रुप",height:"कद",gotra:"गोत्र",rashi:"राशि / नक्षत्र",father:"पिता का नाम",mother:"माता का नाम",marital:"वैवाहिक स्थिति",spouse:"पति / पत्नी का नाम",anniversary:"विवाह वर्षगांठ",children:"बच्चे",siblings:"भाई-बहन",father_id:"पिता (ऐप में से)",mother_id:"माता (ऐप में से)",spouse_id:"पति / पत्नी (ऐप में से)",mobile:"मोबाइल",whatsapp:"व्हाट्सऐप",email:"ईमेल",address:"वर्तमान पता",city:"शहर",native:"मूल गाँव",education:"शिक्षा",occupation:"व्यवसाय",company:"कंपनी / व्यापार",workcity:"काम का शहर",income:"आय",languages:"भाषाएँ",hobbies:"शौक",diet:"भोजन",medical:"स्वास्थ्य नोट्स",emergency:"आपातकालीन संपर्क",about:"अपने बारे में",vrat:"कौन से व्रत रखते हैं",school:"स्कूल / कॉलेज",standard:"कक्षा",activity:"ट्यूशन / एक्टिविटी",vac_name:"अगला टीका (नाम)",vac_date:"अगले टीके की तारीख",manglik:"मांगलिक",kundli:"कुंडली विवरण",pref:"जीवनसाथी की अपेक्षा",exp_passport:"पासपोर्ट समाप्ति",exp_license:"ड्राइविंग लाइसेंस समाप्ति",exp_health:"स्वास्थ्य बीमा नवीनीकरण",exp_life:"जीवन बीमा प्रीमियम",exp_vehicle:"वाहन बीमा",exp_puc:"PUC",exp_other_name:"अन्य दस्तावेज़",exp_other:"उसकी समाप्ति",alive:"स्थिति",dod:"देहांत की तारीख",memories:"यादें"};
const L=(hn,hi)=>LANG==="hi"?hi:hn;
const secTitle=t=>LANG==="hi"&&HI_SEC[t]?HI_SEC[t]:t;
const fieldLabel=(k,l)=>LANG==="hi"&&HI_F[k]?HI_F[k]:l;
function applyLangStatic(){
  document.querySelectorAll(".tab").forEach(b=>b.innerHTML=`<span class="ti">${TAB_ICON[b.dataset.tab]}</span><span class="tl">${(LANG==="hi"?HI_TABS:HN_TABS)[b.dataset.tab]}</span>`);
  $("#xlsBtn").textContent=L("⬇️ Excel download","⬇️ एक्सेल डाउनलोड");
  $("#addEvent").textContent=L("+ Naya event","+ नया कार्यक्रम");
  $("#search").placeholder=L("Naam, rishta, sheher se dhoondo…","नाम, रिश्ता, शहर से खोजें…");
  document.querySelector("h1").innerHTML=L('Gulecha <span>Parivar</span>','गुलेच्छा <span>परिवार</span>');
}

/* ======================= Aaj ka panchang / notices / on this day ======================= */
function todayPanchang(){
  const t=isoOf(new Date()); let p=null; try{p=Panchang.compute(t)}catch(e){}
  if(!p) return "";
  const fest=festivalDates(+t.slice(0,4)).filter(f=>f.iso===t).map(f=>`${f.icon} ${L(f.name,f.hi)}`);
  const vr=vratDates(+t.slice(0,4)).filter(v=>v.iso===t).map(v=>L(v.label,VRAT_HI[v.vrat]||v.label));
  return `<div class="panchang"><div><b>🪔 ${L("Aaj","आज")}:</b> ${esc(p.month)} ${esc(p.paksha)} ${esc(p.tithi)} · ${L("Vikram Samvat","विक्रम संवत")} ${p.vs}</div>${fest.length||vr.length?`<div class="pfest">${esc([...fest,...vr.map(x=>"🙏 "+x)].join(" · "))}</div>`:""}</div>`;
}
let notices=[];
function onThisDay(){
  const n=new Date(), md=`${pad(n.getMonth()+1)}-${pad(n.getDate())}`;
  return events.filter(e=>e.date&&e.date.slice(5)===md&&+e.date.slice(0,4)<n.getFullYear()).map(e=>{
    const y=n.getFullYear()-+e.date.slice(0,4);
    return `<button class="otd" data-eid="${esc(e.id)}">📸 <b>${y} ${L("saal pehle aaj","साल पहले आज")}:</b> ${esc(e.title)}${e.photoCount?` · ${e.photoCount} photos`:""} ›</button>`;}).join("");
}
function renderHomeExtras(){
  const cta = db&&uid&&loaded&&!byId(uid) ? `<button class="cta" id="ctaBio"><span>✍️</span><div><b>${L("Apna biodata bharo","अपना बायोडाटा भरें")}</b><small>${L("2 minute lagenge – phir saare rishte apne aap dikhenge","2 मिनट लगेंगे – फिर सारे रिश्ते अपने आप दिखेंगे")}</small></div>›</button>` : "";
  const pin=notices.filter(x=>x.pinned||(Date.now()-(x.at||0))<7*864e5).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(b.at||0)-(a.at||0)).slice(0,2);
  const kd=`<button class="kd" id="kdCard"><span class="kd-pair"><img src="kuldevi-thumb.jpg" alt="Sachiyay Mata"><img src="kuldevta-thumb.jpg" alt="Kala Bheruji"></span><div><b>॥ जय सच्चियाय माता ॥</b><b>॥ जय काला भैरूजी ॥</b><small>${L("Kuldevi aur Kuldevta","कुलदेवी और कुलदेवता")}</small></div><span>🙏</span></button>`;
  $("#homeExtras").innerHTML=kd+cta+todayPanchang()+pin.map(x=>`<button class="noticebar" data-more="notices">📌 ${esc(x.text.length>140?x.text.slice(0,140)+"…":x.text)}<small>${esc((byId(x.by)||{}).name||"")}</small></button>`).join("")+onThisDay();
}
$("#homeExtras").addEventListener("click",e=>{ if(e.target.closest("#kdCard")){ showTab("parivar"); return; } if(e.target.closest("#ctaBio")){ openForm(uid,"self"); return; }const o=e.target.closest(".otd");if(o){showTab("events");openEvent(o.dataset.eid);return}
  const nb=e.target.closest(".noticebar");if(nb){showTab("more");openMore("notices");}});

/* ======================= "Aur" (more) section ======================= */
let moreView=null;
const MORE_TILES=[["directory","📖","Parivar directory (PDF)","परिवार डायरेक्टरी"],["notices","📌","Notice board","सूचना पट"],["kinship","🔗","Kaun kiska kya lagta hai","कौन किसका क्या लगता है"],["recipes","🍲","Recipe book","पारिवारिक रसोई"],["stories","📖","Kahaniyan aur kisse","कहानियाँ और किस्से"],["shaadi","💍","Shaadi-rishte","विवाह योग्य"],["emergency","🆘","Emergency card","आपातकालीन कार्ड"],["settings","⚙️","Settings aur madad","सेटिंग और मदद"]];
function renderMore(){
  if(isAdmin && !MORE_TILES.some(t=>t[0]==="access")) MORE_TILES.unshift(["access","👥","Family access (admin)","परिवार एक्सेस (एडमिन)"],["import","📥","Purana data laao (admin)","पुराना डेटा लाएँ (एडमिन)"],["dash","📊","Admin dashboard","एडमिन डैशबोर्ड"],["backup","📦","Backup","बैकअप"]);
  if(!moreView){
    $("#more").innerHTML=`<div class="tiles">${MORE_TILES.map(([k,ic,hn,hi])=>`<button class="tile" data-k="${k}"><span>${ic}</span>${esc(L(hn,hi))}</button>`).join("")}</div>`;
    $("#more").querySelectorAll(".tile").forEach(b=>b.onclick=()=>openMore(b.dataset.k)); return;
  }
  const t=MORE_TILES.find(x=>x[0]===moreView);
  $("#more").innerHTML=`<button class="back" id="moreBack">‹ ${L("Wapas","वापस")}</button><h2 class="mh">${t[1]} ${esc(L(t[2],t[3]))}</h2><div id="moreBody"></div>`;
  $("#moreBack").onclick=()=>{moreView=null;renderMore()};
  ({notices:renderNotices,kinship:renderKinship,recipes:()=>renderCrud("recipes"),stories:()=>renderCrud("stories"),shaadi:renderShaadi,emergency:renderEmergencyInto,settings:renderSettings,access:renderAccess,password:()=>renderPassword(),import:renderImport,dash:renderDash,backup:renderBackup,directory:renderDirectory})[moreView]();
}
function openMore(k){moreView=k;renderMore();window.scrollTo(0,0)}

/* ---- Notices ---- */
function renderNotices(){
  const list=[...notices].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(b.at||0)-(a.at||0));
  $("#moreBody").innerHTML=(canWriteShared()?`<div class="sec"><textarea id="ntext" class="ta" maxlength="1000" placeholder="${L("Family ke liye zaroori khabar likho…","परिवार के लिए ज़रूरी सूचना लिखें…")}"></textarea><div class="footer-actions">${isAdmin?`<label class="chk"><input type="checkbox" id="npin"> 📌 ${L("Upar pin karo","ऊपर पिन करें")}</label>`:""}<button class="btn" id="npost">${L("Post karo","पोस्ट करें")}</button></div></div>`:"")+
    (list.length?list.map(x=>`<div class="sec notice-item">${x.pinned?"📌 ":""}<div class="nt">${esc(x.text)}</div><div class="sub" style="font-size:13px">${esc((byId(x.by)||{}).name||L("Member","सदस्य"))} · ${new Date(x.at||0).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
      ${(isAdmin||x.by===uid)&&canWriteShared()?` · <button class="linkbtn" data-del="${esc(x.id)}">${L("Hatao","हटाएँ")}</button>`:""}</div></div>`).join(""):`<div class="empty">${L("Abhi koi notice nahi.","अभी कोई सूचना नहीं।")}</div>`);
  const pb=$("#npost"); if(pb) pb.onclick=async()=>{const t=$("#ntext").value.trim(); if(!t) return; pb.disabled=true;
    const id="n_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
    try{ await db.collection("notices").doc(id).set({text:t,by:uid,at:Date.now(),pinned:!!($("#npin")&&$("#npin").checked)}); toast(L("Post ho gaya ✓","पोस्ट हो गया ✓")); }catch(e){toast("Post nahi hua");pb.disabled=false}};
  $("#moreBody").querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{try{await db.collection("notices").doc(b.dataset.del).delete()}catch(e){toast("Nahi hua")}});
}

/* ---- Kinship ---- */
function neighbours(m){
  const out=[]; const add=(t,p)=>{if(p&&p.id!==m.id)out.push({t,to:p})};
  add("P",byId(m.father_id)); add("P",byId(m.mother_id));
  members.forEach(k=>{ if(k.father_id===m.id||k.mother_id===m.id) add("C",k); });
  add("S",spouseOf(m));
  members.forEach(k=>{ if(k.id===m.id) return; if(k.sib_of===m.id||m.sib_of===k.id||(k.sib_of&&k.sib_of===m.sib_of)) add("B",k); });
  return out;
}
function findPath(fromId,toId){
  const prev={[fromId]:null}; const q=[fromId];
  while(q.length){ const id=q.shift(); if(id===toId) break; const m=byId(id); if(!m) continue;
    for(const n of neighbours(m)){ if(n.to.id in prev) continue; prev[n.to.id]={from:id,t:n.t}; q.push(n.to.id); } }
  if(!(toId in prev)) return null;
  const path=[]; let cur=toId; while(prev[cur]){ const st={t:prev[cur].t,to:byId(cur)};
    if(st.t==="B") path.unshift({t:"P",to:{id:"_ph",gender:"",name:""}},{t:"C",to:st.to}); else path.unshift(st); cur=prev[cur].from; }
  return path;
}
const isM=p=>p&&p.gender==="Male", isF=p=>p&&p.gender==="Female";
const G=(p,m,f)=>isM(p)?m:isF(p)?f:`${m}/${f}`;
const older=(a,b)=>a&&b&&a.dob&&b.dob?(a.dob<b.dob):null;
function kinTerm(path,A,B){
  const code=path.map(s=>s.t).join(""), s1=path[0]&&path[0].to, s2=path[1]&&path[1].to, s3=path[2]&&path[2].to;
  const side=isM(s1)?"f":isF(s1)?"m":"?";
  switch(code){
    case "P": return G(A,"Pita","Mata");
    case "C": return G(A,"Beta","Beti");
    case "S": return G(A,"Pati","Patni");
    case "SC": return G(A,"Beta","Beti");
    case "PS": return G(A,"Pita","Mata");
    case "PC": { const o=older(A,B); if(isF(A)) return o===null?"Behen":o?"Badi Behen":"Chhoti Behen"; if(isM(A)) return o===null?"Bhai":o?"Bade Bhai":"Chhote Bhai"; return "Bhai/Behen"; }
    case "PP": return side==="f"?G(A,"Dada","Dadi"):side==="m"?G(A,"Nana","Nani"):G(A,"Dada/Nana","Dadi/Nani");
    case "PPP": return side==="m"?G(A,"Parnana","Parnani"):G(A,"Pardada","Pardadi");
    case "CC": return isM(s1)?G(A,"Pota","Poti"):isF(s1)?G(A,"Naati","Naatin"):G(A,"Pota/Naati","Poti/Naatin");
    case "CCC": return G(A,"Parpota","Parpoti");
    case "PPC": if(side==="f"){ if(isF(A)) return "Bua"; const o=older(A,s1); return o===null?"Chacha/Taau":o?"Taau":"Chacha"; }
      if(side==="m") return G(A,"Mama","Mausi"); return G(A,"Chacha/Mama","Bua/Mausi");
    case "PPCS": if(side==="f") return isM(s3)?(older(s3,s1)?"Taai":"Chachi"):"Phupha (Fufa)"; if(side==="m") return isM(s3)?"Mami":"Mausa"; return "Rishtedaar";
    case "PPCCC": { const s4=path[3]&&path[3].to; const kind=side==="f"?(isM(s3)?"chachere":"phuphere"):side==="m"?(isM(s3)?"mamere":"mausere"):"cousin";
      const kindF=kind.replace(/e$/,"i"); const via=isM(s4)?`${kind} bhai`:isF(s4)?`${kindF} behen`:`${kind} bhai/behen`;
      const t=isM(s4)?G(A,"Bhatija","Bhatiji"):isF(s4)?G(A,"Bhanja","Bhanji"):G(A,"Bhatija/Bhanja","Bhatiji/Bhanji");
      return `${t} (${via} ${G(A,"ka beta","ki beti")})`; }
    case "PPPCC": { const s4=path[3]&&path[3].to; const fs=isM(s1)?"pitaji":isF(s1)?"mummy":"mata-pita";
      const t=isM(s1)?(isF(A)?"Bua":"Chacha / Taau"):isF(s1)?G(A,"Mama","Mausi"):G(A,"Chacha/Mama","Bua/Mausi");
      return `${t} (${fs} ${isF(A)?"ki cousin behen":"ke cousin bhai"})`; }
    case "PPCCS": return G(A,"Cousin ke pati (Jija)","Cousin ki patni (Bhabhi)");
    case "PPCC": { const kind=side==="f"?(isM(s3)?"Chachera":"Phuphera"):side==="m"?(isM(s3)?"Mamera":"Mausera"):"Cousin"; return `${kind} ${G(A,"Bhai","Behen")}`; }
    case "PCC": return isM(s2)?G(A,"Bhatija","Bhatiji"):isF(s2)?G(A,"Bhanja","Bhanji"):G(A,"Bhatija/Bhanja","Bhatiji/Bhanji");
    case "PCS": return isM(s2)?"Bhabhi":isF(s2)?"Jija":"Bhabhi/Jija";
    case "CS": return G(A,"Damaad","Bahu");
    case "SP": return G(A,"Sasur","Saas");
    case "SPP": return G(A,"Dada sasur","Dadi saas");
    case "SPC": if(isF(B)){ if(isF(A)) return "Nanad"; const o=older(A,s1); return o===null?"Devar/Jeth":o?"Jeth":"Devar"; }
      if(isM(B)) return G(A,"Saala","Saali"); return G(A,"Devar/Saala","Nanad/Saali");
    case "SPCS": if(isF(B)) return isM(s3)?(older(s3,s1)?"Jethani":"Devrani"):"Nandoi"; if(isM(B)) return isM(s3)?"Salhaj":"Saadhu"; return "Rishtedaar";
    case "CSP": return G(A,"Samdhi","Samdhan");
    case "PCSP": return "Bhai/Behen ke saas-sasur";
    case "SCS": return G(A,"Damaad","Bahu");
    case "SPPP": return G(A,"Pardada sasur","Pardadi saas");
    case "SPPC": { const s4=path[3]&&path[3].to; if(isM(s2)){ if(isF(A)) return "Bua saas"; const o=older(A,s2); return o===null?"Chacha sasur / Bade sasur":o?"Bade sasur (Taau sasur)":"Chacha sasur"; }
      if(isF(s2)) return G(A,"Mama sasur","Mausi saas"); return G(A,"Chacha/Mama sasur","Bua/Mausi saas"); }
    case "SPPCS": { const s4=path[3]&&path[3].to; if(isM(s2)) return isM(s4)?(older(s4,s2)?"Badi saas (Taai saas)":"Chachi saas"):"Fufa sasur";
      if(isF(s2)) return isM(s4)?"Mami saas":"Mausa sasur"; return "Rishtedaar (sasural)"; }
    case "PCCS": return isM(s2)?G(A,"Bhatiji-jamai","Bhatij-bahu"):isF(s2)?G(A,"Bhanji-jamai","Bhanj-bahu"):G(A,"Jamai","Bahu");
    case "PCCSP": return G(A,"Samdhi","Samdhan");
    case "CSPC": return G(A,"Samdhi ke bhai","Samdhi ki behen");
    case "SPS": return G(A,"Sasur","Saas");
    case "SPCC": return isF(B)?(isM(s2)?G(A,"Bhatija","Bhatiji"):G(A,"Bhanja","Bhanji")):(isM(s2)?G(A,"Bhatija (saale ka)","Bhatiji (saale ki)"):G(A,"Bhanja (saali ka)","Bhanji (saali ki)"));
    case "PPPC": { const o=older(A,s2), bc=(x,y)=>o===null?`${x} / ${y}`:o?x:y;
      if(side!=="m"){ if(isF(s2)) return G(A,"Dadiji ke bhai","Dadiji ki behen"); return isF(A)?"Bua Dadiji":bc("Bade Dadaji","Chhote Dadaji"); }
      if(isF(s2)) return G(A,"Naniji ke bhai","Naniji ki behen"); return isF(A)?"Naniji (Nanaji ki behen)":bc("Bade Nanaji","Chhote Nanaji"); }
    case "PPPCS": { const s4=path[3]&&path[3].to, o=older(s4,s2), bc=(x,y)=>o===null?`${x} / ${y}`:o?x:y;
      if(side!=="m"){ if(isF(s2)) return G(A,"Dadiji ki behen ke pati","Dadiji ke bhai ki patni"); return isM(s4)?bc("Badi Dadiji","Chhoti Dadiji"):"Fufa Dadaji"; }
      if(isF(s2)) return G(A,"Naniji ki behen ke pati","Naniji ke bhai ki patni"); return isM(s4)?bc("Badi Naniji","Chhoti Naniji"):"Nanaji ki behen ke pati"; }
    case "PPPPCC": { const gp=side==="m"?"Nanaji":"Dadaji", gm=side==="m"?"Naniji":"Dadiji";
      return isM(A)?`${gp} (${isF(s2)?gm:gp} ke cousin bhai)`:`${side==="m"?"Naniji":"Bua Dadiji"} (${isF(s2)?gm:gp} ki cousin behen)`; }
    case "PPPPCCS": { const s5=path[4]&&path[4].to, gp=side==="m"?"Nanaji":"Dadaji", gm=side==="m"?"Naniji":"Dadiji";
      return isF(A)?`${gm} (${isF(s2)?gm:gp} ke cousin bhai ki patni)`:`${gp} (${isF(s2)?gm:gp} ki cousin behen ke pati)`; }
    case "SPCCC": case "PCCC": { if(code==="SPCCC") return G(A,"Pota/Naati","Poti/Naatin"); const t=isM(s3)?G(A,"Pota","Poti"):isF(s3)?G(A,"Naati","Naatin"):G(A,"Pota/Naati","Poti/Naatin");
      return `${t} (${isM(s2)?"bhai":isF(s2)?"behen":"bhai/behen"} ${isM(s3)?"ke bete":isF(s3)?"ki beti":"ke bachche"} ${G(A,"ka beta","ki beti")})`; }
    case "PPCSP": return "Rishtedaar";
    case "CSC": return G(A,"Pota/Naati","Poti/Naatin");
    case "SCC": return G(A,"Pota/Naati","Poti/Naatin");
  }
  return null;
}
const PRETTY={"Pita":"Papa (Pita ji)","Mata":"Mummy (Mata ji)","Taau":"Bade Papa (Taau ji)","Taai":"Badi Mummy (Taai ji)","Chacha":"Chacha","Chachi":"Chachi","Bua":"Bua (Bhua ji)","Phupha (Fufa)":"Phupha (Fufa ji)","Chacha/Taau":"Chacha / Bade Papa","Dada":"Dada ji","Dadi":"Dadi ji","Nana":"Nana ji","Nani":"Nani ji","Mama":"Mama ji","Mami":"Mami ji","Mausi":"Mausi ji","Mausa":"Mausa ji"};
const pretty=t=>PRETTY[t]||t;
function relTo(other,me){ // what `other` is to `me`
  const p=findPath(me.id,other.id); if(!p) return null;
  const t=kinTerm(p,other,me); return {term:t?pretty(t):("Rishtedaar: "+me.name.split(" ")[0]+(isF(p[0]&&p[0].to)?" ki ":" ke ")+chainText(p)), len:p.length, exact:!!t};
}
function chainText(path){
  const w={P:p=>G(p,"pita","mata"),C:p=>G(p,"bete","beti"),S:p=>G(p,"pati","patni")};
  const n=path.length; return path.map((s,i)=>{ const last=i===n-1; let wd=w[s.t](s.to); if(last&&wd==="bete") wd="beta";
    return (i?(isF(s.to)?" ki ":last?" ka ":" ke "):"")+wd; }).join("");
}
function renderKinship(){
  const opts=members.slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join("");
  $("#moreBody").innerHTML=`<div class="sec"><div class="fgrid">
    <label class="f">${L("Ye vyakti…","ये व्यक्ति…")}<select id="kA"><option value="">—</option>${opts}</select></label>
    <label class="f">${L("…inke kya lagte hain?","…इनके क्या लगते हैं?")}<select id="kB"><option value="">—</option>${opts}</select></label></div>
    <div id="kRes" class="kres"></div></div>
    <div class="help">💡 ${L("Sahi jawab ke liye har member ke biodata mein gender, janam tarikh aur “Family Tree ke liye jodo” (pita / mata / pati-patni) bhara hona chahiye.","सही जवाब के लिए हर सदस्य के बायोडाटा में लिंग, जन्म तारीख और वंश वृक्ष के रिश्ते भरे होने चाहिए।")}</div>`;
  const go=()=>{ const A=byId($("#kA").value),B=byId($("#kB").value),r=$("#kRes"); if(!A||!B){r.innerHTML="";return}
    if(A.id===B.id){r.textContent="😄 Dono ek hi vyakti hain!";return}
    const p=findPath(B.id,A.id);
    if(!p){r.innerHTML=`${esc(A.name)} aur ${esc(B.name)} ka rishta app mein juda nahi hai. Family Tree ke rishte bharo.`;return}
    const t=kinTerm(p,A,B);
    r.innerHTML=t?`<b>${esc(A.name)}</b>, <b>${esc(B.name)}</b> ${A.gender==="Female"?"ki":"ke"} <span class="kterm">${esc(t)}</span> ${A.gender==="Female"?"lagti hain":"lagte hain"}.<div class="sub" style="font-size:13px;margin-top:4px">(${esc(B.name)} ${isF(p[0]&&p[0].to)?"ki":"ke"} ${esc(chainText(p))})</div>`
      :`<b>${esc(A.name)}</b>, <b>${esc(B.name)}</b> ${isF(p[0]&&p[0].to)?"ki":"ke"} <span class="kterm">${esc(chainText(p))}</span> hain.`;
  };
  $("#kA").onchange=go; $("#kB").onchange=go;
}

/* ---- Recipes & stories (simple shared lists) ---- */
const CRUD={
  recipes:{title:"Recipe",fields:[["title","Recipe ka naam",0,1],["byMember","Kiski recipe (member)","member"],["byText","Ya naam likho (jaise Nani ji)"],["category","Kis tarah ki",["","Mithai","Sabzi","Daal","Roti/Paratha","Nashta","Achaar","Tyohar special","Aur"]],["ingredients","Saamagri",1],["method","Banane ki vidhi",1],["tips","Khaas tips",1]],photo:true,icon:"🍲"},
  stories:{title:"Kahani",fields:[["title","Shirshak (title)",0,1],["about","Kiske baare mein","member"],["teller","Kisne sunayi / likhi","member"],["year","Kab ki baat (saal / daur)"],["text","Kahani / kissa",1]],photo:true,icon:"📖"},
};
let crudData={recipes:[],stories:[]};
function crudName(it,k){ const m=byId(it[k]); return m?m.name:""; }
function renderCrud(col){
  const C=CRUD[col]; const q=($("#crudQ")&&$("#crudQ").value)||"";
  const list=crudData[col].filter(x=>!q||JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>(a.title||"").localeCompare(b.title||""));
  $("#moreBody").innerHTML=`<div class="footer-actions" style="margin:0 0 8px">${canWriteShared()?`<button class="btn" id="crudAdd">+ ${L("Nayi "+C.title.toLowerCase()+" jodo","नई जोड़ें")}</button>`:""}</div>
    ${crudData[col].length>4?`<input class="search" id="crudQ" placeholder="${L("Dhoondo…","खोजें…")}" value="${esc(q)}">`:""}
    ${list.length?list.map(x=>`<button class="evcard" data-id="${esc(x.id)}"><div class="evd" style="font-size:26px">${okImg(x.photo)?`<img src="${esc(x.photo)}" alt="" class="thumb">`:C.icon}</div><div class="who"><b>${esc(x.title)}</b><span>${esc([x.category,crudName(x,"byMember")||x.byText,crudName(x,"about"),x.year].filter(Boolean).join(" · "))}</span></div><span class="chev">›</span></button>`).join("")
      :`<div class="empty">${L("Abhi kuch nahi. Pehli "+C.title.toLowerCase()+" aap jodo!","अभी कुछ नहीं।")}</div>`}`;
  const a=$("#crudAdd"); if(a) a.onclick=()=>crudForm(col);
  const qi=$("#crudQ"); if(qi) qi.oninput=()=>{const pos=qi.selectionStart;renderCrud(col);const n=$("#crudQ");n.focus();n.setSelectionRange(pos,pos)};
  $("#moreBody").querySelectorAll(".evcard").forEach(b=>b.onclick=()=>crudView(col,b.dataset.id));
}
function crudView(col,id){
  const C=CRUD[col], x=crudData[col].find(i=>i.id===id); if(!x) return;
  const rows=C.fields.filter(([k])=>k!=="title"&&x[k]).map(([k,l,t])=>`<dt>${esc(l)}</dt><dd>${esc(t==="member"?crudName(x,k):x[k])}</dd>`).join("");
  openSheet(`<div class="sheet-head"><h2>${C.icon} ${esc(x.title)}</h2><button class="x" id="cls">×</button></div>
    ${okImg(x.photo)?`<img src="${esc(x.photo)}" alt="" style="width:100%;border-radius:14px;margin-bottom:10px">`:""}
    <div class="sec"><dl class="kv kv1">${rows}</dl></div>
    <div class="footer-actions"><button class="btn plain" id="cCopy">📋 Copy</button>${(isAdmin||x.createdBy===uid)&&canWriteShared()?`<button class="btn danger" id="cDel">Delete</button><button class="btn" id="cEdit">✏️ Edit</button>`:""}</div>`);
  $("#cls").onclick=closeSheet;
  $("#cCopy").onclick=async()=>{try{await navigator.clipboard.writeText(`${C.icon} ${x.title}\n\n`+C.fields.filter(([k])=>k!=="title"&&x[k]).map(([k,l,t])=>`${l}: ${t==="member"?crudName(x,k):x[k]}`).join("\n\n"));toast("Copy ho gaya ✓")}catch(e){toast("Copy nahi hua")}};
  const e=$("#cEdit"); if(e) e.onclick=()=>crudForm(col,id);
  const d=$("#cDel"); if(d) d.onclick=async()=>{ if(d.dataset.sure!=="1"){d.dataset.sure="1";d.textContent=L("Pakka delete?","पक्का हटाएँ?");return}
    try{await db.collection(col).doc(id).delete();closeSheet();toast("Delete ho gaya")}catch(err){toast("Nahi hua")} };
}
function crudForm(col,id){
  const C=CRUD[col], x=id?crudData[col].find(i=>i.id===id)||{}:{}; let photo=x.photo||"";
  const mopts=v=>`<option value="">—</option>`+members.slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(m=>`<option value="${esc(m.id)}" ${m.id===v?"selected":""}>${esc(m.name)}</option>`).join("");
  openSheet(`<div class="sheet-head"><h2>${id?"Edit":L("Naya","नया")} – ${C.title}</h2><button class="x" id="cls">×</button></div>
    <form id="crudForm"><div class="sec"><div class="fgrid">${C.fields.map(([k,l,t,req])=>{
      if(t==="member") return `<label class="f">${esc(l)}<select name="${k}">${mopts(x[k])}</select></label>`;
      if(Array.isArray(t)) return `<label class="f">${esc(l)}<select name="${k}">${t.map(o=>`<option ${o===x[k]?"selected":""}>${esc(o)}</option>`).join("")}</select></label>`;
      if(t===1) return `<label class="f full">${esc(l)}<textarea name="${k}" maxlength="8000" style="min-height:120px">${esc(x[k]||"")}</textarea></label>`;
      return `<label class="f${req?" full":""}">${esc(l)}${req?' <span class="req">*</span>':""}<input name="${k}" maxlength="150" value="${esc(x[k]||"")}"></label>`;}).join("")}</div>
      ${C.photo?`<div class="photo-row" style="margin-top:10px"><div id="cPrev">${photo?`<img src="${esc(photo)}" class="thumb big">`:""}</div><label class="btn plain" style="cursor:pointer">📷 Photo<input type="file" accept="image/*" id="cPh" hidden></label></div>`:""}</div>
    <div class="footer-actions"><button type="button" class="btn plain" id="cCancel">Cancel</button><button class="btn" id="cSave">💾 Save karo</button></div></form>`);
  $("#cls").onclick=closeSheet; $("#cCancel").onclick=()=>id?crudView(col,id):closeSheet();
  const ph=$("#cPh"); if(ph) ph.onchange=async e=>{try{photo=await shrinkPhoto(e.target.files[0],800,90000);$("#cPrev").innerHTML=`<img src="${esc(photo)}" class="thumb big">`}catch(err){toast("Photo nahi lagi")}};
  $("#crudForm").onsubmit=async e=>{e.preventDefault(); const fd=new FormData(e.target); const data={};
    C.fields.forEach(([k])=>data[k]=String(fd.get(k)||"").trim()); if(!data.title){toast("Naam / title likho");return}
    data.photo=photo; data.createdBy=x.createdBy||uid; data.updatedAt=Date.now();
    const did=id||(col[0]+"_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5));
    $("#cSave").disabled=true;
    try{ await db.collection(col).doc(did).set(data); const i=crudData[col].findIndex(q=>q.id===did); const rec={id:did,...data}; if(i>=0)crudData[col][i]=rec; else crudData[col].push(rec);
      toast("Save ho gaya ✓"); crudView(col,did); if(moreView===col) renderCrud(col); }catch(err){toast("Save nahi hua");$("#cSave").disabled=false}};
}

/* ---- Shaadi-rishte ---- */
function renderShaadi(){
  const list=members.filter(m=>!isGone(m)&&m.marital!=="Married"&&m.marital!=="Widowed"&&((age(m.dob)||0)>=18||m.pref||m.manglik)).sort((a,b)=>(a.dob||"").localeCompare(b.dob||""));
  $("#moreBody").innerHTML=`<div class="help">${L("Jinka vaivahik sthiti “Unmarried” hai aur umar 18+ hai, woh yahan dikhte hain. Biodata ka PDF ya photo seedha rishte wale parivar ko bhej sakte ho.","")}</div>`+
    (list.length?list.map(m=>`<div class="sec"><div class="profile-top" style="margin:0">${avatar(m)}<div style="flex:1"><div class="mname">${esc(m.name)}</div>
      <div class="mrel">${[age(m.dob)!==null?age(m.dob)+" saal":"",m.height,m.education&&m.education.split("\n")[0],m.occupation,m.city].filter(Boolean).map(esc).join(" · ")}</div>
      <div class="mrel">${[m.gotra&&"Gotra: "+m.gotra,m.rashi&&"Rashi: "+m.rashi,m.manglik&&"Manglik: "+m.manglik].filter(Boolean).map(esc).join(" · ")}</div>
      ${m.pref?`<div class="mrel">💭 ${esc(m.pref)}</div>`:""}</div></div>
      <div class="footer-actions"><button class="btn plain sm" data-v="${esc(m.id)}">Biodata</button>${downloads?`<button class="btn plain sm" data-png="${esc(m.id)}">🖼️ Photo</button><button class="btn sm" data-pdf="${esc(m.id)}">📄 PDF</button>`:""}</div></div>`).join("")
      :`<div class="empty">${L("Abhi koi nahi.","अभी कोई नहीं।")}</div>`);
  $("#moreBody").querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>openView(b.dataset.v));
  $("#moreBody").querySelectorAll("[data-png]").forEach(b=>b.onclick=()=>exportBiodata(byId(b.dataset.png),"png"));
  $("#moreBody").querySelectorAll("[data-pdf]").forEach(b=>b.onclick=()=>exportBiodata(byId(b.dataset.pdf),"pdf"));
}
function renderEmergencyInto(){ $("#moreBody").innerHTML='<div id="emergency"></div>'; renderEmergency(); }

/* ---- Settings ---- */
function renderSettings(){
  $("#moreBody").innerHTML=`<div class="sec"><h4>🌐 ${L("Bhasha","भाषा")}</h4><div class="actions">
      <button class="btn ${LANG==="hn"?"":"plain"}" data-lang="hn">Hinglish</button><button class="btn ${LANG==="hi"?"":"plain"}" data-lang="hi">हिंदी</button></div>
      <p class="sub" style="font-size:13px">${L("Ye sirf aapke phone pe badlega.","यह सिर्फ आपके फ़ोन पर बदलेगा।")}</p></div>
    <div class="sec"><h4>📱 ${L("Home screen pe app ka icon","होम स्क्रीन पर ऐप आइकन")}</h4>
      <p style="margin:0 0 6px"><b>Android (Chrome):</b> ${L("ye app Chrome mein kholo → upar ⋮ menu → <b>“Add to Home screen”</b> → Add.","यह ऐप Chrome में खोलें → ऊपर ⋮ मेनू → <b>“Add to Home screen”</b>।")}</p>
      <p style="margin:0"><b>iPhone (Safari):</b> ${L("Safari mein kholo → neeche Share ⬆️ → <b>“Add to Home Screen”</b>.","Safari में खोलें → नीचे Share ⬆️ → <b>“Add to Home Screen”</b>।")}</p>
      ${window._installEvt?`<button class="btn" id="installBtn" style="margin-top:6px">📲 ${L("Abhi install karo","अभी इंस्टॉल करें")}</button>`:""}</div>
    <div class="sec"><h4>👤 ${L("Login","लॉगिन")}</h4><p style="margin:0 0 8px">${esc((user&&user.key)||"")}${isAdmin?" · Admin":""}</p><button class="btn plain" id="logoutBtn">${L("Logout","लॉगआउट")}</button></div>
    <div class="sec"><h4>ℹ️ ${L("Tithi ke baare mein","तिथि के बारे में")}</h4><p class="sub" style="margin:0;font-size:14px">${L("Tithi, tyohar aur vrat ki dates app khud ganit se nikalta hai (North India Purnimanta, Vikram Samvat). Kabhi-kabhi panchang se 1 din ka fark ho sakta hai – zaroori puja ke liye pandit ji se mila lena.","तिथि, त्योहार और व्रत की तारीखें ऐप स्वयं गणना से निकालता है। कभी-कभी पंचांग से 1 दिन का अंतर हो सकता है।")}</p></div>`;
  const ib=$("#installBtn"); if(ib) ib.onclick=async()=>{ const ev=window._installEvt; if(!ev) return; ev.prompt(); try{ await ev.userChoice; }catch(e){} window._installEvt=null; renderSettings(); };
  $("#logoutBtn").onclick=()=>{ try{ localStorage.removeItem("gp_cache_v1"); }catch(e){} user&&user.signOut&&user.signOut(); };
  $("#moreBody").querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>{LANG=b.dataset.lang;try{localStorage.setItem("parivar_lang",LANG)}catch(e){}applyLangStatic();renderAll();});
}

/* ======================= Event RSVP & kharcha ======================= */
async function loadWhere(col,eid){ try{ return docsFrom(await db.collection(col).where("eventId","==",eid).get()); }catch(e){ return []; } }
async function renderEventExtras(eid){
  const box=$("#evExtras"); if(!box) return;
  const e=events.find(x=>x.id===eid)||{}; const upcomingEv=e.date&&e.date>=isoOf(new Date());
  const [rs,ex]=await Promise.all([loadWhere("rsvp",eid),loadWhere("expenses",eid)]);
  if(!$("#evExtras")||current!=="ev:"+eid) return;
  const nm=id=>(byId(id)||{}).name||"?";
  const yes=rs.filter(r=>r.status==="Haan"), may=rs.filter(r=>r.status==="Shayad"), no=rs.filter(r=>r.status==="Nahi");
  const heads=yes.reduce((s,r)=>s+(+r.people||1),0);
  const me=members.find(m=>m.id===uid);
  const mopts=v=>members.filter(m=>!isGone(m)).sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(m=>`<option value="${esc(m.id)}" ${m.id===v?"selected":""}>${esc(m.name)}</option>`).join("");
  // expenses
  const total=ex.reduce((s,x)=>s+(+x.amount||0),0);
  const paid={}; ex.forEach(x=>paid[x.paidBy]=(paid[x.paidBy]||0)+(+x.amount||0));
  const parts=[...new Set([...yes.map(r=>r.member),...Object.keys(paid)])].filter(id=>byId(id));
  const share=parts.length?total/parts.length:0;
  const bal=parts.map(id=>({id,b:(paid[id]||0)-share}));
  const debt=bal.filter(x=>x.b<-0.5).map(x=>({...x})), cred=bal.filter(x=>x.b>0.5).map(x=>({...x})), settle=[];
  debt.sort((a,b)=>a.b-b.b); cred.sort((a,b)=>b.b-a.b);
  let i=0,j=0; while(i<debt.length&&j<cred.length){ const amt=Math.min(-debt[i].b,cred[j].b); settle.push(`${nm(debt[i].id)} → ${nm(cred[j].id)}: ₹${Math.round(amt).toLocaleString("en-IN")}`); debt[i].b+=amt; cred[j].b-=amt; if(debt[i].b>-0.5)i++; if(cred[j].b<0.5)j++; }
  const W=canWriteShared();
  box.innerHTML=`
    ${upcomingEv||rs.length?`<div class="sec"><h4>🙋 ${L("Kaun aa raha hai","कौन आ रहा है")}</h4>
      <div class="rsum"><b>${heads}</b> ${L("log aa rahe hain","लोग आ रहे हैं")}${may.length?` · ${may.length} shayad`:""}${no.length?` · ${no.length} nahi`:""}</div>
      ${rs.length?`<ul class="rlist">${[...yes,...may,...no].map(r=>`<li><b>${esc(nm(r.member))}</b> – ${r.status==="Haan"?"✅":r.status==="Shayad"?"🤔":"❌"} ${esc(r.status)}${r.status==="Haan"&&+r.people>1?` (${+r.people} log)`:""}${r.bring?` · 🍱 ${esc(r.bring)}`:""}</li>`).join("")}</ul>`:""}
      ${W&&upcomingEv?`<div class="fgrid" style="margin-top:8px"><label class="f">${L("Kiski taraf se","किसकी ओर से")}<select id="rMem">${mopts(me?uid:"")}</select></label>
        <label class="f">${L("Kitne log","कितने लोग")}<input id="rPpl" type="number" min="1" max="50" value="1"></label>
        <label class="f full">${L("Kya laaoge (khaana / saamaan)","क्या लाएँगे")}<input id="rBring" maxlength="100" placeholder="jaise Gulab jamun, 2 kg"></label></div>
        <div class="footer-actions"><button class="btn plain" data-rs="Nahi">❌ Nahi</button><button class="btn plain" data-rs="Shayad">🤔 Shayad</button><button class="btn" data-rs="Haan">✅ Haan, aa rahe</button></div>`:""}</div>`:""}
    <div class="sec"><h4>💰 ${L("Kharcha hisaab","खर्च हिसाब")}</h4>
      ${ex.length?`<ul class="rlist">${ex.sort((a,b)=>(a.at||0)-(b.at||0)).map(x=>`<li><b>₹${(+x.amount).toLocaleString("en-IN")}</b> – ${esc(nm(x.paidBy))}${x.note?` · ${esc(x.note)}`:""}${(isAdmin||x.createdBy===uid)&&W?` <button class="linkbtn" data-xdel="${esc(x.id)}">hatao</button>`:""}</li>`).join("")}</ul>
        <div class="rsum">Kul: <b>₹${Math.round(total).toLocaleString("en-IN")}</b>${parts.length?` · ${parts.length} logon mein barabar: <b>₹${Math.round(share).toLocaleString("en-IN")}</b> har ek`:""}</div>
        ${settle.length?`<div class="settle"><b>${L("Hisaab barabar karne ke liye:","हिसाब बराबर करने के लिए:")}</b><br>${settle.map(esc).join("<br>")}</div>`:""}
        <p class="sub" style="font-size:12px;margin:6px 0 0">Barabar hissa un sabka jo “Haan” bole ya jinhone kharcha kiya.</p>`:`<p class="sub" style="margin:0 0 6px">${L("Abhi koi kharcha nahi joda.","अभी कोई खर्च नहीं।")}</p>`}
      ${W?`<div class="fgrid" style="margin-top:8px"><label class="f">${L("Kisne diya","किसने दिया")}<select id="xBy">${mopts(me?uid:"")}</select></label>
        <label class="f">₹ ${L("Rakam","राशि")}<input id="xAmt" type="number" min="1" inputmode="numeric"></label>
        <label class="f full">${L("Kis cheez ka","किस चीज़ का")}<input id="xNote" maxlength="100" placeholder="jaise Halwai, tent, mithai"></label></div>
        <div class="footer-actions"><button class="btn" id="xAdd">+ ${L("Kharcha jodo","खर्च जोड़ें")}</button></div>`:""}</div>`;
  box.querySelectorAll("[data-rs]").forEach(b=>b.onclick=async()=>{ const mem=$("#rMem").value; if(!mem){toast("Member chuno");return}
    try{ await db.collection("rsvp").doc(eid+"__"+mem).set({eventId:eid,member:mem,status:b.dataset.rs,people:Math.max(1,+$("#rPpl").value||1),bring:$("#rBring").value.trim(),by:uid,at:Date.now()}); toast("Jawab save ✓"); renderEventExtras(eid);}catch(x){toast("Save nahi hua")} });
  const xa=$("#xAdd"); if(xa) xa.onclick=async()=>{ const amt=+$("#xAmt").value, by=$("#xBy").value; if(!by||!(amt>0)){toast("Kisne diya aur rakam bharo");return}
    try{ await db.collection("expenses").doc("x_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5)).set({eventId:eid,paidBy:by,amount:amt,note:$("#xNote").value.trim(),createdBy:uid,at:Date.now()}); toast("Jud gaya ✓"); renderEventExtras(eid);}catch(x){toast("Save nahi hua")} };
  box.querySelectorAll("[data-xdel]").forEach(b=>b.onclick=async()=>{try{await db.collection("expenses").doc(b.dataset.xdel).delete();renderEventExtras(eid)}catch(x){toast("Nahi hua")}});
}

/* ======================= Admin: family access & import ======================= */
function normKey(v){ v=String(v||"").trim(); if(v.includes("@")) return v.toLowerCase(); let d=v.replace(/[^\d+]/g,""); if(d.startsWith("+")) return d; d=d.replace(/^0+/,""); if(d.length===10) return "+91"+d; if(d.length===12&&d.startsWith("91")) return "+"+d; return ""; }
async function renderAccess(){
  $("#moreBody").innerHTML=`<div class="help">Sirf yahan jode gaye mobile number (ya Gmail) wale log app khol payenge. Admin numbers <b>config.js</b> mein hain.</div>
    <div class="sec"><div class="fgrid">
      <label class="f">Mobile number ya Gmail<input id="acKey" type="text" inputmode="email" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="98XXXXXXXX ya naam@gmail.com"></label>
      <label class="f">Naam<input id="acName" maxlength="60"></label>
      <label class="f full">Inka biodata (agar pehle se bana hai)<select id="acMem"><option value="">— apne aap mobile se milao —</option>${members.slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join("")}</select></label></div>
      <div class="footer-actions"><button class="btn" id="acAdd">+ Family mein jodo</button></div></div>
    <div id="acList"><p class="sub">Load ho raha hai…</p></div>`;
  const load=async()=>{ let rows=[]; try{ rows=docsFrom(await db.collection("allowed").get()); }catch(e){ $("#acList").innerHTML='<p class="sub">List nahi khuli – rules check karo.</p>'; return; }
    $("#acList").innerHTML=rows.length?`<div class="sec"><h4>${rows.length} log jude hain</h4>${rows.sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(r=>`<div class="relrow" style="cursor:default"><span class="rn">${esc(r.name||"")}<br><small class="sub">${esc(r.id)}${r.memberId&&byId(r.memberId)?" · "+esc(byId(r.memberId).name):""}</small></span><button class="linkbtn" data-acdel="${esc(r.id)}">Hatao</button></div>`).join("")}</div>`:'<div class="empty">Abhi koi nahi joda.</div>';
    $("#acList").querySelectorAll("[data-acdel]").forEach(b=>b.onclick=async()=>{ if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Pakka?";return} try{ await db.collection("allowed").doc(b.dataset.acdel).delete(); load(); }catch(e){toast("Nahi hua")} }); };
  $("#acAdd").onclick=async()=>{ const key=normKey($("#acKey").value); if(!key){toast("Sahi 10 ank ka number ya Gmail daalo");return}
    let mid=$("#acMem").value; if(!mid){ const m=members.find(x=>normKey(x.mobile)===key||normKey(x.whatsapp)===key||(x.email||"").toLowerCase()===key); if(m) mid=m.id; }
    const nm=$("#acName").value.trim()||(byId(mid)||{}).name||"";
    try{ await db.collection("allowed").doc(key).set({name:nm,memberId:mid||"",addedAt:Date.now(),addedBy:uid});
      if(mid){ try{ await db.collection("members").doc(mid).update(key.includes("@")?{ownerEmail:key}:{ownerKey:key}); }catch(e){} }
      toast(`${nm||key} jud gaye ✓`+(mid?" (biodata bhi link)":"")); $("#acKey").value="";$("#acName").value=""; load(); }catch(e){ console.error(e); toast("Nahi jud paaya – kya aap admin ho?"); } };
  load();
}
function renderImport(){
  $("#moreBody").innerHTML=`<div class="help">Purane (claude.ai wale) app ka data <b>purana-data.json</b> file se yahan laao. Ek hi baar karna hai.</div>
    <div class="sec"><label class="btn" style="cursor:pointer">📂 File chuno<input type="file" accept=".json,application/json" id="impFile" hidden></label><div id="impMsg" class="sub" style="margin-top:10px"></div></div>`;
  $("#impFile").onchange=async e=>{ const f=e.target.files[0]; if(!f) return; let j; try{ j=JSON.parse(await f.text()); }catch(err){ $("#impMsg").textContent="File sahi nahi hai."; return; }
    let n=0; const cols=j.collections||{members:j.members||j};
    for(const [col,list] of Object.entries(cols)){ if(!Array.isArray(list)) continue;
      for(const d of list){ if(!d||!d.id||!d.data) continue; const data={...d.data};
        if(col==="members"&&!data.ownerKey){ const k=normKey(data.mobile); if(k) data.ownerKey=k; }
        try{ await db.collection(col).doc(d.id).set(data); n++; $("#impMsg").textContent=`${n} record aa gaye…`; }catch(err){ console.error(err); } } }
    $("#impMsg").textContent=`✓ ${n} record naye app mein aa gaye.`; };
}
