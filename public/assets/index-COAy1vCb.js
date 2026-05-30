(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const g of r.addedNodes)g.tagName==="LINK"&&g.rel==="modulepreload"&&s(g)}).observe(document,{childList:!0,subtree:!0});function a(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=a(n);fetch(n.href,r)}})();class _{worker=new Worker(new URL("/assets/db.worker-7xsxtYFK.js",import.meta.url),{type:"module"});nextId=1;pending=new Map;constructor(){this.worker.onmessage=e=>{const a=this.pending.get(e.data.id);a&&(this.pending.delete(e.data.id),e.data.ok?a.resolve(e.data.data):a.reject(new Error(e.data.error)))}}init(e){return this.request({type:"init",dbUrl:e})}lookupCallsign(e){return this.request({type:"lookupCallsign",callsign:e})}searchPrefix(e,a=8){return this.request({type:"searchPrefix",prefix:e,limit:a})}listChanges(e,a){return this.request({type:"listChanges",start:e,end:a})}request(e){const a=this.nextId++,s={...e,id:a};return new Promise((n,r)=>{this.pending.set(a,{resolve:n,reject:r}),this.worker.postMessage(s)})}}const I=1440*60*1e3;function y(){return M(new Date)}function D(t){const e=new Date;return e.setUTCDate(e.getUTCDate()-t),M(e)}function M(t){return t.toISOString().slice(0,10)}function P(t,e){if(t===null||e===null)return null;const a=Date.parse(`${t}T00:00:00Z`),s=Date.parse(`${e}T00:00:00Z`);return Number.isNaN(a)||Number.isNaN(s)?null:Math.max(0,Math.round((s-a)/I))}function E(t,e,a=!1){if(t===null)return"";const s=a?"> ":"";if(t<60)return s+e.days.replace("{n}",String(t));if(t<365)return s+e.months.replace("{n}",String(Math.max(1,Math.round(t/30))));const n=Math.floor(t/365),r=Math.round((t-n*365)/30);return s+e.yearsMonths.replace("{years}",String(n)).replace("{months}",String(r))}const R={fi:{appTitle:"Koolitutka",appSubtitle:"Radioamatöörikutsujen tila ja historia",searchLabel:"Kutsu",searchPlaceholder:"Esim. OH2AD",searchButton:"Hae",loading:"Ladataan tietokantaa...",error:"Virhe",available:"Vapaa",currentStatus:"Nykytila",history:"Historia",related:"Läheiset kutsut",changes:"Muutokset",from:"Alkaen",to:"Päättyen",update:"Päivitä",noRows:"Ei näytettäviä rivejä.",callsign:"Kutsu",status:"Tila",startDate:"Alkupäivä",since:"Alkaen",endDate:"Loppupäivä",active:"voimassa",change:"Muutos",duration:"Kesto",started:"alkoi",ended:"päättyi",metadata:"Päivitetty {updated}",language:"Kieli",close:"Sulje",statusText:{VOIMASSA:"Voimassa",VARAUS:"Varaus",KARENSSI:"Karenssi",VAPAA:"Vapaa"},days:"{n} pv",months:"{n} kk",yearsMonths:"{years} v {months} kk"},sv:{appTitle:"Koolitutka",appSubtitle:"Status och historik för radioamatöranropssignaler",searchLabel:"Anropssignal",searchPlaceholder:"T.ex. OH2AD",searchButton:"Sök",loading:"Laddar databasen...",error:"Fel",available:"Ledig",currentStatus:"Nuvarande status",history:"Historik",related:"Relaterade anropssignaler",changes:"Ändringar",from:"Från",to:"Till",update:"Uppdatera",noRows:"Inga rader att visa.",callsign:"Anropssignal",status:"Status",startDate:"Startdatum",since:"Sedan",endDate:"Slutdatum",active:"aktiv",change:"Ändring",duration:"Varaktighet",started:"började",ended:"slutade",metadata:"Uppdaterad {updated}",language:"Språk",close:"Stäng",statusText:{VOIMASSA:"I kraft",VARAUS:"Reserverad",KARENSSI:"Karenstid",VAPAA:"Ledig"},days:"{n} d",months:"{n} mån",yearsMonths:"{years} år {months} mån"},en:{appTitle:"Koolitutka",appSubtitle:"Amateur radio callsign status and history",searchLabel:"Callsign",searchPlaceholder:"E.g. OH2AD",searchButton:"Search",loading:"Loading database...",error:"Error",available:"Available",currentStatus:"Current status",history:"History",related:"Related callsigns",changes:"Changes",from:"From",to:"To",update:"Update",noRows:"No rows to show.",callsign:"Callsign",status:"Status",startDate:"Start date",since:"Since",endDate:"End date",active:"active",change:"Change",duration:"Duration",started:"started",ended:"ended",metadata:"Updated {updated}",language:"Language",close:"Close",statusText:{VOIMASSA:"Active",VARAUS:"Reserved",KARENSSI:"Cooldown",VAPAA:"Available"},days:"{n} d",months:"{n} mo",yearsMonths:"{years} y {months} mo"}},S=["fi","sv","en"];function x(t,e="fi"){for(const a of t){const s=a.toLowerCase().split("-")[0];if(S.includes(s))return s}return e}function l(t){return R[t]}function N(t,e){return t.replace(/\{([^}]+)\}/g,(a,s)=>String(e[s]??""))}function k(t){return t.trim().toUpperCase().replace(/\s+/g,"")}const d=new _,h=localStorage.getItem("language");let o=h&&S.includes(h)?h:x(navigator.languages),f=null,u=null,C=[],$=!0,c=null;const q=document.querySelector("#app");if(!q)throw new Error("Missing app root");i();d.init("/koolitutka.sqlite").then(t=>(f=t,$=!1,T())).catch(t=>{$=!1,c=t instanceof Error?t.message:String(t),i()});function i(){const t=l(o);document.documentElement.lang=o,q.innerHTML=`
    <main class="shell">
      <header class="topbar">
        <div>
          <h1>${t.appTitle}</h1>
          <p>${t.appSubtitle}</p>
        </div>
        <label class="language">
          <span>${t.language}</span>
          <select id="language-select">
            ${S.map(e=>`<option value="${e}" ${e===o?"selected":""}>${e.toUpperCase()}</option>`).join("")}
          </select>
        </label>
      </header>

      ${f?`<p class="metadata">${N(t.metadata,{updated:f.updated})}</p>`:""}
      ${$?`<p class="notice">${t.loading}</p>`:""}
      ${c?`<p class="notice error">${t.error}: ${j(c)}</p>`:""}

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
            <label>${t.from}<input type="date" id="start-date" value="${p("start-date",D(7))}" /></label>
            <label>${t.to}<input type="date" id="end-date" value="${p("end-date",y())}" /></label>
            <button type="submit">${t.update}</button>
          </form>
        </div>
        ${O(C)}
      </section>
    </main>
  `,V()}function V(){document.querySelector("#language-select")?.addEventListener("change",t=>{o=t.currentTarget.value,localStorage.setItem("language",o),i()}),document.querySelector("#search-form")?.addEventListener("submit",t=>{t.preventDefault();const e=document.querySelector("#callsign"),a=k(e?.value??"");a.length!==0&&d.lookupCallsign(a).then(s=>{u=s,i()}).catch(m)}),document.querySelector("#callsign")?.addEventListener("input",t=>{const e=k(t.currentTarget.value),a=document.querySelector("#suggestions");if(!a||e.length<2){a&&(a.innerHTML="");return}d.searchPrefix(e).then(s=>{a.innerHTML=s.map(n=>`<button type="button" data-callsign="${n.callsign}">${n.callsign}</button>`).join(""),a.querySelectorAll("button").forEach(n=>{n.addEventListener("click",()=>{const r=document.querySelector("#callsign");r&&(r.value=n.dataset.callsign??""),document.querySelector("#search-form")?.requestSubmit()})})}).catch(m)}),document.querySelector("#changes-form")?.addEventListener("submit",t=>{t.preventDefault(),T().catch(m)}),document.querySelector("#close-lookup")?.addEventListener("click",()=>{u=null;const t=document.querySelector("#callsign");t&&(t.value=""),i()})}function K(t){const e=l(o),a=t.current;return`
    <section class="lookup-grid">
      <article class="status-card status-${a.status.toLowerCase()}">
        <div class="card-header">
          <h2>${e.currentStatus}</h2>
          <button id="close-lookup" class="icon-button" type="button" aria-label="${e.close}" title="${e.close}">×</button>
        </div>
        <div class="status-line">${a.callsign}: ${A(a.status)}</div>
        ${w(a)}
      </article>
      <article>
        <h2>${e.history}</h2>
        ${L(t.history)}
      </article>
      <article>
        <h2>${e.related}</h2>
        ${L(t.related)}
      </article>
    </section>
  `}function L(t){const e=l(o);return t.length===0?`<p class="empty">${e.noRows}</p>`:`
    <div class="table-wrap">
      <table>
        <thead><tr><th>${e.callsign}</th><th>${e.status}</th><th>${e.startDate}</th><th>${e.endDate}</th></tr></thead>
        <tbody>${t.map(a=>`
          <tr>
            <td>${a.callsign}</td>
            <td>${A(a.status)}</td>
            <td>${v(a)}</td>
            <td>${b(a)}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>
  `}function O(t){const e=l(o);return t.length===0?`<p class="empty">${e.noRows}</p>`:`
    <div class="table-wrap">
      <table>
        <thead><tr><th>${e.change}</th><th>${e.callsign}</th><th>${e.status}</th><th>${e.startDate}</th><th>${e.endDate}</th><th>${e.duration}</th></tr></thead>
        <tbody>${t.map(a=>`
          <tr>
            <td>${a.change_date} ${a.change_type==="start"?e.started:e.ended}</td>
            <td>${a.callsign}</td>
            <td>${A(a.status)}</td>
            <td>${v(a)}</td>
            <td>${b(a)}</td>
            <td>${E(a.duration_days,e,a.from_date_estimated)}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>
  `}function T(){const t=p("start-date",D(7)),e=p("end-date",y());return d.listChanges(t,e).then(a=>{C=a,i()})}function w(t){const e=l(o),a=[];t.from_date&&a.push(`<p>${e.since}: ${v(t)}</p>`),t.to_date&&a.push(`<p>${e.endDate}: ${b({to_date:t.to_date})}</p>`);const s=t.to_date??y(),n=E(P(t.from_date,s),e,t.from_date_estimated);return n&&a.push(`<p>${e.duration}: ${n}</p>`),a.join("")}function p(t,e){return document.querySelector(`#${t}`)?.value||e}function v(t){return t.from_date===null?"":t.from_date_estimated?`< ${t.from_date}`:t.from_date}function b(t){return t.to_date==="NOW"?l(o).active:t.to_date}function A(t){return l(o).statusText[t]}function m(t){c=t instanceof Error?t.message:String(t),i()}function j(t){return t.replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]??e)}
