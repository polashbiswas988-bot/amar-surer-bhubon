(() => {
'use strict';
const $ = id => document.getElementById(id);
const STORE = 'amarSurerBhubonPro_v1';
const defaultData = {notes:[], settings:{instrument:'harmonium',root:60,volume:65,showNames:true}, version:1};
let data;
try { data = {...defaultData, ...JSON.parse(localStorage.getItem(STORE)||'{}')}; } catch { data = {...defaultData}; }
data.notes = Array.isArray(data.notes) ? data.notes : [];
data.settings = {...defaultData.settings, ...(data.settings||{})};
let audioCtx = null, activeNodes = new Set(), sequenceTimers = [], installPrompt = null, keyboardStart = 48;
const noteNames = ['সা','কোমল রে','রে','কোমল গা','গা','মা','তীব্র মা','পা','কোমল ধা','ধা','কোমল নি','নি'];
const western = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const ragas = [
 {id:'yaman',name:'ইমন (ইয়ামন)',thaat:'কল্যাণ',time:'সন্ধ্যা / রাতের প্রথম প্রহর',mood:'শান্ত, কোমল ও ভক্তিময়',aroha:'নি রে গা মা^ ধা নি সা’',avaroha:'সা’ নি ধা পা মা^ গা রে সা',vadi:'গা',samvadi:'নি',notes:'তীব্র মা ব্যবহৃত হয়; পা অনেক চলনে গুরুত্বপূর্ণ।',example:[0,2,4,6,7,9,11,12,11,9,7,6,4,2,0],study:'ইমন সন্ধ্যার একটি পরিচিত রাগ। আরোহে রে ও গা থেকে তীব্র মা-র দিকে ওঠার চলন রাগের রূপ চিনতে সাহায্য করে।'},
 {id:'bhairav',name:'ভৈরব',thaat:'ভৈরব',time:'ভোর',mood:'গম্ভীর, ধ্যানমগ্ন',aroha:'সা কোমল রে গা মা পা কোমল ধা নি সা’',avaroha:'সা’ নি কোমল ধা পা মা গা কোমল রে সা',vadi:'ধা',samvadi:'রে',notes:'কোমল রে ও কোমল ধা-তে বিশেষ আন্দোলন প্রচলিত।',example:[0,1,4,5,7,8,11,12,11,8,7,5,4,1,0],study:'ভৈরব ভোরের রাগ। কোমল রে ও কোমল ধা-র স্থির, আন্দোলিত ব্যবহার এর গম্ভীর ভাব গড়ে তোলে।'},
 {id:'bhupali',name:'ভূপালী',thaat:'কল্যাণ',time:'সন্ধ্যা',mood:'শান্ত, উজ্জ্বল',aroha:'সা রে গা পা ধা সা’',avaroha:'সা’ ধা পা গা রে সা',vadi:'গা',samvadi:'ধা',notes:'পাঁচ স্বরের রাগ; মা ও নি বর্জিত।',example:[0,2,4,7,9,12,9,7,4,2,0],study:'ভূপালীতে পাঁচটি স্বর ব্যবহৃত হয়। মা ও নি না থাকায় এর সুর খোলা ও সহজে গাওয়ার মতো শোনায়।'},
 {id:'kafi',name:'কাফি',thaat:'কাফি',time:'রাতের দ্বিতীয় প্রহর / বসন্তের পরিবেশনা',mood:'লোকঘেঁষা, স্নিগ্ধ',aroha:'সা রে কোমল গা মা পা ধা কোমল নি সা’',avaroha:'সা’ কোমল নি ধা পা মা কোমল গা রে সা',vadi:'পা',samvadi:'সা',notes:'কোমল গা ও কোমল নি মূল পরিচায়ক স্বর।',example:[0,2,3,5,7,9,10,12,10,9,7,5,3,2,0],study:'কাফি ঠাটের রাগে কোমল গা ও কোমল নি গুরুত্বপূর্ণ। লোকসঙ্গীত ও হালকা শাস্ত্রীয় গানে এর ঘনিষ্ঠ রূপ শোনা যায়।'},
 {id:'bageshri',name:'বাগেশ্রী',thaat:'কাফি',time:'রাত',mood:'অন্তর্মুখী, আকুল',aroha:'নি সা গা মা ধা নি সা’',avaroha:'সা’ নি ধা মা পা ধা গা মা রে সা',vadi:'মা',samvadi:'সা',notes:'কোমল গা ও কোমল নি; চলনে পা সাধারণত সংযত।',example:[10,12,3,5,9,10,12,10,9,5,7,9,3,5,2,0],study:'বাগেশ্রীতে কোমল গা ও কোমল নি, এবং মা-কে ঘিরে চলন লক্ষণীয়। এখানে দেওয়া সুরটি কেবল প্রাথমিক ধারণার জন্য।'},
 {id:'malkauns',name:'মালকোষ',thaat:'ভৈরবী-সম্পর্কিত প্রচলিত শ্রেণিবিভাগ',time:'গভীর রাত',mood:'গম্ভীর, ধ্যানমগ্ন',aroha:'সা কোমল গা মা কোমল ধা কোমল নি সা’',avaroha:'সা’ কোমল নি কোমল ধা মা কোমল গা সা',vadi:'মা',samvadi:'সা',notes:'পাঁচ স্বরের রাগ; রে ও পা বর্জিত।',example:[0,3,5,8,10,12,10,8,5,3,0],study:'মালকোষে রে ও পা ব্যবহৃত হয় না। কোমল গা, কোমল ধা ও কোমল নি-র সঙ্গে মা রাগের গাঢ় আবহ তৈরি করে।'},
 {id:'desh',name:'দেশ',thaat:'খামাজ',time:'রাত / বর্ষার আবহে বহুল পরিবেশিত',mood:'স্নিগ্ধ, দেশাত্মবোধক আবহে পরিচিত',aroha:'নি সা রে মা পা নি সা’',avaroha:'সা’ কোমল নি ধা পা মা গা রে সা',vadi:'রে',samvadi:'পা',notes:'অবরোহে কোমল নি-র ব্যবহার পরিচিত বৈশিষ্ট্য।',example:[11,0,2,5,7,11,12,10,9,7,5,4,2,0],study:'দেশ রাগ বর্ষা ও দেশাত্মবোধক গানের সঙ্গে জনপ্রিয়ভাবে যুক্ত। রাগের পূর্ণ রূপ বুঝতে বিভিন্ন শিল্পীর পরিবেশনা শোনা দরকার।'},
 {id:'khamaj',name:'খামাজ',thaat:'খামাজ',time:'রাত',mood:'মাধুর্যময়, হালকা',aroha:'সা গা মা পা ধা নি সা’',avaroha:'সা’ কোমল নি ধা পা মা গা রে সা',vadi:'গা',samvadi:'নি',notes:'অবরোহে কোমল নি প্রায়শই ব্যবহৃত হয়।',example:[0,4,5,7,9,11,12,10,9,7,5,4,2,0],study:'খামাজ ঠাট ও খামাজ রাগের ধারণা আলাদা করে শেখা ভালো। ঠাট একটি স্বর-ভিত্তিক শ্রেণি, রাগের নিজস্ব চলনও থাকে।'},
 {id:'darbari',name:'দরবারি কানাড়া',thaat:'আসাবরী',time:'গভীর রাত',mood:'গম্ভীর, গভীর',aroha:'সা রে কোমল গা মা পা কোমল ধা নি সা’',avaroha:'সা’ নি কোমল ধা পা মা কোমল গা রে সা',vadi:'রে',samvadi:'পা',notes:'কোমল গা ও কোমল ধা-তে গভীর আন্দোলন বিশেষভাবে পরিচিত।',example:[0,2,3,5,7,8,11,12,11,8,7,5,3,2,0],study:'দরবারি কানাড়া ধীর, গভীর আলাপ ও কোমল স্বরের আন্দোলনের জন্য পরিচিত। এই সংক্ষিপ্ত ধ্বনি তার পূর্ণ চলন প্রকাশ করে না।'},
 {id:'todi',name:'মিয়াঁ কি টোড়ি',thaat:'টোড়ি',time:'সকাল',mood:'গভীর, চিন্তামগ্ন',aroha:'সা কোমল রে কোমল গা তীব্র মা পা কোমল ধা নি সা’',avaroha:'সা’ নি কোমল ধা পা তীব্র মা কোমল গা কোমল রে সা',vadi:'ধা',samvadi:'গা',notes:'কোমল রে, কোমল গা, তীব্র মা ও কোমল ধা-র বিশেষ স্বরপ্রয়োগ রয়েছে।',example:[0,1,3,6,7,8,11,12,11,8,7,6,3,1,0],study:'টোড়ি রাগে স্বরের সূক্ষ্ম অবস্থান ও চলন অত্যন্ত গুরুত্বপূর্ণ। কিবোর্ডের সরল সুর রাগের সূক্ষ্মতা পুরোপুরি ধরতে পারে না।'}
];
function saveData(){localStorage.setItem(STORE,JSON.stringify(data));}
function getAudio(){if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended') audioCtx.resume(); return audioCtx;}
function stopSequence(){sequenceTimers.forEach(clearTimeout);sequenceTimers=[];activeNodes.forEach(n=>{try{n.stop?.();}catch(e){}});activeNodes.clear();}
function midiFreq(m){return 440*Math.pow(2,(m-69)/12);}
function playTone(midi,duration=.48,when=0,instrument=data.settings.instrument){
 const ctx=getAudio(), now=ctx.currentTime+when, master=ctx.createGain(); master.gain.value=Math.max(.001,(Number(data.settings.volume)||65)/100)*.16; master.connect(ctx.destination);
 const freq=midiFreq(midi), end=now+duration;
 const env=ctx.createGain(); env.gain.setValueAtTime(.0001,now); env.gain.exponentialRampToValueAtTime(instrument==='veena'?.65:.8,now+.025);
 env.gain.setTargetAtTime(.0001,end-.06,.045); env.connect(master);
 const osc1=ctx.createOscillator(), osc2=ctx.createOscillator();
 if(instrument==='harmonium'){osc1.type='sawtooth';osc2.type='square';osc2.frequency.value=freq*2.005;osc2.detune.value=5;osc1.frequency.setValueAtTime(freq,now);osc2.frequency.setValueAtTime(freq,now);osc2.connect(env);osc1.connect(env);}
 else if(instrument==='flute'){osc1.type='sine';osc2.type='triangle';osc2.frequency.setValueAtTime(freq*2,now);const breath=ctx.createGain();breath.gain.value=.12;osc2.connect(breath);breath.connect(env);osc1.connect(env);osc1.frequency.setValueAtTime(freq,now);osc2.frequency.setValueAtTime(freq,now);}
 else {osc1.type='triangle';osc2.type='sine';osc1.frequency.setValueAtTime(freq,now);osc2.frequency.setValueAtTime(freq*2.01,now);osc2.detune.value=7;osc1.connect(env);osc2.connect(env);env.gain.setTargetAtTime(.0001,end-.08,.12);}
 osc1.start(now);osc2.start(now);osc1.stop(end+.04);osc2.stop(end+.04);activeNodes.add(osc1);activeNodes.add(osc2);
 osc1.onended=()=>{activeNodes.delete(osc1);try{master.disconnect();}catch(e){}};
 return {midi,duration};
}
function playSeq(offsets,tempo=360,instrument=data.settings.instrument){
 stopSequence(); const root=Number(data.settings.root)||60;
 offsets.forEach((n,i)=>{const t=setTimeout(()=>playTone(root+n,.36,0,instrument),i*tempo);sequenceTimers.push(t);});
}
function noteLabel(midi){let sem=((midi-(Number(data.settings.root)||60))%12+12)%12; return noteNames[sem]||'';}
function renderKeyboard(){
 const wrap=$('keyboard');wrap.innerHTML='';
 for(let i=0;i<37;i++){
  const midi=keyboardStart+i, sem=((midi-keyboardStart)%12+12)%12, black=[1,3,6,8,10].includes(sem);
  const btn=document.createElement('button');btn.className='key'+(black?' black':'');btn.type='button';btn.setAttribute('aria-label',`${noteLabel(midi)} ${western[midi%12]}`);
  btn.innerHTML=$('showNames').checked?`<span><span class="keynote">${noteLabel(midi)}</span><span class="keyname">${western[midi%12]}${Math.floor(midi/12)-1}</span></span>`:`<span class="keyname">${western[midi%12]}</span>`;
  const start=ev=>{ev.preventDefault();btn.classList.add('active');playTone(midi,.5,0);};
  const end=()=>btn.classList.remove('active');
  btn.addEventListener('pointerdown',start);btn.addEventListener('pointerup',end);btn.addEventListener('pointercancel',end);btn.addEventListener('pointerleave',end);
  wrap.appendChild(btn);
 }
 $('octaveLabel').textContent=`৩ অক্টেভ • ৩৭ কী • শুরু ${western[keyboardStart%12]}${Math.floor(keyboardStart/12)-1}`;
}
function updateInstrument(){data.settings.instrument=$('instrumentSelect').value;saveData();}
function ragaRender(){
 const r=ragas.find(x=>x.id===$('ragaSelect').value)||ragas[0];
 $('ragaCard').innerHTML=`<h3>${r.name}</h3><div class="raga-meta">ঠাট/শ্রেণি: ${r.thaat} • সময়: ${r.time}</div>
 <div class="raga-grid">
 <div class="raga-item"><strong>আরোহ</strong>${r.aroha}</div><div class="raga-item"><strong>অবরোহ</strong>${r.avaroha}</div>
 <div class="raga-item"><strong>বাদী স্বর</strong>${r.vadi}</div><div class="raga-item"><strong>সমবাদী স্বর</strong>${r.samvadi}</div>
 <div class="raga-item"><strong>ভাবের পরিচয়</strong>${r.mood}</div><div class="raga-item"><strong>বিশেষ লক্ষণ</strong>${r.notes}</div></div>
 <p style="margin-top:12px">${r.study}</p><div class="raga-actions"><button class="primary" id="ragaPlayInline">▶ উদাহরণ শোনো</button><button class="secondary" id="ragaArohaInline">↑ আরোহের ধাঁচ</button><button class="secondary" id="ragaAvarohaInline">↓ অবরোহের ধাঁচ</button></div>`;
 $('ragaPlayInline').onclick=()=>playSeq(r.example,420);
 $('ragaArohaInline').onclick=()=>playSeq(r.example.slice(0,Math.ceil(r.example.length/2)),420);
 $('ragaAvarohaInline').onclick=()=>playSeq(r.example.slice(Math.floor(r.example.length/2)).reverse(),420);
}
function renderNotes(){
 const list=$('notesList');list.innerHTML='';
 if(!data.notes.length){list.innerHTML='<p class="hint">এখনও কোনো স্বরলিপি সেভ করা হয়নি।</p>';return;}
 [...data.notes].sort((a,b)=>b.updated-a.updated).forEach(note=>{
  const card=document.createElement('article');card.className='note-card';
  const body=document.createElement('div');const h=document.createElement('h3');h.textContent=note.title;const p=document.createElement('p');p.textContent=note.text;body.append(h,p);
  const actions=document.createElement('div');actions.className='note-actions';
  const play=document.createElement('button');play.className='secondary';play.textContent='▶ বাজাও';play.onclick=()=>{const tokens=note.text.replace(/[|,।]/g,' ').split(/\s+/).filter(Boolean);const map={'সা':0,'রে':2,'রেঃ':2,'গা':4,'মা':5,'পা':7,'ধা':9,'নি':11,"সা’":12,"সা'":12,'কোমল রে':1,'কোমল গা':3,'তীব্র মা':6,'কোমল ধা':8,'কোমল নি':10};let nums=tokens.map(t=>map[t]).filter(n=>n!==undefined);if(nums.length)playSeq(nums,420);else $('backupMessage').textContent='এই স্বরলিপির শব্দগুলো চিনতে পারিনি; সা রে গা মা পা ধা নি ব্যবহার করো।';};
  const edit=document.createElement('button');edit.className='secondary';edit.textContent='✏️ সম্পাদনা';edit.onclick=()=>{$('noteId').value=note.id;$('noteTitle').value=note.title;$('noteText').value=note.text;document.querySelector('[data-page="notebook"]').click();$('noteTitle').focus();};
  const del=document.createElement('button');del.className='secondary';del.textContent='🗑 মুছো';del.onclick=()=>{if(confirm('এই স্বরলিপি মুছে ফেলবে?')){data.notes=data.notes.filter(n=>n.id!==note.id);saveData();renderNotes();}};
  actions.append(play,edit,del);card.append(body,actions);list.append(card);
 });
}
function showPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));$('page-'+name).classList.remove('hidden');document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.page===name));}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
$('instrumentSelect').value=data.settings.instrument;$('rootSelect').value=String(data.settings.root);$('volume').value=data.settings.volume;$('showNames').checked=data.settings.showNames;
$('instrumentSelect').addEventListener('change',updateInstrument);
$('rootSelect').addEventListener('change',()=>{data.settings.root=Number($('rootSelect').value);saveData();renderKeyboard();});
$('volume').addEventListener('input',()=>{data.settings.volume=Number($('volume').value);saveData();});
$('showNames').addEventListener('change',()=>{data.settings.showNames=$('showNames').checked;saveData();renderKeyboard();});
$('lowerOctave').onclick=()=>{keyboardStart=Math.max(24,keyboardStart-12);renderKeyboard();};
$('higherOctave').onclick=()=>{keyboardStart=Math.min(72,keyboardStart+12);renderKeyboard();};
$('playScale').onclick=()=>playSeq([0,2,4,5,7,9,11,12]);
$('stopSound').onclick=stopSequence;
$('playAroha').onclick=()=>playSeq([0,2,4,5,7,9,11,12]);
$('playAvaroha').onclick=()=>playSeq([12,11,9,7,5,4,2,0]);
document.querySelectorAll('.practice').forEach(b=>b.addEventListener('click',()=>playSeq(b.dataset.seq.split(',').map(Number))));
ragas.forEach(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=r.name;$('ragaSelect').append(o);});
$('ragaSelect').addEventListener('change',ragaRender);$('playRaga').onclick=()=>{const r=ragas.find(x=>x.id===$('ragaSelect').value)||ragas[0];playSeq(r.example,420);};ragaRender();
$('noteForm').addEventListener('submit',e=>{e.preventDefault();const id=$('noteId').value||('note-'+Date.now());const old=data.notes.find(n=>n.id===id);const item={id,title:$('noteTitle').value.trim(),text:$('noteText').value.trim(),updated:Date.now(),created:old?.created||Date.now()};if(old)data.notes=data.notes.map(n=>n.id===id?item:n);else data.notes.push(item);saveData();renderNotes();$('noteForm').reset();$('noteId').value='';alert('স্বরলিপি সেভ হয়েছে!');});
$('clearNote').onclick=()=>{$('noteForm').reset();$('noteId').value='';};
$('backupBtn').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='amar-surer-bhubon-backup.json';a.click();URL.revokeObjectURL(url);$('backupMessage').textContent='ব্যাকআপ ডাউনলোড শুরু হয়েছে।';};
$('restoreFile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{const parsed=JSON.parse(await f.text());if(!parsed||!Array.isArray(parsed.notes))throw new Error('invalid');data={...defaultData,...parsed,settings:{...defaultData.settings,...(parsed.settings||{})}};saveData();renderNotes();$('instrumentSelect').value=data.settings.instrument;$('rootSelect').value=String(data.settings.root);$('volume').value=data.settings.volume;$('showNames').checked=data.settings.showNames;renderKeyboard();$('backupMessage').textContent='ব্যাকআপ ফিরিয়ে আনা হয়েছে।';}catch(err){$('backupMessage').textContent='এই ফাইলটি সঠিক ব্যাকআপ নয়।';}e.target.value='';});
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;const keys={'a':0,'s':2,'d':4,'f':5,'g':7,'h':9,'j':11,'k':12,'q':12,'w':14,'e':16,'r':17,'t':19,'y':21,'u':23};const n=keys[e.key.toLowerCase()];if(n!==undefined){e.preventDefault();playTone((Number(data.settings.root)||60)+n);}});
function updateNetwork(){const online=navigator.onLine;$('netState').textContent=online?'অনলাইন':'অফলাইনেও ব্যবহারযোগ্য';$('netState').style.background=online?'#ffffff20':'#f0b84b';}
window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);updateNetwork();renderKeyboard();renderNotes();
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').classList.remove('hidden');});
$('installBtn').onclick=async()=>{if(!installPrompt){alert('Chrome মেনু থেকে Add to Home screen / Install app ব্যবহার করো।');return;}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').classList.add('hidden');};
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();