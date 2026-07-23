const app=document.querySelector("#adminApp"),escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const show=value=>{const toast=document.querySelector("#toast");toast.textContent=value;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2500)};
const reason=()=>prompt("Document the reason for this moderation decision:");
const section=(title,items,render)=>`<section class="tool-card wide"><div class="tool-head"><h2>${title}</h2><span>${items.length}</span></div>${items.length?`<div class="admin-table">${items.map(render).join("")}</div>`:'<div class="empty">Queue is clear.</div>'}</section>`;

async function act(callback){
  try{await callback();show("Decision recorded");await load()}catch(error){show(error.message)}
}
async function load(){
  app.innerHTML='<main class="dashboard"><div class="empty">Loading moderation queue…</div></main>';
  try{
    await RoomBridgeAPI.me();const q=await RoomBridgeAPI.adminQueue();
    app.innerHTML=`<div class="shell"><header class="topbar"><div class="brand"><span class="brand-mark">⌂</span> RoomBridge Moderation</div><a href="/">Return to app</a></header><main class="dashboard"><section class="welcome"><div><span class="eyebrow">Restricted workspace</span><h1>Safety review queue</h1><p>Every decision requires a reason and is written to the moderation audit log.</p></div><button class="btn btn-ghost" id="refresh">Refresh</button></section><div class="life-grid">
      ${section("Reports",q.reports,x=>`<div><span>${escapeHtml(x.category)}</span><strong>${escapeHtml(x.target_type)} · ${escapeHtml(x.target_id)}</strong><span class="risk ${escapeHtml(x.risk)}">${escapeHtml(x.risk)}</span><button data-report="${x.id}">Review</button></div>`)}
      ${section("Listings",q.listings,x=>`<div><span>Listing</span><strong>${escapeHtml(x.title)} · ${escapeHtml(x.city)}</strong><span class="risk">pending</span><button data-listing="${x.id}">Decide</button></div>`)}
      ${section("Verifications",q.verifications,x=>`<div><span>${escapeHtml(x.subject_type)}</span><strong>${escapeHtml(x.subject_id||x.user_id)}</strong><span class="risk">private</span><button data-verification="${x.id}">Decide</button></div>`)}
      ${section("Appeals",q.appeals,x=>`<div><span>Appeal</span><strong>${escapeHtml(x.statement).slice(0,100)}</strong><span class="risk">pending</span><button data-appeal="${x.id}">Decide</button></div>`)}
      ${section("Quarantined uploads",q.uploads,x=>`<div><span>${escapeHtml(x.purpose)}</span><strong>${escapeHtml(x.filename)}</strong><span class="risk ${x.status==='rejected'?'critical':''}">${escapeHtml(x.status)}</span><span>${Math.round(Number(x.byte_size)/1000)} KB</span></div>`)}
    </div></main></div>`;
    document.querySelector("#refresh").onclick=load;
    document.querySelectorAll("[data-report]").forEach(button=>button.onclick=()=>{const status=prompt("Status: reviewing, resolved, dismissed, or escalated","reviewing"),why=reason();if(status&&why)act(()=>RoomBridgeAPI.moderateReport(button.dataset.report,{status,reason:why}))});
    document.querySelectorAll("[data-listing]").forEach(button=>button.onclick=()=>{const status=prompt("Status: active, rejected, or removed","active"),why=reason();if(status&&why)act(()=>RoomBridgeAPI.moderateListing(button.dataset.listing,{status,reason:why}))});
    document.querySelectorAll("[data-verification]").forEach(button=>button.onclick=()=>{const status=prompt("Status: approved or rejected","approved"),why=reason();if(status&&why)act(()=>RoomBridgeAPI.moderateVerification(button.dataset.verification,{status,reason:why}))});
    document.querySelectorAll("[data-appeal]").forEach(button=>button.onclick=()=>{const status=prompt("Status: approved or denied","denied"),why=reason();if(status&&why)act(()=>RoomBridgeAPI.decideAppeal(button.dataset.appeal,{status,reason:why}))});
  }catch(error){app.innerHTML=`<main class="hero"><section class="auth-card"><h2>Moderation access unavailable</h2><p>${escapeHtml(error.message)}</p><a href="/">Return to RoomBridge</a></section></main>`}
}
load();
