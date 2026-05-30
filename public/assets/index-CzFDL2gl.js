(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const g of r.addedNodes)g.tagName==="LINK"&&g.rel==="modulepreload"&&s(g)}).observe(document,{childList:!0,subtree:!0});function a(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=a(n);fetch(n.href,r)}})();class B{worker=new Worker(new URL("/assets/db.worker-C-JeQgBT.js",import.meta.url),{type:"module"});nextId=1;pending=new Map;constructor(){this.worker.onmessage=e=>{const a=this.pending.get(e.data.id);a&&(this.pending.delete(e.data.id),e.data.ok?a.resolve(e.data.data):a.reject(new Error(e.data.error)))}}init(e){return this.request({type:"init",dbUrl:e})}lookupCallsign(e){return this.request({type:"lookupCallsign",callsign:e})}searchSuggestions(e,a,s=8){return this.request({type:"searchSuggestions",query:e,mode:a,limit:s})}listChanges(e,a){return this.request({type:"listChanges",start:e,end:a})}request(e){const a=this.nextId++,s={...e,id:a};return new Promise((n,r)=>{this.pending.set(a,{resolve:n,reject:r}),this.worker.postMessage(s)})}}const F=1440*60*1e3;function S(){return I(new Date)}function E(t){const e=new Date;return e.setUTCDate(e.getUTCDate()-t),I(e)}function I(t){return t.toISOString().slice(0,10)}function Y(t,e){if(t===null||e===null)return null;const a=Date.parse(`${t}T00:00:00Z`),s=Date.parse(`${e}T00:00:00Z`);return Number.isNaN(a)||Number.isNaN(s)?null:Math.max(0,Math.round((s-a)/F))}function N(t,e,a=!1){if(t===null)return"";const s=a?"> ":"";if(t<60)return s+e.days.replace("{n}",String(t));if(t<365)return s+e.months.replace("{n}",String(Math.max(1,Math.round(t/30))));const n=Math.floor(t/365),r=Math.round((t-n*365)/30);return s+e.yearsMonths.replace("{years}",String(n)).replace("{months}",String(r))}const W={fi:{appTitle:"Koolitutka",appSubtitle:"Radioamatöörikutsujen tila ja historia",searchLabel:"Kutsu",searchPlaceholder:"Esim. OH2AD",searchButton:"Hae",prefixSearchOnly:"Hae vain kutsun alkuosaa",loading:"Ladataan tietokantaa...",error:"Virhe",available:"Vapaa",currentStatus:"Nykytila",history:"Historia",related:"Läheiset kutsut",changes:"Muutokset",from:"Alkaen",to:"Päättyen",update:"Päivitä",lastSevenDays:"Viimeiset 7 päivää",noRows:"Ei näytettäviä rivejä.",callsign:"Kutsu",status:"Tila",startDate:"Alkupäivä",since:"Alkaen",endDate:"Loppupäivä",active:"voimassa",date:"Päivä",change:"Muutos",duration:"Kesto",started:"alkoi",ended:"päättyi",metadata:"Päivitetty {updated}",language:"Kieli",close:"Sulje",noHistoryNotice:"Tällä kutsulla ei ole tunnettua historiaa. Se voi olla vapaa tai virheellinen. Tarkista kelpoisuussäännöt ennen sen hakemista.",validityRules:"Kelpoisuussäännöt",statusText:{VOIMASSA:"Voimassa",VARAUS:"Varaus",KARENSSI:"Karenssi",VAPAA:"Vapaa"},days:"{n} pv",months:"{n} kk",yearsMonths:"{years} v {months} kk"},sv:{appTitle:"Koolitutka",appSubtitle:"Status och historik för radioamatöranropssignaler",searchLabel:"Anropssignal",searchPlaceholder:"T.ex. OH2AD",searchButton:"Sök",prefixSearchOnly:"Sök endast från början",loading:"Laddar databasen...",error:"Fel",available:"Ledig",currentStatus:"Nuvarande status",history:"Historik",related:"Relaterade anropssignaler",changes:"Ändringar",from:"Från",to:"Till",update:"Uppdatera",lastSevenDays:"Senaste 7 dagarna",noRows:"Inga rader att visa.",callsign:"Anropssignal",status:"Status",startDate:"Startdatum",since:"Sedan",endDate:"Slutdatum",active:"aktiv",date:"Datum",change:"Ändring",duration:"Varaktighet",started:"började",ended:"slutade",metadata:"Uppdaterad {updated}",language:"Språk",close:"Stäng",noHistoryNotice:"Den här anropssignalen har ingen känd historik. Den kan vara ledig eller ogiltig. Kontrollera giltighetsreglerna innan du ansöker om den.",validityRules:"Giltighetsregler",statusText:{VOIMASSA:"I kraft",VARAUS:"Reserverad",KARENSSI:"Karenstid",VAPAA:"Ledig"},days:"{n} d",months:"{n} mån",yearsMonths:"{years} år {months} mån"},en:{appTitle:"Koolitutka",appSubtitle:"Amateur radio callsign status and history",searchLabel:"Callsign",searchPlaceholder:"E.g. OH2AD",searchButton:"Search",prefixSearchOnly:"Prefix search only",loading:"Loading database...",error:"Error",available:"Available",currentStatus:"Current status",history:"History",related:"Related callsigns",changes:"Changes",from:"From",to:"To",update:"Update",lastSevenDays:"Last 7 days",noRows:"No rows to show.",callsign:"Callsign",status:"Status",startDate:"Start date",since:"Since",endDate:"End date",active:"active",date:"Date",change:"Change",duration:"Duration",started:"started",ended:"ended",metadata:"Updated {updated}",language:"Language",close:"Close",noHistoryNotice:"This callsign has no known history. It may be available, or it may be invalid. Check the validity rules before applying for it.",validityRules:"Validity rules",statusText:{VOIMASSA:"Active",VARAUS:"Reserved",KARENSSI:"Cooldown",VAPAA:"Available"},days:"{n} d",months:"{n} mo",yearsMonths:"{years} y {months} mo"}},v=["fi","sv","en"];function Z(t,e="fi"){for(const a of t){const s=a.toLowerCase().split("-")[0];if(v.includes(s))return s}return e}function d(t){return W[t]}function z(t,e){return t.replace(/\{([^}]+)\}/g,(a,s)=>String(e[s]??""))}function $(t){return t.trim().toUpperCase().replace(/\s+/g,"")}const T=/^\d{4}-\d{2}-\d{2}$/;function P(t){const e=t.startsWith("#")?t.slice(1):t,a=new URLSearchParams(e),s=a.get("lang"),n=a.get("start"),r=a.get("end"),g=$(a.get("q")??"");return{q:g.length>0?g:null,start:n&&T.test(n)?n:null,end:r&&T.test(r)?r:null,language:s&&v.includes(s)?s:null}}function H(t){const e=new URLSearchParams,a=$(t.q??"");return a.length>0&&e.set("q",a),e.set("start",t.start),e.set("end",t.end),e.set("lang",t.language),`#${e.toString()}`}function G(t){return t!=="false"}const J="https://oh2ti.fi/wp-content/uploads/2023/05/PRK-RA2023_L1-L2_K-moduuli.pdf#page=9",O="prefixSearchOnly",b=new B,k=P(location.hash),L=localStorage.getItem("language");let o=k.language??(L&&v.includes(L)?L:null)??Z(navigator.languages),u=k.start??E(7),c=k.end??S(),l=k.q,m=G(localStorage.getItem(O)),A=null,h=null,w=[],D=!0,y=null;const K=document.querySelector("#app");if(!K)throw new Error("Missing app root");window.addEventListener("hashchange",()=>{st(location.hash)});i();b.init("/koolitutka.sqlite").then(t=>(A=t,D=!1,p(),U())).catch(t=>{D=!1,y=t instanceof Error?t.message:String(t),i()});function i(){const t=d(o);document.documentElement.lang=o,K.innerHTML=`
    <main class="shell">
      <header class="topbar">
        <div>
          <h1>${t.appTitle}</h1>
          <p>${t.appSubtitle}</p>
        </div>
        <label class="language">
          <span>${t.language}</span>
          <select id="language-select">
            ${v.map(e=>`<option value="${e}" ${e===o?"selected":""}>${e.toUpperCase()}</option>`).join("")}
          </select>
        </label>
      </header>

      ${A?`<p class="metadata">${z(t.metadata,{updated:A.updated})}</p>`:""}
      ${D?`<p class="notice">${t.loading}</p>`:""}
      ${y?`<p class="notice error">${t.error}: ${rt(y)}</p>`:""}

      <section class="search-panel">
        <form id="search-form" class="search-form">
          <label for="callsign">${t.searchLabel}<input id="callsign" name="callsign" autocomplete="off" placeholder="${t.searchPlaceholder}" value="${h?.callsign??""}" /></label>
          <button type="submit">${t.searchButton}</button>
          <label class="checkbox-label"><input id="prefix-search-only" type="checkbox" ${m?"checked":""} />${t.prefixSearchOnly}</label>
        </form>
        <div id="suggestions" class="suggestions"></div>
      </section>

      ${h?X(h):""}

      <section class="changes-panel">
        <div class="section-header">
          <h2>${t.changes}</h2>
          <form id="changes-form" class="date-form">
            <label>${t.from}<input type="date" id="start-date" value="${u}" /></label>
            <label>${t.to}<input type="date" id="end-date" value="${c}" /></label>
            <button type="submit">${t.update}</button>
            <button id="last-seven-days" class="secondary-button" type="button">${t.lastSevenDays}</button>
          </form>
        </div>
        ${at(w)}
      </section>
    </main>
  `,Q()}function Q(){document.querySelector("#language-select")?.addEventListener("change",t=>{o=t.currentTarget.value,localStorage.setItem("language",o),p(),i()}),document.querySelector("#search-form")?.addEventListener("submit",t=>{t.preventDefault();const e=document.querySelector("#callsign"),a=$(e?.value??"");a.length!==0&&V(a).then(()=>{p(),i()}).catch(f)}),document.querySelector("#callsign")?.addEventListener("input",()=>{M().catch(f)}),document.querySelector("#prefix-search-only")?.addEventListener("change",t=>{m=t.currentTarget.checked,localStorage.setItem(O,String(m)),M().catch(f)}),document.querySelector("#changes-form")?.addEventListener("submit",t=>{t.preventDefault(),u=document.querySelector("#start-date")?.value||u,c=document.querySelector("#end-date")?.value||c,p(),q().catch(f)}),document.querySelector("#last-seven-days")?.addEventListener("click",()=>{u=E(7),c=S(),p(),q().catch(f)}),document.querySelector("#close-lookup")?.addEventListener("click",()=>{h=null,l=null;const t=document.querySelector("#callsign");t&&(t.value=""),p(),i()})}function M(){const t=document.querySelector("#callsign"),e=document.querySelector("#suggestions"),a=$(t?.value??"");return!e||a.length<2?(e&&(e.innerHTML=""),Promise.resolve()):b.searchSuggestions(a,m?"prefix":"anywhere").then(s=>{e.innerHTML=s.map(n=>`<button type="button" data-callsign="${n.callsign}">${n.callsign}</button>`).join(""),e.querySelectorAll("button").forEach(n=>{n.addEventListener("click",()=>{t&&(t.value=n.dataset.callsign??""),document.querySelector("#search-form")?.requestSubmit()})})})}function X(t){const e=d(o),a=t.current;return`
    <section class="lookup-grid">
      <article class="status-card status-${a.status.toLowerCase()}">
        <div class="card-header">
          <h2>${e.currentStatus}</h2>
          <button id="close-lookup" class="icon-button" type="button" aria-label="${e.close}" title="${e.close}">×</button>
        </div>
        <div class="status-line">${a.callsign}: ${C(a.status)}</div>
        ${nt(a)}
        ${tt(t)}
      </article>
      <article>
        <h2>${e.history}</h2>
        ${x(t.history)}
      </article>
      <article>
        <h2>${e.related}</h2>
        ${x(t.related,!0)}
      </article>
    </section>
  `}function tt(t){if(t.history.length>0)return"";const e=d(o);return`<p class="status-note">${e.noHistoryNotice} <a href="${J}" target="_blank" rel="noopener noreferrer">${e.validityRules}</a>.</p>`}function x(t,e=!1){const a=d(o);return t.length===0?`<p class="empty">${a.noRows}</p>`:`
    <div class="table-wrap">
      <table>
        <thead><tr><th>${a.callsign}</th><th>${a.status}</th><th>${a.startDate}</th><th>${a.endDate}</th></tr></thead>
        <tbody>${t.map(s=>`
          <tr>
            <td>${et(s.callsign,e)}</td>
            <td>${C(s.status)}</td>
            <td>${R(s)}</td>
            <td>${_(s)}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>
  `}function et(t,e){return e?`<a class="callsign-link" href="${j(t)}">${t}</a>`:t}function at(t){const e=d(o);return t.length===0?`<p class="empty">${e.noRows}</p>`:`
    <div class="table-wrap">
      <table>
        <thead><tr><th>${e.date}</th><th>${e.change}</th><th>${e.callsign}</th><th>${e.status}</th><th>${e.startDate}</th><th>${e.endDate}</th><th>${e.duration}</th></tr></thead>
        <tbody>${t.map(a=>`
          <tr>
            <td>${a.change_date}</td>
            <td>${a.change_type==="start"?e.started:e.ended}</td>
            <td><a class="callsign-link" href="${j(a.callsign)}">${a.callsign}</a></td>
            <td>${C(a.status)}</td>
            <td>${R(a)}</td>
            <td>${_(a)}</td>
            <td>${N(a.duration_days,e,a.from_date_estimated)}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>
  `}function q(){return b.listChanges(u,c).then(t=>{w=t,i()})}function nt(t){const e=d(o),a=[];t.from_date&&a.push(`<p>${e.since}: ${R(t)}</p>`),t.to_date&&a.push(`<p>${e.endDate}: ${_({to_date:t.to_date})}</p>`);const s=t.to_date??S(),n=N(Y(t.from_date,s),e,t.from_date_estimated);return n&&a.push(`<p>${e.duration}: ${n}</p>`),a.join("")}function V(t){return l=t,b.lookupCallsign(t).then(e=>{h=e})}function U(){return q().then(()=>{if(l===null){h=null,i();return}return V(l).then(i)})}function j(t){return H({q:t,start:u,end:c,language:o})}function p(){const t=H({q:h?.callsign??l,start:u,end:c,language:o});location.hash!==t&&history.replaceState(null,"",t)}function st(t){const e=P(t),a=l;o=e.language??o,u=e.start??E(7),c=e.end??S(),l=e.q,U().then(()=>{l!==null&&l!==a&&window.scrollTo({top:0,behavior:"smooth"})}).catch(f)}function R(t){return t.from_date===null?"":t.from_date_estimated?`< ${t.from_date}`:t.from_date}function _(t){return t.to_date==="NOW"?d(o).active:t.to_date}function C(t){return d(o).statusText[t]}function f(t){y=t instanceof Error?t.message:String(t),i()}function rt(t){return t.replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]??e)}
