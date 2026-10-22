(() => {
'use strict';
const $ = id => document.getElementById(id);
const STORAGE_KEY = 'amarSurerBhubon_v1';
let state = {version:1, notes:[], preferences:{base:'C',octave:'4',tone:'reed'}};
function loadState(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(s&&s.version===1)state={...state,...s};}catch(e){console.warn('Saved data could not be read',e)}}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){alert('সংরক্ষণ করা যায়নি। জায়গা খালি করুন বা ব্যাকআপ নিন।')}}
function uid(){return 'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function openPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===name));document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.page===name));window.scrollTo({top:0,behavior:'smooth'});if(name==='notebook')renderNotes();if(name==='learn')renderLessons();if(name==='harmonium')renderKeys()}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>openPage(b.dataset.page)));
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openPage(b.dataset.open)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>openPage(b.dataset.goto)));
function updateNetwork(){ $('network').textContent=navigator.onLine?'● অনলাইন':'● অফলাইন';$('network').style.background=navigator.onLine?'#13845d':'#8b5a25'}
window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);updateNetwork();

// Synthesized harmonium-like tones
let audioCtx=null, activeOscillators=[], beatTimer=null, beatIndex=0;
const notes=[['সা',0],['রে',2],['গা',4],['মা',5],['পা',7],['ধা',9],['নি',11],['সা′',12]];
const baseSemitones={C:0,D:2,E:4,F:5,G:7,A:9,Bb:10};
function getCtx(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}
function playNote(label,semi){
 const ctx=getCtx(), base=baseSemitones[$('baseNote').value]||0, oct=Number($('octave').value||4);
 const freq=440*Math.pow(2,((12*(oct-4)+base+semi)-9)/12);
 const gain=ctx.createGain();gain.gain.setValueAtTime(0.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.24,ctx.currentTime+.025);gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+1.25);gain.connect(ctx.destination);
 const osc=ctx.createOscillator();osc.type=$('tone').value==='sine'?'sine':'sawtooth';osc.frequency.value=freq;
 if(osc.type==='sawtooth'){const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1800;osc.connect(filter);filter.connect(gain)}else osc.connect(gain);
 osc.start();osc.stop(ctx.currentTime+1.3);activeOscillators.push(osc);osc.onended=()=>{activeOscillators=activeOscillators.filter(o=>o!==osc);gain.disconnect()};
 $('lastNote').textContent=`${label} বাজছে • ${freq.toFixed(1)} Hz`;
}
function renderKeys(){$('keys').innerHTML=notes.map(([label,semi],i)=>`<button class="key" data-semi="${semi}" data-label="${label}">${label}</button>`).join('');$('keys').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{b.classList.add('playing');playNote(b.dataset.label,Number(b.dataset.semi));setTimeout(()=>b.classList.remove('playing'),160)}))}
$('baseNote').addEventListener('change',()=>{state.preferences.base=$('baseNote').value;saveState()});
$('octave').addEventListener('change',()=>{state.preferences.octave=$('octave').value;saveState()});
$('tone').addEventListener('change',()=>{state.preferences.tone=$('tone').value;saveState()});
$('playScale').addEventListener('click',()=>{let i=0;const seq=[...notes,...notes.slice().reverse()];const step=()=>{if(i>=seq.length)return;playNote(seq[i][0],seq[i][1]);i++;setTimeout(step,420)};step()});
$('stopAudio').addEventListener('click',()=>{activeOscillators.forEach(o=>{try{o.stop()}catch(e){}});activeOscillators=[];$('lastNote').textContent='থামানো হয়েছে'});

// Lessons content
const lessons={
raga:[['ভূপালী','স্বর: সা রে গা পা ধা সা। মা ও নি বর্জিত।','সন্ধ্যার রাগ হিসেবে পরিচিত।'],['ইয়ামন','স্বর: নি রে গা মা♯ পা ধা নি সা।','তীব্র মা ব্যবহৃত হয়।'],['ভৈরবী','স্বরের কোমল রে, গা, ধা, নি ব্যবহৃত হয়।','শিক্ষার জন্য স্বর চিনে নিন; পরিবেশনা ভেদে প্রয়োগ আলাদা হতে পারে।'],['কাফি','কোমল গা ও কোমল নি প্রধান বৈশিষ্ট্য।','রাগের চলন শুনে ও গেয়ে অনুশীলন করুন।']],
taal:[['তিনতাল','১৬ মাত্রা: ৪ + ৪ + ৪ + ৪','তালি: ১, ৫, ১৩; খালি: ৯'],['দাদরা','৬ মাত্রা: ৩ + ৩','হালকা গান ও অনেক লোকগানে ব্যবহৃত।'],['কাহারবা','৮ মাত্রা: ৪ + ৪','গান ও ছন্দ অনুশীলনে বহুল ব্যবহৃত।'],['একতাল','১২ মাত্রা','শাস্ত্রীয় সংগীতে ব্যবহৃত একটি তাল।']],
lay:[['বিলম্বিত লয়','ধীর গতিতে সমান ব্যবধানে তাল দিন।','প্রথমে গুনুন, তারপর সুর যোগ করুন।'],['মধ্য লয়','স্বাভাবিক মাঝারি গতি।','তাল ও গানের উচ্চারণ পরিষ্কার রাখুন।'],['দ্রুত লয়','দ্রুত গতি, কিন্তু মাত্রা সমান রাখুন।','ধীরে নিখুঁত হলে গতি বাড়ান।']],
practice:[['স্বর সোজা','সা রে গা মা | পা ধা নি সা′','উঠে ও নেমে ধীরে ধীরে গাইুন।'],['আলংকার ১','সা রে | রে গা | গা মা | মা পা','সমান লয়ে পুনরাবৃত্তি করুন।'],['আলংকার ২','সা রে গা | রে গা মা | গা মা পা','প্রতিটি স্বর স্পষ্ট করে গাইুন।']]
};
function renderLessons(){const type=$('learnType').value; $('lessonList').innerHTML=lessons[type].map(x=>`<article class="lesson"><h3>${escapeHtml(x[0])}</h3><p>${escapeHtml(x[1])}</p><p class="muted small">${escapeHtml(x[2])}</p></article>`).join('')}
$('learnType').addEventListener('change',renderLessons);
const taalCounts={teentaal:16,dadra:6,keherwa:8,ektal:12};
function stopBeat(){if(beatTimer){clearInterval(beatTimer);beatTimer=null} $('startBeat').disabled=false}
$('startBeat').addEventListener('click',()=>{stopBeat();beatIndex=0;const bpm=Math.min(240,Math.max(30,Number($('bpm').value)||80));const count=taalCounts[$('taalSelect').value];$('startBeat').disabled=true;const tick=()=>{beatIndex=beatIndex%count+1;$('beatDisplay').innerHTML=`<strong>${beatIndex}</strong> / ${count}<br><span>${beatIndex===1?'সম (প্রথম মাত্রা)':(beatIndex===Math.floor(count/2)+1?'খালি / বিভাজন':'মাত্রা')}</span>`;try{const c=getCtx(),o=c.createOscillator(),g=c.createGain();o.frequency.value=beatIndex===1?950:650;g.gain.value=.09;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.06)}catch(e){}};tick();beatTimer=setInterval(tick,60000/bpm)});
$('stopBeat').addEventListener('click',()=>{stopBeat();$('beatDisplay').textContent='তাল থামানো হয়েছে'});$('taalSelect').addEventListener('change',()=>{stopBeat();$('beatDisplay').textContent='তাল শুরু করতে বোতাম চাপুন'});

// Notation CRUD
function renderNotes(){const q=($('noteSearch').value||'').toLowerCase();const list=state.notes.filter(n=>(n.title+' '+n.text+' '+n.raga).toLowerCase().includes(q));$('noteList').innerHTML=list.length?list.slice().sort((a,b)=>b.updated-a.updated).map(n=>`<article class="note-item"><h4>${escapeHtml(n.title)}</h4><div class="muted small">${escapeHtml(n.language)}${n.raga?' • '+escapeHtml(n.raga):''}${n.taal?' • '+escapeHtml(n.taal):''}</div><p>${escapeHtml(n.text)}</p><div class="item-actions"><button class="secondary" data-edit="${n.id}">✏️ সম্পাদনা</button><button class="secondary" data-copy="${n.id}">📋 লেখা কপি</button><button class="secondary" data-delete="${n.id}">🗑️ মুছুন</button></div></article>`).join(''):'<div class="empty">এখনও কোনো স্বরলিপি নেই। উপরে নতুন লেখা শুরু করুন।</div>';
$('noteList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const n=state.notes.find(x=>x.id===b.dataset.edit);if(!n)return;$('noteId').value=n.id;$('noteTitle').value=n.title;$('noteLanguage').value=n.language;$('noteRaga').value=n.raga;$('noteText').value=n.text;$('noteTaal').value=n.taal;openPage('notebook');$('noteTitle').focus()});
$('noteList').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm('এই স্বরলিপি মুছে ফেলবেন?')){state.notes=state.notes.filter(n=>n.id!==b.dataset.delete);saveState();renderNotes()}});
$('noteList').querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>{const n=state.notes.find(x=>x.id===b.dataset.copy);if(n)navigator.clipboard?.writeText(n.title+'\n'+n.text).then(()=>alert('লেখা কপি হয়েছে')).catch(()=>alert(n.title+'\n'+n.text))});
}
$('noteForm').addEventListener('submit',e=>{e.preventDefault();const id=$('noteId').value||uid();const old=state.notes.find(n=>n.id===id);const note={id,title:$('noteTitle').value.trim(),language:$('noteLanguage').value,raga:$('noteRaga').value.trim(),text:$('noteText').value.trim(),taal:$('noteTaal').value.trim(),created:old?.created||Date.now(),updated:Date.now()};if(old)state.notes=state.notes.map(n=>n.id===id?note:n);else state.notes.push(note);saveState();$('noteForm').reset();$('noteId').value='';renderNotes();alert('স্বরলিপি সেভ হয়েছে।')});
$('clearNote').addEventListener('click',()=>{$('noteForm').reset();$('noteId').value=''});$('noteSearch').addEventListener('input',renderNotes);

// Local audio files (kept in memory for this open session; user can choose them again later)
const audioUrls=[];
$('audioFiles').addEventListener('change',e=>{const files=[...e.target.files];files.forEach(f=>{const url=URL.createObjectURL(f);audioUrls.push(url);const item=document.createElement('div');item.className='audio-item';const title=document.createElement('strong');title.textContent=f.name;const audio=document.createElement('audio');audio.controls=true;audio.src=url;item.append(title,audio);$('audioList').prepend(item)});e.target.value=''});
let recorder=null, chunks=[];
$('recordStart').addEventListener('click',async()=>{if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){$('micStatus').textContent='এই ব্রাউজার/খোলার পদ্ধতিতে রেকর্ডিং সমর্থিত নয়। HTTPS বা localhost-এ চালিয়ে দেখুন।';return}try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});const url=URL.createObjectURL(blob);audioUrls.push(url);const item=document.createElement('div');item.className='audio-item';const title=document.createElement('strong');title.textContent='আমার রেকর্ডিং • '+new Date().toLocaleString('bn-BD');const audio=document.createElement('audio');audio.controls=true;audio.src=url;const link=document.createElement('a');link.href=url;link.download='amar-surer-recording.webm';link.textContent='রেকর্ডিং ডাউনলোড';item.append(title,audio,link);$('recordings').prepend(item);stream.getTracks().forEach(t=>t.stop());$('micStatus').textContent='রেকর্ডিং তৈরি হয়েছে। চাইলে ডাউনলোড করে রাখুন।'};recorder.start();$('recordStart').disabled=true;$('recordStop').disabled=false;$('micStatus').textContent='রেকর্ড হচ্ছে…'}catch(err){$('micStatus').textContent='মাইক্রোফোন চালু করা যায়নি: '+err.message}});
$('recordStop').addEventListener('click',()=>{if(recorder&&recorder.state!=='inactive')recorder.stop();$('recordStart').disabled=false;$('recordStop').disabled=true});

// Backup / restore
$('exportData').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='amar-surer-bhubon-backup.json';a.click();URL.revokeObjectURL(a.href);$('backupStatus').textContent='ব্যাকআপ ফাইল ডাউনলোড শুরু হয়েছে।'});
$('importData').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data.version!==1||!Array.isArray(data.notes))throw new Error('এটি সঠিক ব্যাকআপ ফাইল নয়');if(!confirm('বর্তমান স্বরলিপি বদলে ব্যাকআপের তথ্য আনবেন? আগে বর্তমান ব্যাকআপ নিন।'))return;state={version:1,notes:data.notes,preferences:data.preferences||{base:'C',octave:'4',tone:'reed'}};saveState();renderNotes();$('backupStatus').textContent='ব্যাকআপ ফিরিয়ে আনা হয়েছে।';alert('ব্যাকআপ সফলভাবে ফিরিয়ে আনা হয়েছে।')}catch(err){$('backupStatus').textContent='ব্যাকআপ খোলা যায়নি: '+err.message}finally{e.target.value=''}});

// Startup
loadState();$('baseNote').value=state.preferences.base||'C';$('octave').value=state.preferences.octave||'4';$('tone').value=state.preferences.tone||'reed';renderKeys();renderLessons();renderNotes();
})();