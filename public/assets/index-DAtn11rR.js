(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function a(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=a(n);fetch(n.href,r)}})();class H{worker=new Worker(new URL("/assets/db.worker-7xsxtYFK.js",import.meta.url),{type:"module"});nextId=1;pending=new Map;constructor(){this.worker.onmessage=e=>{const a=this.pending.get(e.data.id);a&&(this.pending.delete(e.data.id),e.data.ok?a.resolve(e.data.data):a.reject(new Error(e.data.error)))}}init(e){return this.request({type:"init",dbUrl:e})}lookupCallsign(e){return this.request({type:"lookupCallsign",callsign:e})}searchPrefix(e,a=8){return this.request({type:"searchPrefix",prefix:e,limit:a})}listChanges(e,a){return this.request({type:"listChanges",start:e,end:a})}request(e){const a=this.nextId++,s={...e,id:a};return new Promise((n,r)=>{this.pending.set(a,{resolve:n,reject:r}),this.worker.postMessage(s)})}}const K=1440*60*1e3;function L(){return T(new Date)}function R(t){const e=new Date;return e.setUTCDate(e.getUTCDate()-t),T(e)}function T(t){return t.toISOString().slice(0,10)}function O(t,e){if(t===null||e===null)return null;const a=Date.parse(`${t}T00:00:00Z`),s=Date.parse(`${e}T00:00:00Z`);return Number.isNaN(a)||Number.isNaN(s)?null:Math.max(0,Math.round((s-a)/K))}function _(t,e,a=!1){if(t===null)return"";const s=a?"> ":"";if(t<60)return s+e.days.replace("{n}",String(t));if(t<365)return s+e.months.replace("{n}",String(Math.max(1,Math.round(t/30))));const n=Math.floor(t/365),r=Math.round((t-n*365)/30);return s+e.yearsMonths.replace("{years}",String(n)).replace("{months}",String(r))}const U={fi:{appTitle:"Koolitutka",appSubtitle:"Radioamatöörikutsujen tila ja historia",searchLabel:"Kutsu",searchPlaceholder:"Esim. OH2AD",searchButton:"Hae",loading:"Ladataan tietokantaa...",error:"Virhe",available:"Vapaa",currentStatus:"Nykytila",history:"Historia",related:"Läheiset kutsut",changes:"Muutokset",from:"Alkaen",to:"Päättyen",update:"Päivitä",noRows:"Ei näytettäviä rivejä.",callsign:"Kutsu",status:"Tila",startDate:"Alkupäivä",since:"Alkaen",endDate:"Loppupäivä",active:"voimassa",date:"Päivä",change:"Muutos",duration:"Kesto",started:"alkoi",ended:"päättyi",metadata:"Päivitetty {updated}",language:"Kieli",close:"Sulje",statusText:{VOIMASSA:"Voimassa",VARAUS:"Varaus",KARENSSI:"Karenssi",VAPAA:"Vapaa"},days:"{n} pv",months:"{n} kk",yearsMonths:"{years} v {months} kk"},sv:{appTitle:"Koolitutka",appSubtitle:"Status och historik för radioamatöranropssignaler",searchLabel:"Anropssignal",searchPlaceholder:"T.ex. OH2AD",searchButton:"Sök",loading:"Laddar databasen...",error:"Fel",available:"Ledig",currentStatus:"Nuvarande status",history:"Historik",related:"Relaterade anropssignaler",changes:"Ändringar",from:"Från",to:"Till",update:"Uppdatera",noRows:"Inga rader att visa.",callsign:"Anropssignal",status:"Status",startDate:"Startdatum",since:"Sedan",endDate:"Slutdatum",active:"aktiv",date:"Datum",change:"Ändring",duration:"Varaktighet",started:"började",ended:"slutade",metadata:"Uppdaterad {updated}",language:"Språk",close:"Stäng",statusText:{VOIMASSA:"I kraft",VARAUS:"Reserverad",KARENSSI:"Karenstid",VAPAA:"Ledig"},days:"{n} d",months:"{n} mån",yearsMonths:"{years} år {months} mån"},en:{appTitle:"Koolitutka",appSubtitle:"Amateur radio callsign status and history",searchLabel:"Callsign",searchPlaceholder:"E.g. OH2AD",searchButton:"Search",loading:"Loading database...",error:"Error",available:"Available",currentStatus:"Current status",history:"History",related:"Related callsigns",changes:"Changes",from:"From",to:"To",update:"Update",noRows:"No rows to show.",callsign:"Callsign",status:"Status",startDate:"Start date",since:"Since",endDate:"End date",active:"active",date:"Date",change:"Change",duration:"Duration",started:"started",ended:"ended",metadata:"Updated {updated}",language:"Language",close:"Close",statusText:{VOIMASSA:"Active",VARAUS:"Reserved",KARENSSI:"Cooldown",VAPAA:"Available"},days:"{n} d",months:"{n} mo",yearsMonths:"{years} y {months} mo"}},y=["fi","sv","en"];function j(t,e="fi"){for(const a of t){const s=a.toLowerCase().split("-")[0];if(y.includes(s))return s}return e}function u(t){return U[t]}function B(t,e){return t.replace(/\{([^}]+)\}/g,(a,s)=>String(e[s]??""))}function m(t){return t.trim().toUpperCase().replace(/\s+/g,"")}const M=/^\d{4}-\d{2}-\d{2}$/;function P(t){const e=t.startsWith("#")?t.slice(1):t,a=new URLSearchParams(e),s=a.get("lang"),n=a.get("start"),r=a.get("end"),c=m(a.get("q")??"");return{q:c.length>0?c:null,start:n&&M.test(n)?n:null,end:r&&M.test(r)?r:null,language:s&&y.includes(s)?s:null}}function F(t){const e=new URLSearchParams,a=m(t.q??"");return a.length>0&&e.set("q",a),e.set("start",t.start),e.set("end",t.end),e.set("lang",t.language),`#${e.toString()}`}const S=new H,v=P(location.hash),b=localStorage.getItem("language");let o=v.language??(b&&y.includes(b)?b:null)??j(navigator.languages),d=v.start??R(7),g=v.end??L(),h=v.q,A=null,i=null,w=[],k=!0,$=null;const I=document.querySelector("#app");if(!I)throw new Error("Missing app root");window.addEventListener("hashchange",()=>{G(location.hash)});l();S.init("/koolitutka.sqlite").then(t=>(A=t,k=!1,p(),V())).catch(t=>{k=!1,$=t instanceof Error?t.message:String(t),l()});function l(){const t=u(o);document.documentElement.lang=o,I.innerHTML=`
    <main class="shell">
      <header class="topbar">
        <div>
          <h1>${t.appTitle}</h1>
          <p>${t.appSubtitle}</p>
        </div>
        <label class="language">
          <span>${t.language}</span>
          <select id="language-select">
            ${y.map(e=>`<option value="${e}" ${e===o?"selected":""}>${e.toUpperCase()}</option>`).join("")}
          </select>
        </label>
      </header>

      ${A?`<p class="metadata">${B(t.metadata,{updated:A.updated})}</p>`:""}
      ${k?`<p class="notice">${t.loading}</p>`:""}
      ${$?`<p class="notice error">${t.error}: ${J($)}</p>`:""}

      <section class="search-panel">
        <form id="search-form" class="search-form">
          <label for="callsign">${t.searchLabel}</label>
          <input id="callsign" name="callsign" autocomplete="off" placeholder="${t.searchPlaceholder}" value="${i?.callsign??""}" />
          <button type="submit">${t.searchButton}</button>
        </form>
        <div id="suggestions" class="suggestions"></div>
      </section>

      ${i?Y(i):""}

      <section class="changes-panel">
        <div class="section-header">
          <h2>${t.changes}</h2>
          <form id="changes-form" class="date-form">
            <label>${t.from}<input type="date" id="start-date" value="${d}" /></label>
            <label>${t.to}<input type="date" id="end-date" value="${g}" /></label>
            <button type="submit">${t.update}</button>
          </form>
        </div>
        ${Z(w)}
      </section>
    </main>
  `,W()}function W(){document.querySelector("#language-select")?.addEventListener("change",t=>{o=t.currentTarget.value,localStorage.setItem("language",o),p(),l()}),document.querySelector("#search-form")?.addEventListener("submit",t=>{t.preventDefault();const e=document.querySelector("#callsign"),a=m(e?.value??"");a.length!==0&&N(a).then(()=>{p(),l()}).catch(f)}),document.querySelector("#callsign")?.addEventListener("input",t=>{const e=m(t.currentTarget.value),a=document.querySelector("#suggestions");if(!a||e.length<2){a&&(a.innerHTML="");return}S.searchPrefix(e).then(s=>{a.innerHTML=s.map(n=>`<button type="button" data-callsign="${n.callsign}">${n.callsign}</button>`).join(""),a.querySelectorAll("button").forEach(n=>{n.addEventListener("click",()=>{const r=document.querySelector("#callsign");r&&(r.value=n.dataset.callsign??""),document.querySelector("#search-form")?.requestSubmit()})})}).catch(f)}),document.querySelector("#changes-form")?.addEventListener("submit",t=>{t.preventDefault(),d=document.querySelector("#start-date")?.value||d,g=document.querySelector("#end-date")?.value||g,p(),x().catch(f)}),document.querySelector("#close-lookup")?.addEventListener("click",()=>{i=null,h=null;const t=document.querySelector("#callsign");t&&(t.value=""),p(),l()})}function Y(t){const e=u(o),a=t.current;return`
    <section class="lookup-grid">
      <article class="status-card status-${a.status.toLowerCase()}">
        <div class="card-header">
          <h2>${e.currentStatus}</h2>
          <button id="close-lookup" class="icon-button" type="button" aria-label="${e.close}" title="${e.close}">×</button>
        </div>
        <div class="status-line">${a.callsign}: ${E(a.status)}</div>
        ${z(a)}
      </article>
      <article>
        <h2>${e.history}</h2>
        ${C(t.history)}
      </article>
      <article>
        <h2>${e.related}</h2>
        ${C(t.related)}
      </article>
    </section>
  `}function C(t){const e=u(o);return t.length===0?`<p class="empty">${e.noRows}</p>`:`
    <div class="table-wrap">
      <table>
        <thead><tr><th>${e.callsign}</th><th>${e.status}</th><th>${e.startDate}</th><th>${e.endDate}</th></tr></thead>
        <tbody>${t.map(a=>`
          <tr>
            <td>${a.callsign}</td>
            <td>${E(a.status)}</td>
            <td>${q(a)}</td>
            <td>${D(a)}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>
  `}function Z(t){const e=u(o);return t.length===0?`<p class="empty">${e.noRows}</p>`:`
    <div class="table-wrap">
      <table>
        <thead><tr><th>${e.date}</th><th>${e.change}</th><th>${e.callsign}</th><th>${e.status}</th><th>${e.startDate}</th><th>${e.endDate}</th><th>${e.duration}</th></tr></thead>
        <tbody>${t.map(a=>`
          <tr>
            <td>${a.change_date}</td>
            <td>${a.change_type==="start"?e.started:e.ended}</td>
            <td>${a.callsign}</td>
            <td>${E(a.status)}</td>
            <td>${q(a)}</td>
            <td>${D(a)}</td>
            <td>${_(a.duration_days,e,a.from_date_estimated)}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>
  `}function x(){return S.listChanges(d,g).then(t=>{w=t,l()})}function z(t){const e=u(o),a=[];t.from_date&&a.push(`<p>${e.since}: ${q(t)}</p>`),t.to_date&&a.push(`<p>${e.endDate}: ${D({to_date:t.to_date})}</p>`);const s=t.to_date??L(),n=_(O(t.from_date,s),e,t.from_date_estimated);return n&&a.push(`<p>${e.duration}: ${n}</p>`),a.join("")}function N(t){return h=t,S.lookupCallsign(t).then(e=>{i=e})}function V(){return x().then(()=>{if(h===null){i=null,l();return}return N(h).then(l)})}function p(){const t=F({q:i?.callsign??h,start:d,end:g,language:o});location.hash!==t&&history.replaceState(null,"",t)}function G(t){const e=P(t);o=e.language??o,d=e.start??R(7),g=e.end??L(),h=e.q,V().catch(f)}function q(t){return t.from_date===null?"":t.from_date_estimated?`< ${t.from_date}`:t.from_date}function D(t){return t.to_date==="NOW"?u(o).active:t.to_date}function E(t){return u(o).statusText[t]}function f(t){$=t instanceof Error?t.message:String(t),l()}function J(t){return t.replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]??e)}
