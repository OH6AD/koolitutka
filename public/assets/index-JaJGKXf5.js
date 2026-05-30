(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const h of r.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&s(h)}).observe(document,{childList:!0,subtree:!0});function a(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=a(n);fetch(n.href,r)}})();class T{worker=new Worker(new URL("/assets/db.worker-7xsxtYFK.js",import.meta.url),{type:"module"});nextId=1;pending=new Map;constructor(){this.worker.onmessage=e=>{const a=this.pending.get(e.data.id);a&&(this.pending.delete(e.data.id),e.data.ok?a.resolve(e.data.data):a.reject(new Error(e.data.error)))}}init(e){return this.request({type:"init",dbUrl:e})}lookupCallsign(e){return this.request({type:"lookupCallsign",callsign:e})}searchPrefix(e,a=8){return this.request({type:"searchPrefix",prefix:e,limit:a})}listChanges(e,a){return this.request({type:"listChanges",start:e,end:a})}request(e){const a=this.nextId++,s={...e,id:a};return new Promise((n,r)=>{this.pending.set(a,{resolve:n,reject:r}),this.worker.postMessage(s)})}}function k(){return D(new Date)}function L(t){const e=new Date;return e.setUTCDate(e.getUTCDate()-t),D(e)}function D(t){return t.toISOString().slice(0,10)}function I(t,e,a=!1){if(t===null)return"";const s=a?"> ":"";if(t<60)return s+e.days.replace("{n}",String(t));if(t<365)return s+e.months.replace("{n}",String(Math.max(1,Math.round(t/30))));const n=Math.floor(t/365),r=Math.round((t-n*365)/30);return s+e.yearsMonths.replace("{years}",String(n)).replace("{months}",String(r))}const P={fi:{appTitle:"Koolitutka",appSubtitle:"Radioamatöörikutsujen tila ja historia",searchLabel:"Kutsu",searchPlaceholder:"Esim. OH2AD",searchButton:"Hae",loading:"Ladataan tietokantaa...",error:"Virhe",available:"Vapaa",currentStatus:"Nykytila",history:"Historia",related:"Läheiset kutsut",changes:"Muutokset",from:"Alkaen",to:"Päättyen",update:"Päivitä",noRows:"Ei näytettäviä rivejä.",callsign:"Kutsu",status:"Tila",startDate:"Alkupäivä",endDate:"Loppupäivä",active:"voimassa",change:"Muutos",duration:"Kesto",started:"alkoi",ended:"päättyi",metadata:"Päivitetty {updated}",language:"Kieli",statusText:{VOIMASSA:"Voimassa",VARAUS:"Varaus",KARENSSI:"Karenssi",VAPAA:"Vapaa"},days:"{n} pv",months:"{n} kk",yearsMonths:"{years} v {months} kk"},sv:{appTitle:"Koolitutka",appSubtitle:"Status och historik för radioamatöranropssignaler",searchLabel:"Anropssignal",searchPlaceholder:"T.ex. OH2AD",searchButton:"Sök",loading:"Laddar databasen...",error:"Fel",available:"Ledig",currentStatus:"Nuvarande status",history:"Historik",related:"Relaterade anropssignaler",changes:"Ändringar",from:"Från",to:"Till",update:"Uppdatera",noRows:"Inga rader att visa.",callsign:"Anropssignal",status:"Status",startDate:"Startdatum",endDate:"Slutdatum",active:"aktiv",change:"Ändring",duration:"Varaktighet",started:"började",ended:"slutade",metadata:"Uppdaterad {updated}",language:"Språk",statusText:{VOIMASSA:"I kraft",VARAUS:"Reserverad",KARENSSI:"Karenstid",VAPAA:"Ledig"},days:"{n} d",months:"{n} mån",yearsMonths:"{years} år {months} mån"},en:{appTitle:"Koolitutka",appSubtitle:"Amateur radio callsign status and history",searchLabel:"Callsign",searchPlaceholder:"E.g. OH2AD",searchButton:"Search",loading:"Loading database...",error:"Error",available:"Available",currentStatus:"Current status",history:"History",related:"Related callsigns",changes:"Changes",from:"From",to:"To",update:"Update",noRows:"No rows to show.",callsign:"Callsign",status:"Status",startDate:"Start date",endDate:"End date",active:"active",change:"Change",duration:"Duration",started:"started",ended:"ended",metadata:"Updated {updated}",language:"Language",statusText:{VOIMASSA:"Active",VARAUS:"Reserved",KARENSSI:"Cooldown",VAPAA:"Available"},days:"{n} d",months:"{n} mo",yearsMonths:"{years} y {months} mo"}},y=["fi","sv","en"];function R(t,e="fi"){for(const a of t){const s=a.toLowerCase().split("-")[0];if(y.includes(s))return s}return e}function l(t){return P[t]}function x(t,e){return t.replace(/\{([^}]+)\}/g,(a,s)=>String(e[s]??""))}function b(t){return t.trim().toUpperCase().replace(/\s+/g,"")}const d=new T,p=localStorage.getItem("language");let i=p&&y.includes(p)?p:R(navigator.languages),f=null,u=null,E=[],$=!0,c=null;const C=document.querySelector("#app");if(!C)throw new Error("Missing app root");o();d.init("/koolitutka.sqlite").then(t=>(f=t,$=!1,q())).catch(t=>{$=!1,c=t instanceof Error?t.message:String(t),o()});function o(){const t=l(i);document.documentElement.lang=i,C.innerHTML=`
    <main class="shell">
      <header class="topbar">
        <div>
          <h1>${t.appTitle}</h1>
          <p>${t.appSubtitle}</p>
        </div>
        <label class="language">
          <span>${t.language}</span>
          <select id="language-select">
            ${y.map(e=>`<option value="${e}" ${e===i?"selected":""}>${e.toUpperCase()}</option>`).join("")}
          </select>
        </label>
      </header>

      ${f?`<p class="metadata">${x(t.metadata,{updated:f.updated})}</p>`:""}
      ${$?`<p class="notice">${t.loading}</p>`:""}
      ${c?`<p class="notice error">${t.error}: ${_(c)}</p>`:""}

      <section class="search-panel">
        <form id="search-form" class="search-form">
          <label for="callsign">${t.searchLabel}</label>
          <input id="callsign" name="callsign" autocomplete="off" placeholder="${t.searchPlaceholder}" value="${u?.callsign??""}" />
          <button type="submit">${t.searchButton}</button>
        </form>
        <div id="suggestions" class="suggestions"></div>
      </section>

      ${u?K(u):""}

      <section class="changes-panel">
        <div class="section-header">
          <h2>${t.changes}</h2>
          <form id="changes-form" class="date-form">
            <label>${t.from}<input type="date" id="start-date" value="${g("start-date",L(7))}" /></label>
            <label>${t.to}<input type="date" id="end-date" value="${g("end-date",k())}" /></label>
            <button type="submit">${t.update}</button>
          </form>
        </div>
        ${O(E)}
      </section>
    </main>
  `,V()}function V(){document.querySelector("#language-select")?.addEventListener("change",t=>{i=t.currentTarget.value,localStorage.setItem("language",i),o()}),document.querySelector("#search-form")?.addEventListener("submit",t=>{t.preventDefault();const e=document.querySelector("#callsign"),a=b(e?.value??"");a.length!==0&&d.lookupCallsign(a).then(s=>{u=s,o()}).catch(m)}),document.querySelector("#callsign")?.addEventListener("input",t=>{const e=b(t.currentTarget.value),a=document.querySelector("#suggestions");if(!a||e.length<2){a&&(a.innerHTML="");return}d.searchPrefix(e).then(s=>{a.innerHTML=s.map(n=>`<button type="button" data-callsign="${n.callsign}">${n.callsign}</button>`).join(""),a.querySelectorAll("button").forEach(n=>{n.addEventListener("click",()=>{const r=document.querySelector("#callsign");r&&(r.value=n.dataset.callsign??""),document.querySelector("#search-form")?.requestSubmit()})})}).catch(m)}),document.querySelector("#changes-form")?.addEventListener("submit",t=>{t.preventDefault(),q().catch(m)})}function K(t){const e=l(i),a=t.current;return`
    <section class="lookup-grid">
      <article class="status-card status-${a.status.toLowerCase()}">
        <h2>${e.currentStatus}</h2>
        <div class="status-line">${a.callsign}: ${S(a.status)}</div>
        ${a.from_date?`<p>${e.startDate}: ${v(a)}</p>`:""}
      </article>
      <article>
        <h2>${e.history}</h2>
        ${A(t.history)}
      </article>
      <article>
        <h2>${e.related}</h2>
        ${A(t.related)}
      </article>
    </section>
  `}function A(t){const e=l(i);return t.length===0?`<p class="empty">${e.noRows}</p>`:`
    <div class="table-wrap">
      <table>
        <thead><tr><th>${e.callsign}</th><th>${e.status}</th><th>${e.startDate}</th><th>${e.endDate}</th></tr></thead>
        <tbody>${t.map(a=>`
          <tr>
            <td>${a.callsign}</td>
            <td>${S(a.status)}</td>
            <td>${v(a)}</td>
            <td>${M(a)}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>
  `}function O(t){const e=l(i);return t.length===0?`<p class="empty">${e.noRows}</p>`:`
    <div class="table-wrap">
      <table>
        <thead><tr><th>${e.change}</th><th>${e.callsign}</th><th>${e.status}</th><th>${e.startDate}</th><th>${e.endDate}</th><th>${e.duration}</th></tr></thead>
        <tbody>${t.map(a=>`
          <tr>
            <td>${a.change_date} ${a.change_type==="start"?e.started:e.ended}</td>
            <td>${a.callsign}</td>
            <td>${S(a.status)}</td>
            <td>${v(a)}</td>
            <td>${M(a)}</td>
            <td>${I(a.duration_days,e,a.from_date_estimated)}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>
  `}function q(){const t=g("start-date",L(7)),e=g("end-date",k());return d.listChanges(t,e).then(a=>{E=a,o()})}function g(t,e){return document.querySelector(`#${t}`)?.value||e}function v(t){return t.from_date===null?"":t.from_date_estimated?`< ${t.from_date}`:t.from_date}function M(t){return t.to_date==="NOW"?l(i).active:t.to_date}function S(t){return l(i).statusText[t]}function m(t){c=t instanceof Error?t.message:String(t),o()}function _(t){return t.replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]??e)}
