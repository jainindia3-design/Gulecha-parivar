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
      const step1=()=>{
        const el=shell(`<label class="auth-l">Apna mobile number</label>
          <div class="auth-phone"><span>+91</span><input id="aPhone" type="tel" inputmode="numeric" maxlength="10" placeholder="98XXXXXXXX" autocomplete="tel-national"></div>
          <button class="auth-btn" id="aSend">OTP bhejo</button>
          <div id="aMsg" class="auth-msg"></div>
          <div id="recap"></div>
          <button class="auth-link" id="aGoogle">ya Google (Gmail) se login karo</button>`);
        const msg=t=>{el.querySelector("#aMsg").textContent=t};
        let verifier=null;
        try{ verifier=new A.RecaptchaVerifier(auth,"recap",{size:"invisible"}); }catch(e){ console.error(e); }
        el.querySelector("#aSend").onclick=async()=>{
          const ph=normPhone(el.querySelector("#aPhone").value);
          if(!ph){ msg("10 digit ka mobile number daalo"); return; }
          const b=el.querySelector("#aSend"); b.disabled=true; b.textContent="Bhej rahe hain…"; msg("");
          try{ const conf=await A.signInWithPhoneNumber(auth,ph,verifier); step2(ph,conf); }
          catch(e){ console.error(e); b.disabled=false; b.textContent="OTP bhejo";
            msg(/too-many/.test(e.code)?"Bahut baar koshish hui – thodi der baad try karo.":/invalid-phone/.test(e.code)?"Number sahi nahi lag raha.":/billing|quota/.test(e.code)?"OTP abhi band hai (Firebase billing/limit). Admin se baat karo ya Google se login karo.":"OTP nahi gaya: "+(e.code||e.message)); }
        };
        el.querySelector("#aGoogle").onclick=async()=>{ try{ await A.signInWithPopup(auth,new A.GoogleAuthProvider()); }catch(e){ msg("Google login nahi hua: "+(e.code||e.message)); } };
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
      step1(); resolve();
    });
  }

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
      const step1=()=>{
        const el=shell(`<label class="auth-l">Apna mobile number</label>
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
      step1(); resolve();
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
      const key=(u.phoneNumber||(u.email||"")).toLowerCase();
      const admin=ADMINS.includes(key);
      let allowed=admin;
      if(!admin){ try{ allowed=(await F.getDoc(F.doc(fs,"allowed",key))).exists(); }catch(e){ allowed=false; } }
      if(!allowed){
        const el=shell(`<p class="auth-msg" style="color:#2b2220">🙏 Namaste! Aapka <b>${key}</b> abhi family list mein nahi hai.<br><br>Admin (ghar ke bade / app chalane wale) ko ye number bhejiye – woh jodte hi app khul jayega.</p>
          <button class="auth-btn" id="aRetry">Dobara check karo</button><button class="auth-link" id="aOut">Doosre number se login</button>`);
        el.querySelector("#aRetry").onclick=()=>location.reload();
        el.querySelector("#aOut").onclick=()=>A.signOut(auth).then(()=>location.reload());
        return new Promise(()=>{});
      }
      hideShell();
      return {fs,F,A,auth,u,key,admin};
    })();
    return ready;
  }

  const clean=v=>JSON.parse(JSON.stringify(v));
  const wrap=s=>({docs:s.docs.map(d=>({id:d.id,data:()=>d.data()}))});
  function dbApi(c){
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
    if(name==="user") return { id:async()=>c.u.uid, canEdit:async()=>c.admin, can:async()=>true, key:c.key, isAdmin:c.admin,
      signOut:()=>c.A.signOut(c.auth).then(()=>location.reload()) };
    if(name==="downloads") return downloadsApi;
    return null;
  }};
})();

})();
