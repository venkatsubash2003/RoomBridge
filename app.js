const demoProfiles = [
  { id: 1, name: "Ananya Rao", initials: "AR", age: 24, status: "STEM OPT", country: "India", city: "Jersey City, NJ", budget: 1250, move: "Aug 1", room: "Private room", need: "Looking for a new apartment", people: 2, diet: "Vegetarian", languages: ["Telugu", "Hindi", "English"], traits: ["Non-smoker", "Early riser", "Clean"], color: "#ffd9b8" },
  { id: 2, name: "Miguel Santos", initials: "MS", age: 27, status: "H-1B", country: "Philippines", city: "New York, NY", budget: 1450, move: "Jul 25", room: "Shared room", need: "Needs a roommate for his apartment", people: 1, diet: "Non-vegetarian", languages: ["English", "Tagalog"], traits: ["No pets", "Social", "Night owl"], color: "#cce6ff" },
  { id: 3, name: "Priya Shah", initials: "PS", age: 25, status: "OPT", country: "India", city: "Jersey City, NJ", budget: 1350, move: "Aug 15", room: "Private room", need: "Taking over a lease", people: 2, diet: "Vegetarian", languages: ["Gujarati", "Hindi", "English"], traits: ["Non-smoker", "Quiet", "Clean"], color: "#e2d5ff" },
  { id: 4, name: "David Kim", initials: "DK", age: 29, status: "H-1B", country: "South Korea", city: "Hoboken, NJ", budget: 1600, move: "Sep 1", room: "Private room", need: "Has one room available", people: 1, diet: "Non-vegetarian", languages: ["Korean", "English"], traits: ["Pet-friendly", "Clean", "Hybrid work"], color: "#cdebd4" },
  { id: 5, name: "Fatima Noor", initials: "FN", age: 23, status: "Student", country: "Pakistan", city: "Newark, NJ", budget: 900, move: "Aug 20", room: "Shared room", need: "Looking for a new apartment", people: 3, diet: "Halal", languages: ["Urdu", "English"], traits: ["Non-smoker", "Quiet", "Student"], color: "#ffdcdf" },
  { id: 6, name: "Arjun Mehta", initials: "AM", age: 28, status: "STEM OPT", country: "India", city: "Hoboken, NJ", budget: 1300, move: "Aug 1", room: "Private room", need: "Needs a lease replacement", people: 1, diet: "Vegetarian", languages: ["Hindi", "English"], traits: ["Non-smoker", "Gym", "Early riser"], color: "#ffe9a8" }
];

const state = {
  screen: localStorage.getItem("rbUser") ? "dashboard" : "auth",
  step: 1,
  filter: "All matches",
  saved: JSON.parse(localStorage.getItem("rbSaved") || "[]"),
  user: JSON.parse(localStorage.getItem("rbUser") || "null")
};
const app = document.querySelector("#app");
const icon = (name) => ({ home:"⌂", spark:"✦", chat:"◌", shield:"✓", pin:"⌖", heart:"♡" }[name] || "•");

function render() {
  if (state.screen === "auth") renderAuth();
  else if (state.screen === "onboard") renderOnboard();
  else renderDashboard();
}

function brand() { return `<div class="brand"><span class="brand-mark">⌂</span> RoomBridge</div>`; }

function renderAuth() {
  app.innerHTML = `<main class="hero">
    ${brand()}
    <section class="hero-copy">
      <span class="eyebrow">Built for life abroad</span>
      <h1>Find your people.<br>Feel at home.</h1>
      <p>Compatible roommates and trusted housing for international students and professionals—matched around the things that make living together work.</p>
      <div class="trust-row"><span><b>✓</b> Compatibility matching</span><span><b>✓</b> Community focused</span><span><b>✓</b> Privacy first</span></div>
    </section>
    <section class="auth-wrap">
      <form class="auth-card" id="registerForm">
        <h2>Create your account</h2><p class="subtext">Your next home starts with the right connection.</p>
        <div class="fields">
          <label>Full name<input name="name" required placeholder="Your full name" autocomplete="name"></label>
          <label>Email address<input name="email" required type="email" placeholder="you@example.com" autocomplete="email"></label>
          <label>Password<input name="password" required type="password" minlength="6" placeholder="At least 6 characters" autocomplete="new-password"></label>
        </div>
        <button class="btn btn-primary btn-wide">Create account <span>→</span></button>
        <p class="fine">By continuing, you agree to our community guidelines and privacy policy.</p>
      </form>
    </section>
  </main>`;
  document.querySelector("#registerForm").addEventListener("submit", e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    state.user = { name: data.name, email: data.email };
    state.screen = "onboard";
    render();
  });
}

function choices(name, items, selected) {
  return `<div class="choice-grid">${items.map(([value, desc]) => `<label class="choice ${selected===value?'selected':''}"><input type="radio" name="${name}" value="${value}" ${selected===value?'checked':''} required><strong>${value}</strong><small>${desc}</small></label>`).join("")}</div>`;
}

function renderOnboard() {
  const titles = ["What brings you here?", "Tell us what you need", "A little about you"];
  let content = "";
  if (state.step === 1) content = `${choices("scenario", [["Find a new home","Find a place and roommates"],["Find a roommate","Share your current room"],["Fill an available room","Rent a room in your home"],["Find my replacement","Transfer my spot or lease"]], state.user.scenario)}`;
  if (state.step === 2) content = `<div class="grid-2">
      <label>Preferred location<input name="city" required value="${state.user.city||''}" placeholder="e.g. Jersey City, NJ"></label>
      <label>Monthly budget (USD)<input name="budget" required type="number" min="200" value="${state.user.budget||''}" placeholder="1200"></label>
      <label>Room preference<select name="room" required><option>Private room</option><option>Shared room</option><option>Either works</option></select></label>
      <label>People you want to live with<select name="people" required><option>1</option><option>2</option><option>3</option><option>4+</option></select></label>
      <label>Move-in date<input name="move" required type="date" value="${state.user.move||''}"></label>
      <label>Stay duration<select name="duration"><option>12+ months</option><option>6–12 months</option><option>3–6 months</option><option>Flexible</option></select></label>
    </div>`;
  if (state.step === 3) content = `<div class="grid-2">
      <label>Immigration / work status<select name="status"><option>International student</option><option>OPT</option><option>STEM OPT</option><option>H-1B</option><option>Other</option><option>Prefer not to say</option></select></label>
      <label>Country<input name="country" required value="${state.user.country||''}" placeholder="Country you call home"></label>
      <label>Food preference<select name="diet"><option>Vegetarian</option><option>Non-vegetarian</option><option>Vegan</option><option>Halal</option><option>No preference</option></select></label>
      <label>Languages<input name="languages" value="${state.user.languages||''}" placeholder="e.g. English, Hindi, Telugu"></label>
    </div><label style="margin-top:17px">Lifestyle & roommate preferences<textarea name="preferences" placeholder="Tell potential roommates about your schedule, cleanliness, pets, smoking, or anything important to you.">${state.user.preferences||''}</textarea></label>`;
  app.innerHTML = `<main class="onboard">
    <aside class="onboard-aside">${brand()}<div class="steps">${[1,2,3].map((n,i)=>`<div class="step ${state.step===n?'active':''} ${state.step>n?'done':''}"><span class="step-num">${state.step>n?'✓':n}</span><div><strong>${["Your housing goal","Home preferences","Your lifestyle"][i]}</strong><small>${["How can we help?","What works for you?","Find better matches"][i]}</small></div></div>`).join('')}</div></aside>
    <section class="onboard-main"><form class="form-card" id="profileForm">
      <div class="progress"><div style="width:${state.step*33.33}%"></div></div>
      <span class="eyebrow" style="color:var(--green)">Step ${state.step} of 3</span><h2>${titles[state.step-1]}</h2><p class="subtext">${["Choose the situation that best describes you.","These details help us find realistic, relevant matches.","Shared habits make a shared home feel easy."][state.step-1]}</p>
      ${content}
      <div class="actions">${state.step>1?'<button type="button" class="btn btn-ghost" id="back">← Back</button>':'<span></span>'}<button class="btn btn-primary">${state.step===3?'See my matches ✦':'Continue →'}</button></div>
    </form></section>
  </main>`;
  document.querySelectorAll(".choice").forEach(el => el.addEventListener("click", () => { document.querySelectorAll(".choice").forEach(x=>x.classList.remove("selected")); el.classList.add("selected"); }));
  document.querySelector("#back")?.addEventListener("click", () => { state.step--; render(); });
  document.querySelector("#profileForm").addEventListener("submit", e => {
    e.preventDefault(); Object.assign(state.user, Object.fromEntries(new FormData(e.target)));
    if (state.step < 3) { state.step++; render(); }
    else { localStorage.setItem("rbUser", JSON.stringify(state.user)); state.screen="dashboard"; render(); showToast("Your profile is live — welcome to RoomBridge!"); }
  });
}

function scoreProfile(p) {
  const u=state.user||{}; let score=58, reasons=[];
  if (u.city && p.city.toLowerCase().includes(u.city.split(',')[0].toLowerCase())) { score+=13; reasons.push("same area"); }
  const budget=Number(u.budget)||1300; if (Math.abs(p.budget-budget)<=200) { score+=10; reasons.push("budget aligns"); }
  if (u.room===p.room || u.room==="Either works") { score+=7; reasons.push("same room preference"); }
  if (u.diet===p.diet) { score+=6; reasons.push("food preferences match"); }
  const langs=(u.languages||"").toLowerCase().split(/,\s*/); if(p.languages.some(l=>langs.includes(l.toLowerCase()))) { score+=5; reasons.push("shared language"); }
  return { score:Math.min(score,97), reasons:reasons.length?reasons.slice(0,3):["similar housing goals","compatible lifestyle"] };
}

function renderDashboard() {
  const first=(state.user.name||"there").split(" ")[0];
  const filtered=demoProfiles.map(p=>({...p,...scoreProfile(p)})).sort((a,b)=>b.score-a.score).filter(p=> state.filter==="All matches" || (state.filter==="Under budget"&&p.budget<=Number(state.user.budget||1300)) || (state.filter==="Private room"&&p.room==="Private room") || (state.filter==="Saved"&&state.saved.includes(p.id)));
  app.innerHTML=`<div class="shell"><header class="topbar">${brand()}<nav class="nav"><button class="active">${icon('spark')} Discover</button><button>${icon('chat')} Connections</button><button id="myProfile">Profile</button></nav><div class="avatar">${(state.user.name||'RB').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div></header>
    <main class="dashboard"><section class="welcome"><div><h1>Good to see you, ${first}.</h1><p>We found people who could feel like the right fit.</p></div><div class="filters">${["All matches","Under budget","Private room","Saved"].map(f=>`<button class="filter ${state.filter===f?'active':''}" data-filter="${f}">${f}</button>`).join('')}</div></section>
    <div class="content-grid"><section><div class="section-head"><h2>Your best matches <span style="color:var(--green)">✦</span></h2><span>${filtered.length} people</span></div><div class="cards">${filtered.length?filtered.map(profileCard).join(''):'<div class="empty">No matches in this view yet. Try another filter.</div>'}</div></section>
    <aside class="sidebar"><div class="side-card"><h3>Your profile strength</h3><strong>82% complete</strong><div class="completion"><div></div></div><p>Add a photo and verify your email to build more trust.</p><button class="btn btn-secondary btn-wide" id="editProfile">Improve profile</button></div>
    <div class="side-card"><h3>Stay safe on RoomBridge</h3><div class="safe-list"><div class="safe-item"><span class="safe-icon">✓</span><span>Meet by video before committing.</span></div><div class="safe-item"><span class="safe-icon">$</span><span>Never send money before viewing a home.</span></div><div class="safe-item"><span class="safe-icon">⌂</span><span>Confirm the lease and landlord.</span></div></div></div></aside></div></main></div>`;
  document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;render()});
  document.querySelectorAll("[data-save]").forEach(b=>b.onclick=()=>toggleSave(Number(b.dataset.save)));
  document.querySelectorAll("[data-connect]").forEach(b=>b.onclick=()=>openConnect(Number(b.dataset.connect)));
  document.querySelector("#editProfile").onclick=()=>{state.step=1;state.screen="onboard";render()};
  document.querySelector("#myProfile").onclick=()=>{state.step=1;state.screen="onboard";render()};
}

function profileCard(p) {
  return `<article class="profile-card"><div class="card-top"><div class="person-avatar" style="background:${p.color}">${p.initials}</div><div class="person"><h3>${p.name}, ${p.age}</h3><p>${p.status} · ${p.country}</p><p>${icon('pin')} ${p.city}</p></div><div class="match">${p.score}%</div></div><div class="card-body"><div class="need">${p.need}</div><div class="meta"><div>Monthly budget<strong>$${p.budget.toLocaleString()}</strong></div><div>Move-in<strong>${p.move}</strong></div><div>Room type<strong>${p.room}</strong></div><div>Group size<strong>${p.people} ${p.people===1?'person':'people'}</strong></div></div><div class="tags">${[p.diet,...p.languages.slice(0,2),...p.traits.slice(0,2)].map(t=>`<span class="tag">${t}</span>`).join('')}</div><p class="why">✦ Strong match: ${p.reasons.join(" · ")}</p><div class="card-actions"><button class="btn ${state.saved.includes(p.id)?'btn-secondary':'btn-ghost'}" data-save="${p.id}">${state.saved.includes(p.id)?'♥ Saved':'♡ Save'}</button><button class="btn btn-primary" data-connect="${p.id}">Connect</button></div></div></article>`;
}

function toggleSave(id) { state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id]; localStorage.setItem("rbSaved",JSON.stringify(state.saved)); render(); showToast(state.saved.includes(id)?"Profile saved":"Removed from saved"); }
function openConnect(id) {
  const p=demoProfiles.find(x=>x.id===id);
  const modal=document.createElement("div"); modal.className="modal-backdrop";
  modal.innerHTML=`<div class="modal"><div class="modal-head"><div><span class="eyebrow" style="color:var(--green)">Start a conversation</span><h2>Connect with ${p.name.split(' ')[0]}</h2></div><button class="close">×</button></div><p class="subtext">A thoughtful introduction gets better replies.</p><div class="message-box">Hi ${p.name.split(' ')[0]}! I saw that we're both looking around ${p.city.split(',')[0]} and our housing preferences seem compatible. Would you be open to chatting about your plans?</div><label>Add a personal note<textarea id="note" placeholder="Mention your move date, schedule, or what matters to you..."></textarea></label><button class="btn btn-primary btn-wide" id="send">Send connection request →</button></div>`;
  document.body.appendChild(modal); modal.querySelector(".close").onclick=()=>modal.remove(); modal.onclick=e=>{if(e.target===modal)modal.remove()}; modal.querySelector("#send").onclick=()=>{modal.remove();showToast(`Connection request sent to ${p.name.split(' ')[0]}!`)};
}
function showToast(msg){const t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
render();
