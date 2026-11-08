/*
 * SmileCare dashboard frontend.
 * IMPORTANT: This starter uses one shared Firebase email/password clinic account.
 * Configure Firebase and the authenticated n8n API endpoints before deployment.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const FIREBASE_CONFIG = {
  apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_FIREBASE_PROJECT_ID",
  appId: "REPLACE_WITH_FIREBASE_APP_ID"
};

// Configure these as n8n production webhook URLs after creating the dashboard API branch.
const API = {
  dashboard: "REPLACE_WITH_N8N_DASHBOARD_READ_WEBHOOK",
  updateAppointment: "REPLACE_WITH_N8N_APPOINTMENT_UPDATE_WEBHOOK"
};

const $ = id => document.getElementById(id);
const firebaseReady = Object.values(FIREBASE_CONFIG).every(v => v && !v.startsWith("REPLACE_"));
let auth = null;
let data = { appointments: [], reviews: [], patients: [] };
let currentUser = null;

if (firebaseReady) {
  const app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
} else {
  $("login-error").textContent = "Setup required: add your Firebase project settings before staff can sign in.";
  $("login-form").querySelector("button").disabled = true;
}

$("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!auth) return;
  $("login-error").textContent = "";
  try {
    await signInWithEmailAndPassword(auth, $("login-email").value.trim(), $("login-password").value);
  } catch (err) {
    $("login-error").textContent = "Sign-in failed. Check your email and password or contact the clinic administrator.";
  }
});

$("signout").addEventListener("click", () => auth && signOut(auth));
$("refresh").addEventListener("click", loadDashboard);

if (auth) onAuthStateChanged(auth, async user => {
  currentUser = user;
  $("login-screen").classList.toggle("hidden", !!user);
  $("app").classList.toggle("hidden", !user);
  if (user) {
    $("staff-email").textContent = user.email || "Clinic account";
    $("staff-name").textContent = "Clinic account";
    $("avatar").textContent = ("C").charAt(0).toUpperCase();
    await loadDashboard();
  }
});

async function apiFetch(url, options = {}) {
  if (!currentUser) throw new Error("Please sign in again.");
  if (!url || url.startsWith("REPLACE_")) throw new Error("Dashboard API is not configured yet.");
  const token = await currentUser.getIdToken();
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(`Dashboard API returned ${response.status}.`);
  return response.json();
}

async function loadDashboard() {
  $("notice").classList.add("hidden");
  try {
    const result = await apiFetch(API.dashboard, { method: "POST", body: JSON.stringify({ action: "dashboard" }) });
    data = {
      appointments: result.appointments || [],
      reviews: result.reviews || [],
      patients: result.patients || []
    };
    renderAll();
  } catch (err) {
    $("notice").textContent = `${err.message} The dashboard layout is ready; connect the authenticated n8n API before using live clinic data.`;
    $("notice").classList.remove("hidden");
  }
}

function renderAll() {
  const a = data.appointments, r = data.reviews, p = data.patients;
  $("stat-appointments").textContent = a.length;
  $("stat-patients").textContent = p.length || uniquePatients(a).length;
  $("stat-reviews").textContent = r.length;
  const ratings = r.map(x => Number(x["Rating (1–5)"])).filter(x => x >= 1 && x <= 5);
  $("stat-rating").textContent = ratings.length ? (ratings.reduce((s,x)=>s+x,0)/ratings.length).toFixed(1) : "—";
  $("report-appointments").textContent = a.length;
  $("report-confirmed").textContent = a.filter(x => norm(x.Status) === "confirmed").length;
  $("report-reviews").textContent = r.length;
  $("report-rating").textContent = $("stat-rating").textContent;
  $("today").textContent = new Date().toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short",year:"numeric"});
  $("recent-appointments").innerHTML = appointmentTable(a.slice(-5).reverse(), false);
  $("appointments-table").innerHTML = appointmentTable(filterAppointments(), true);
  $("recent-reviews").innerHTML = reviewCards(r.slice(-4).reverse());
  $("reviews-table").innerHTML = reviewTable(filterReviews());
  $("patients-table").innerHTML = patientTable(filterPatients());
}
function norm(v){return String(v||"").toLowerCase().trim()}
function uniquePatients(rows) {
  const map = new Map();
  rows.forEach(x => { const key = x["Patient ID"] || x.Phone || x.Email || x["Patient Name"]; if(key) map.set(key,x); });
  return [...map.values()];
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function appointmentTable(rows, editable) {
  if (!rows.length) return '<div class="empty">No appointment records found.</div>';
  return `<table><thead><tr><th>Patient</th><th>Service</th><th>Date</th><th>Time</th><th>Status</th>${editable?'<th>Update</th>':''}</tr></thead><tbody>${rows.map(x=>{
    const id=x["Booking ID"]||x.bookingId||"";
    return `<tr><td><b>${esc(x["Patient Name"]||x.patientName||x["Name"]||"—")}</b><br>${esc(x.Phone||x.phone||"")}</td><td>${esc(x.Service||x.service||"—")}</td><td>${esc(x["Preferred Date"]||x.preferredDate||"—")}</td><td>${esc(x["Preferred Time"]||x.preferredTime||"—")}</td><td><span class="status ${norm(x.Status)}">${esc(x.Status||"—")}</span></td>${editable?`<td><select class="action-select" data-booking="${esc(id)}"><option value="">Change status</option><option>Confirmed</option><option>Pending</option><option>Cancelled</option></select></td>`:''}</tr>`;
  }).join("")}</tbody></table>`;
}
function reviewCards(rows){return rows.length?rows.map(x=>`<div class="review-item"><b>${esc(x.Name||x.name||"Patient")}</b> <span class="stars">${"★".repeat(Math.max(0,Math.min(5,Number(x["Rating (1–5)"]||x.rating)||0)))}</span><p>${esc(x.Feedback||x.feedback||"")}</p></div>`).join(""):'<div class="empty">No reviews yet.</div>'}
function reviewTable(rows){return rows.length?`<table><thead><tr><th>Patient</th><th>Rating</th><th>Feedback</th><th>Date</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.Name||x.name||"Anonymous")}</td><td><span class="stars">${"★".repeat(Number(x["Rating (1–5)"]||x.rating)||0)}</span></td><td>${esc(x.Feedback||x.feedback||"")}</td><td>${esc(x["Submitted At"]||x.submittedAt||"—")}</td></tr>`).join("")}</tbody></table>`:'<div class="empty">No reviews found.</div>'}
function patientTable(rows){const patients=uniquePatients(rows);return patients.length?`<table><thead><tr><th>Patient</th><th>Phone</th><th>Email</th><th>Last service</th></tr></thead><tbody>${patients.map(x=>`<tr><td>${esc(x["Patient Name"]||x.patientName||x.Name||"—")}</td><td>${esc(x.Phone||x.phone||"—")}</td><td>${esc(x.Email||x.email||"—")}</td><td>${esc(x.Service||x.service||"—")}</td></tr>`).join("")}</tbody></table>`:'<div class="empty">No patient records found.</div>'}
function filterAppointments(){const q=norm($("appointment-search").value),s=norm($("appointment-status").value);return data.appointments.filter(x=>(!s||norm(x.Status)===s)&&(!q||[x["Patient Name"],x.patientName,x.Phone,x.phone,x["Booking ID"]].some(v=>norm(v).includes(q))))}
function filterReviews(){const q=norm($("review-search").value),rating=$("rating-filter").value;return data.reviews.filter(x=>(!rating||String(x["Rating (1–5)"]||x.rating)===rating)&&(!q||[x.Name,x.name,x.Feedback,x.feedback].some(v=>norm(v).includes(q))))}
function filterPatients(){const q=norm($("patient-search").value);return uniquePatients(data.appointments).filter(x=>!q||[x["Patient Name"],x.patientName,x.Name,x.Phone,x.phone,x.Email,x.email].some(v=>norm(v).includes(q)))}

document.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.goto)));
function showView(view){document.querySelectorAll(".view").forEach(el=>el.classList.add("hidden"));$("view-"+view).classList.remove("hidden");document.querySelectorAll(".nav-link").forEach(el=>el.classList.toggle("active",el.dataset.view===view));$("page-title").textContent=view.charAt(0).toUpperCase()+view.slice(1);if(view==="appointments")$("appointments-table").innerHTML=appointmentTable(filterAppointments(),true)}
["appointment-search","appointment-status"].forEach(id=>$(id).addEventListener("input",()=>{$("appointments-table").innerHTML=appointmentTable(filterAppointments(),true)}));
["review-search","rating-filter"].forEach(id=>$(id).addEventListener("input",()=>{$("reviews-table").innerHTML=reviewTable(filterReviews())}));
$("patient-search").addEventListener("input",()=>{$("patients-table").innerHTML=patientTable(filterPatients())});
$("appointments-table").addEventListener("change",async e=>{
  const select=e.target.closest("select[data-booking]"); if(!select||!select.value)return;
  const bookingId=select.dataset.booking, status=select.value;
  try{
    await apiFetch(API.updateAppointment,{method:"POST",body:JSON.stringify({action:"updateAppointmentStatus",bookingId,status})});
    const row=data.appointments.find(x=>(x["Booking ID"]||x.bookingId)===bookingId); if(row)row.Status=status;
    renderAll(); showView("appointments");
    $("notice").textContent=`Appointment ${bookingId} updated to ${status}.`;$("notice").classList.remove("hidden");
  }catch(err){$("notice").textContent=err.message;$("notice").classList.remove("hidden");}
});


// Show the install button when the browser offers PWA installation.
let installPrompt = null;
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  const button = $("install-app");
  if (button) button.classList.remove("hidden");
});
const installButton = $("install-app");
if (installButton) installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.classList.add("hidden");
});
window.addEventListener("appinstalled", () => {
  const button = $("install-app");
  if (button) button.classList.add("hidden");
});
