/* Gulecha Parivar – Firebase connection (login + database + share/download).
   Exposes window.claude.use("db" | "user" | "downloads") so the app code stays the same. */
(function(){
  const V="10.12.2", BASE=`https://www.gstatic.com/firebasejs/${V}/`;
  const ADMINS=(window.ADMINS||[]).map(s=>String(s).trim().toLowerCase());
  let ready=null;

  /* ---------- login screen ---------- */
  function shell(html){
    let el=document.getElementById("authScreen");
    if(!el){ el=document.createElement("div"); el.id="authScreen"; document.body.appendChild(el); }
    el.innerHTML=`<div class="auth-card"><div class="auth-logo">${window.LOGO_SVG_RAW||""}</div>
      <h1 class="auth-title">Gulecha <span>Parivar</span></h1><p class="auth-sub">गुलेच्छा परिवार का अपना ऐप</p><div class="auth-kd">॥ जय सच्चियाय माता ॥</div>${html}</div>`;
    el.style.display="flex"; return el;
  }
  function hideShell(){ const el=document.getElementById("authScreen"); if(el) el.style.display="none"; }
  const normPhone=v=>{ let d=String(v||"").replace(/[^\d+]/g,""); if(d.startsWith("+")) return d; d=d.replace(/^0+/,""); if(d.length===10) return "+91"+d; if(d.length===12&&d.startsWith("91")) return "+"+d; return ""; };

  function loginUI(A,auth){
    return new Promise(resolve=>{
      let verifier=null;
      const emailStep=()=>{
        const join=/[?&]join/.test(location.search);
        const el=shell(`${join?`<p class="auth-msg" style="color:#2b2220;background:#fff4e0;border-radius:10px;padding:10px">🙏 <b>Parivar se judiye!</b><br>Apna email likho, <b>apna khud ka password</b> chuno (6+ akshar) aur <b>“Naya account banao”</b> dabao. Phir apna biodata bharo – admin ki manzoori ke baad poora app khul jayega.</p>`:""}<div class="auth-tabs"><button class="on">✉️ Email</button><button id="tOtp">📱 Mobile OTP</button></div>
          <label class="auth-l">Email</label>
          <input id="eMail" class="auth-in" type="email" autocomplete="email" placeholder="aapka@gmail.com">
          <label class="auth-l">Password <small>(kam se kam 6 akshar)</small></label>
          <input id="ePass" class="auth-in" type="password" autocomplete="current-password" placeholder="••••••">
          <button class="auth-btn" id="eLogin">Login karo</button>
          <button class="auth-btn ghost" id="eNew">Pehli baar? Naya account banao</button>
          <div id="aMsg" class="auth-msg"></div>
          <button class="auth-link" id="eForgot">Password bhool gaye?</button>
          <button class="auth-link" id="aGoogle">ya Google (Gmail) se login karo</button>`);
        const msg=(t,ok)=>{const m=el.querySelector("#aMsg");m.textContent=t;m.style.color=ok?"#2f7d5b":"";};
        const val=()=>[el.querySelector("#eMail").value.trim().toLowerCase(),el.querySelector("#ePass").value];
        const err=e=>{const c=e.code||"";return /invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)?"Email ya password galat hai. Pehli baar ho to 'Naya account banao' dabao.":/email-already-in-use/.test(c)?"Is email ka account pehle se hai – 'Login karo' dabao (ya Google se login karo).":/weak-password/.test(c)?"Password kam se kam 6 akshar ka rakho.":/invalid-email/.test(c)?"Email sahi likho.":/too-many/.test(c)?"Bahut baar koshish hui – thodi der baad try karo.":/operation-not-allowed/.test(c)?"Email login Firebase mein band hai.":"Nahi hua: "+(c||e.message);};
        el.querySelector("#tOtp").onclick=step1;
        el.querySelector("#eLogin").onclick=async()=>{const [e,p]=val(); if(!e||!p){msg("Email aur password dono daalo");return}
          msg("Login ho raha hai…",true); try{ await A.signInWithEmailAndPassword(auth,e,p); }catch(x){ msg(err(x)); } };
        el.querySelector("#eNew").onclick=async()=>{const [e,p]=val(); if(!e||p.length<6){msg("Email daalo aur 6+ akshar ka password chuno");return}
          msg("Account ban raha hai…",true); try{ const c=await A.createUserWithEmailAndPassword(auth,e,p); try{ await A.sendEmailVerification(c.user); }catch(_){} }catch(x){ msg(err(x)); } };
        el.querySelector("#eForgot").onclick=async()=>{const [e]=val(); if(!e){msg("Upar email likho, phir ye dabao");return}
          try{ await A.sendPasswordResetEmail(auth,e); msg("Password badalne ka link "+e+" pe bhej diya ✓ (Spam folder bhi dekhna)",true); }catch(x){ msg(err(x)); } };
        el.querySelector("#aGoogle").onclick=async()=>{ msg(""); try{ await A.signInWithPopup(auth,new A.GoogleAuthProvider()); }catch(e){ msg(/operation-not-allowed/.test(e.code)?"Google login abhi band hai.":"Google login nahi hua: "+(e.code||e.message)); } };
      };
      const step1=()=>{
        const el=shell(`<div class="auth-tabs"><button id="tEmail">✉️ Email</button><button class="on">📱 Mobile OTP</button></div><label class="auth-l">Apna mobile number</label>
          <div class="auth-phone"><span>+91</span><input id="aPhone" type="tel" inputmode="numeric" maxlength="10" placeholder="98XXXXXXXX" autocomplete="tel-national"></div>
          <div id="recap" style="display:flex;justify-content:center;margin:4px 0 12px;min-height:78px"></div>
          <button class="auth-btn" id="aSend">OTP bhejo</button>
          <div id="aMsg" class="auth-msg"></div>
          <button class="auth-link" id="aGoogle">ya Google (Gmail) se login karo</button>`);
        const msg=t=>{el.querySelector("#aMsg").textContent=t};
        const makeVerifier=()=>{ try{ if(verifier){ verifier.clear(); } }catch(e){}
          el.querySelector("#recap").innerHTML="";
          try{ verifier=new A.RecaptchaVerifier(auth,"recap",{size:"normal",callback:()=>msg(""),"expired-callback":()=>msg("Robot-check dobara karo")}); verifier.render().catch(e=>msg("Robot-check load nahi hua: "+(e.code||e.message))); }
          catch(e){ console.error(e); msg("Robot-check load nahi hua: "+(e.code||e.message)); } };
        el.querySelector("#tEmail").onclick=()=>{ try{ if(verifier) verifier.clear(); }catch(e){} verifier=null; emailStep(); };
        makeVerifier();
        el.querySelector("#aSend").onclick=async()=>{
          msg("");
          const ph=normPhone(el.querySelector("#aPhone").value);
          if(!ph){ msg("10 digit ka mobile number daalo"); return; }
          const b=el.querySelector("#aSend"); b.disabled=true; b.textContent="Bhej rahe hain…";
          const t=setTimeout(()=>{ msg("Thoda samay lag raha hai… upar 'I'm not a robot' tick karo, phir dobara OTP bhejo."); b.disabled=false; b.textContent="OTP bhejo"; },20000);
          try{ const conf=await A.signInWithPhoneNumber(auth,ph,verifier); clearTimeout(t); step2(ph,conf); }
          catch(e){ clearTimeout(t); console.error(e); b.disabled=false; b.textContent="OTP bhejo";
            msg(/too-many/.test(e.code)?"Bahut baar koshish hui – thodi der baad try karo.":/invalid-phone/.test(e.code)?"Number sahi nahi lag raha.":/quota|billing/.test(e.code)?"Aaj ke OTP khatam (10/din). Kal try karo.":/captcha|recaptcha/.test(e.code||"")?"Robot-check poora nahi hua – 'I'm not a robot' tick karke dobara dabao.":/unauthorized-domain|app-not-authorized/.test(e.code||"")?"Ye website Firebase mein allow nahi hai (Authorized domains).":"OTP nahi gaya: "+(e.code||e.message));
            makeVerifier(); }
        };
        el.querySelector("#aGoogle").onclick=async()=>{ msg(""); try{ await A.signInWithPopup(auth,new A.GoogleAuthProvider()); }catch(e){ msg(/operation-not-allowed/.test(e.code)?"Google login abhi band hai – OTP se login karo.":"Google login nahi hua: "+(e.code||e.message)); } };
      };
      const step2=(ph,conf)=>{
        const el=shell(`<p class="auth-l">${ph} pe 6 ank ka OTP bheja gaya hai</p>
          <input id="aOtp" class="auth-otp" type="tel" inputmode="numeric" maxlength="6" placeholder="• • • • • •" autocomplete="one-time-code">
          <button class="auth-btn" id="aVerify">Login karo</button><div id="aMsg" class="auth-msg"></div>
          <button class="auth-link" id="aBack">Number badlo</button>`);
        const go=async()=>{ const code=el.querySelector("#aOtp").value.trim(); if(code.length<6) return;
          el.querySelector("#aVerify").disabled=true;
          try{ await conf.confirm(code); }catch(e){ el.querySelector("#aVerify").disabled=false; el.querySelector("#aMsg").textContent="OTP galat hai, dobara daalo"; } };
        el.querySelector("#aVerify").onclick=go; el.querySelector("#aOtp").oninput=e=>{ if(e.target.value.length===6) go(); };
        el.querySelector("#aBack").onclick=step1; el.querySelector("#aOtp").focus();
      };
      emailStep(); resolve();
    });
  }

  function init(){
    if(ready) return ready;
    ready=(async()=>{
      if(!window.FIREBASE_CONFIG||!window.FIREBASE_CONFIG.apiKey||/PASTE/.test(window.FIREBASE_CONFIG.apiKey)){
        shell(`<p class="auth-msg">Setup baaki hai: <b>config.js</b> mein Firebase ki details daalni hain (SETUP guide dekho).</p>`); return new Promise(()=>{});
      }
      const [AppM,A,F]=await Promise.all([import(BASE+"firebase-app.js"),import(BASE+"firebase-auth.js"),import(BASE+"firebase-firestore.js")]);
      const app=AppM.initializeApp(window.FIREBASE_CONFIG);
      const auth=A.getAuth(app); auth.languageCode="hi";
      let fs; try{ fs=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})}); }catch(e){ fs=F.getFirestore(app); }
      const u=await new Promise(res=>{ let shown=false; A.onAuthStateChanged(auth,usr=>{ if(usr) res(usr); else if(!shown){ shown=true; loginUI(A,auth); } }); });
      if(!u.phoneNumber && u.email && !u.emailVerified){
        const el=shell(`<p class="auth-msg" style="color:#2b2220">📧 <b>${u.email}</b> pe ek <b>verification link</b> bheja gaya hai.<br><br>Email kholke link dabao (Spam folder bhi dekhna), phir neeche button dabao.</p>
          <button class="auth-btn" id="vDone">Verify kar liya – aage badho</button>
          <button class="auth-btn ghost" id="vAgain">Link dobara bhejo</button><div id="aMsg" class="auth-msg"></div>
          <button class="auth-link" id="vOut">Doosre email se login</button>`);
        el.querySelector("#vDone").onclick=async()=>{ try{ await u.reload(); await u.getIdToken(true); }catch(e){} if(auth.currentUser&&auth.currentUser.emailVerified) location.reload(); else el.querySelector("#aMsg").textContent="Abhi verify nahi hua – email ka link dabao."; };
        el.querySelector("#vAgain").onclick=async()=>{ try{ await A.sendEmailVerification(u); el.querySelector("#aMsg").textContent="Link dobara bhej diya ✓"; }catch(e){ el.querySelector("#aMsg").textContent="Thodi der baad try karo."; } };
        el.querySelector("#vOut").onclick=()=>A.signOut(auth).then(()=>location.reload());
        return new Promise(()=>{});
      }
      const key=(u.phoneNumber||(u.email||"")).toLowerCase();
      const admin=ADMINS.includes(key);
      let allowed=admin;
      if(!admin){ try{ allowed=(await F.getDoc(F.doc(fs,"allowed",key))).exists(); }catch(e){ allowed=false; } }
      hideShell();
      return {fs,F,A,auth,u,key,admin,pending:!allowed};
    })();
    return ready;
  }

  const clean=v=>JSON.parse(JSON.stringify(v));
  const wrap=s=>({docs:s.docs.map(d=>({id:d.id,data:()=>d.data()}))});
  function pendingApi(c){
    const {fs,F,key}=c; const me=F.doc(fs,"pending",key); const no=()=>Promise.reject({code:"permission-denied"});
    const col=n=>{
      if(n!=="members") return { doc:()=>({set:no,update:no,delete:no,get:async()=>null}), onSnapshot:(cb,err)=>{ err&&err({code:"permission-denied"}); return ()=>{}; }, where:()=>({get:async()=>({docs:[]})}), get:async()=>({docs:[]}) };
      return {
        doc:id=>({
          set:async v=>{ const nm=v.name||""; await F.setDoc(me,{rec:clean(v),mid:id,key,name:nm,at:Date.now()},{merge:true}); },
          update:async v=>{ const own=(await F.getDoc(me)); const d=own.exists()?own.data():{}; if(d.mid===id){ await F.setDoc(me,{rec:clean(v)},{merge:true}); return; }
            await F.setDoc(me,{later:{[id]:clean(v)}},{merge:true}); },
          delete:no, get:async()=>null }),
        onSnapshot:(cb,err)=>{ let names=[],own=null; const fire=()=>{ const list=names.filter(x=>!own||x.id!==own.mid).map(x=>({id:x.id,data:()=>x}));
            if(own&&own.rec) list.push({id:own.mid,data:()=>({...own.rec,_pending:true})}); cb({docs:list}); };
          const u1=F.onSnapshot(F.doc(fs,"pub","names"),s=>{ names=(s.exists()&&s.data().list)||[]; fire(); },e=>{ fire(); });
          const u2=F.onSnapshot(me,s=>{ own=s.exists()?s.data():null; window._pendingDoc=own; fire(); },e=>err&&err(e));
          return ()=>{u1();u2();}; },
        where:()=>({get:async()=>({docs:[]})}), get:async()=>({docs:[]}) };
    };
    return {collection:col};
  }
  function dbApi(c){
    if(c.pending) return pendingApi(c);
    const {fs,F}=c;
    const col=n=>({
      doc:id=>({ set:v=>F.setDoc(F.doc(fs,n,id),clean(v)), update:v=>F.updateDoc(F.doc(fs,n,id),clean(v)), delete:()=>F.deleteDoc(F.doc(fs,n,id)), get:async()=>{const s=await F.getDoc(F.doc(fs,n,id));return s.exists()?{id:s.id,...s.data()}:null;} }),
      onSnapshot:(cb,err)=>F.onSnapshot(F.collection(fs,n),s=>cb(wrap(s)),err),
      where:(f,op,v)=>({get:async()=>wrap(await F.getDocs(F.query(F.collection(fs,n),F.where(f,op,v))))}),
      get:async()=>wrap(await F.getDocs(F.collection(fs,n))),
    });
    return {collection:col};
  }
  const MIME={jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",pdf:"application/pdf",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",json:"application/json"};
  const downloadsApi={ save:async({filename,data})=>{
    const ext=(filename.split(".").pop()||"").toLowerCase();
    const blob=data instanceof Blob?data:new Blob([data]);
    const file=new File([blob],filename,{type:MIME[ext]||blob.type||"application/octet-stream"});
    if(/^(jpg|jpeg|png|pdf)$/.test(ext)&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{ await navigator.share({files:[file],title:filename}); return {status:"saved"}; }
      catch(e){ if(e&&e.name==="AbortError") throw {code:"declined"}; }
    }
    const a=document.createElement("a"); a.href=URL.createObjectURL(file); a.download=filename; document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},3000); return {status:"saved"};
  }};
  window.claude={ use: async name=>{
    const c=await init();
    if(name==="db") return dbApi(c);
    if(name==="user") return { id:async()=>c.u.uid, canEdit:async()=>c.admin, can:async()=>true, key:c.key, isAdmin:c.admin, pending:!!c.pending,
      email:c.u.email||"", hasPassword:()=>!!(c.auth.currentUser&&c.auth.currentUser.providerData.some(p=>p.providerId==="password")),
      setPassword:async(pw,email)=>{ const cu=c.auth.currentUser; const A=c.A;
        const hasPw=cu.providerData.some(p=>p.providerId==="password");
        if(hasPw) return A.updatePassword(cu,pw);
        const em=(cu.email||email||"").trim().toLowerCase(); if(!em) throw {code:"need-email"};
        await A.linkWithCredential(cu,A.EmailAuthProvider.credential(em,pw));
        if(!cu.emailVerified){ try{ await A.sendEmailVerification(cu); }catch(e){} } },
      resetMail:async()=>{ const cu=c.auth.currentUser; if(cu&&cu.email) return c.A.sendPasswordResetEmail(c.auth,cu.email); throw {code:"need-email"}; },
      signOut:()=>c.A.signOut(c.auth).then(()=>location.reload()) };
    if(name==="downloads") return downloadsApi;
    return null;
  }};
})();
