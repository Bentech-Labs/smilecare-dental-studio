document.querySelectorAll("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());
const cfg=window.SMILECARE_CONFIG||{};
const dateInput=document.getElementById("preferred-date");
if(dateInput){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());dateInput.min=d.toISOString().slice(0,10);}
const serviceSelect=document.getElementById("service-select");
if(serviceSelect){const val=new URLSearchParams(location.search).get("service");if(val){const option=[...serviceSelect.options].find(o=>o.text.toLowerCase()===val.toLowerCase());if(option)serviceSelect.value=option.value;}}
const googleLink=document.getElementById("google-review-link");
if(googleLink){if(cfg.googleReviewUrl){googleLink.href=cfg.googleReviewUrl;}else{googleLink.href="#";googleLink.addEventListener("click",e=>{e.preventDefault();alert("The clinic's Google review URL has not been configured yet.");});}}
async function handleForm(form){
 const status=form.querySelector(".form-status");const submit=form.querySelector('button[type="submit"]');
 if(!form.reportValidity())return;
 const data=Object.fromEntries(new FormData(form).entries());data.formType=form.dataset.form;data.submittedAt=new Date().toISOString();data.source=new URLSearchParams(location.search).get("source")||"website";
 const url=form.dataset.form==="appointment"?cfg.appointmentWebhookUrl:cfg.reviewWebhookUrl;
 submit.disabled=true;submit.textContent="Submitting…";status.className="form-status";status.textContent="";
 try{
   if(url){
     const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
     if(!response.ok)throw new Error("The form could not be submitted. Please try again or contact the clinic.");
     status.classList.add("success");status.textContent=form.dataset.form==="appointment"?"Your appointment request has been sent. The clinic will contact you to confirm the slot.":"Thank you. Your feedback has been received.";
     form.reset();
   }else{
     status.classList.add("success");status.textContent="Demo mode: your form is working, but it has not been sent or stored. Configure the n8n webhook URL in config.js before launch.";
   }
 }catch(err){status.classList.add("error");status.textContent=err.message||"Something went wrong. Please try again.";}
 finally{submit.disabled=false;submit.textContent=form.dataset.form==="appointment"?"Send appointment request →":"Submit feedback →";}
}
document.querySelectorAll("form[data-form]").forEach(form=>form.addEventListener("submit",e=>{e.preventDefault();handleForm(form);}));
