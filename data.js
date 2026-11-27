/* ValiQuad · Omah Loopeace — data.js
   Data preset (LKPD 5 & 6), aturan kuadran, statistik, teks otomatis, penyimpanan, dan ekspor. */

/* ---------- 1. DATA PRESET (tidak diubah) ---------- */
const P=[['Switch Toggle Diskon Mandiri per Menu','Penjual','Substitute',4,5],['Voucher Subsidi Mitra 100% Platform','Penjual & Pembeli','Combine',3,3],['Sinkronisasi Pesanan Masuk & Algoritma Kurir','Penjual','Combine',4,5],['Auto-Print Tiket Pesanan via Bluetooth','Penjual','Adapt',4,4],['Mode Lite Toko (Aplikasi Super Ringan)','Penjual','Adapt',4,4],['Nada Dering Alarm Darurat Kencang','Penjual','Modify',5,3],['Radar Estimasi Kedatangan Kurir','Penjual','Modify',3,4],['Mode Otomatis Langsung Masuk Dapur','Penjual','Eliminate',4,3],['Jeda Waktu Penugasan Kurir (Buffer Time 3–5 Menit)','Penjual','Reverse',5,5],['Status Tahapan Pembuatan di Layar Pembeli','Pembeli','Modify',4,3]];
const PRESET_IDEAS=P.map(([nama,target,scamper,f,i],k)=>({id:'p'+(k+1),nama,target,scamper,f,i}));
const SCALE={1:'Sangat Rendah',2:'Rendah',3:'Sedang',4:'Tinggi',5:'Sangat Tinggi'};
const TARGETS=['Penjual','Pembeli','Penjual & Pembeli'];
const SCAMPER=['Substitute','Combine','Adapt','Modify','Put to Another Use','Eliminate','Reverse'];
const STORE_KEY='valiquad_omah_loopeace_v1';
const DEFAULT_CATATAN='Dipilih karena Jeda Waktu Penugasan Kurir (Buffer Time 3–5 Menit) meraih skor sempurna 10/10 (Feasibility 5, Impact 5) di kuadran Prioritas Utama. Fitur ini realistis dikembangkan sekaligus berdampak langsung membantu Bu Sri (Omah Loopeace) agar tidak terburu-buru menyiapkan pesanan di jam sibuk sarapan pagi, melengkapi perlindungan margin dari Switch Toggle Diskon Mandiri.';

/* ---------- 2. KUADRAN ---------- */
const BATAS_TINGGI=4;
const QUAD={
 prioritas:{label:'Prioritas Utama',color:'#1D4A38',soft:'#E3EFE7',desc:'Layak dan berdampak tinggi — kerjakan lebih dulu.'},
 potensi:{label:'Potensi',color:'#9E425D',soft:'#F6E5EA',desc:'Berdampak tinggi, tetapi masih sulit dibuat.'},
 pertimbangkan:{label:'Pertimbangkan',color:'#C86D3B',soft:'#FBF0E6',desc:'Mudah dibuat, tetapi dampaknya terbatas.'},
 tunda:{label:'Tunda',color:'#6B7270',soft:'#ECEEEB',desc:'Kelayakan dan dampak sama-sama rendah.'}};
const quadrantOf=(f,i)=>f>=BATAS_TINGGI?(i>=BATAS_TINGGI?'prioritas':'pertimbangkan'):(i>=BATAS_TINGGI?'potensi':'tunda');
const total=x=>x.f+x.i;
const ranked=a=>[...a].sort((x,y)=>total(y)-total(x)||y.i-x.i||y.f-x.f);
const topTied=a=>{const p=a.filter(x=>quadrantOf(x.f,x.i)==='prioritas');const m=Math.max(0,...p.map(total));return p.filter(x=>total(x)===m)};
const groupByCoord=a=>{const m={};a.forEach(x=>{(m[x.f+','+x.i]??={f:x.f,i:x.i,items:[]}).items.push(x)});return Object.values(m)};

/* ---------- 3. STATISTIK & PENYARINGAN ---------- */
const stats=a=>{const c={prioritas:0,potensi:0,pertimbangkan:0,tunda:0};a.forEach(x=>c[quadrantOf(x.f,x.i)]++);
 const n=a.length,sum=a.reduce((s,x)=>s+total(x),0);
 return{n,c,avg:n?(sum/n).toFixed(1):'0.0',pct:n?Math.round(c.prioritas/n*100):0}};
const filterIdeas=(a,{q='',quad='',target='',sort=''}={})=>{
 let l=a.filter(x=>x.nama.toLowerCase().includes(q.trim().toLowerCase())&&(!quad||quadrantOf(x.f,x.i)===quad)&&(!target||x.target===target));
 const by={total:(x,y)=>total(y)-total(x),f:(x,y)=>y.f-x.f,i:(x,y)=>y.i-x.i};
 return by[sort]?[...l].sort(by[sort]):l};
const ICON=n=>`<svg class="ic"><use href="#i-${n}"/></svg>`;

/* ---------- 4. TEKS OTOMATIS ---------- */
const balanceInsights=a=>{const g={};a.forEach(x=>(g[total(x)]??=[]).push(x));
 return Object.entries(g).map(([t,l])=>({t,l,q:[...new Set(l.map(x=>quadrantOf(x.f,x.i)))]})).filter(g=>g.q.length>1).sort((x,y)=>y.t-x.t).map(g=>{
  const first=g.l[0],other=g.l.find(x=>quadrantOf(x.f,x.i)!==quadrantOf(first.f,first.i));
  return `Skor total ${g.t} sama, tetapi "${first.nama}" (${first.f}+${first.i}) masuk ${QUAD[quadrantOf(first.f,first.i)].label}, sedangkan "${other.nama}" (${other.f}+${other.i}) masuk ${QUAD[quadrantOf(other.f,other.i)].label}. Total skor saja tidak cukup; periksa juga keseimbangan Feasibility dan Impact.`})};
const spotlightInsight=s=>!s?'':s.f===s.i
 ?'Ide ini memiliki keseimbangan sempurna antara kelayakan dan dampak, sehingga menjadi prioritas utama untuk diterapkan.'
 :s.f>s.i?'Ide ini lebih mudah dibuat daripada besar dampaknya; pastikan manfaatnya sepadan.'
 :'Ide ini berdampak lebih besar daripada kemudahannya; siapkan sumber daya tambahan.';
const compareVerdict=(A,B)=>{
 if(!A||!B||A.id===B.id)return'Pilih dua ide yang berbeda.';
 const d=total(A)-total(B),same=quadrantOf(A.f,A.i)===quadrantOf(B.f,B.i);
 if(d===0&&!same)return'Total skor sama, tetapi kuadran berbeda. Utamakan ide dengan kuadran lebih tinggi.';
 if(d===0)return'Kedua ide setara; pertimbangkan kebutuhan Bu Sri.';
 return`Rekomendasi: kerjakan "${(d>0?A:B).nama}" lebih dulu (selisih ${Math.abs(d)} poin).`};
const reportConclusion=a=>{const s=stats(a),r=ranked(a);
 return`Dari ${s.n} ide, ${s.c.prioritas} ide (${s.pct}%) masuk Prioritas Utama dengan rata-rata skor ${s.avg}/10.`+(r[0]?` Skor tertinggi: "${r[0].nama}" (${total(r[0])}/10).`:'')};

/* ---------- 5. PENYIMPANAN (localStorage) ---------- */
const uid=()=>'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const freshState=()=>({ideas:PRESET_IDEAS.map(x=>({...x})),selectedId:null,catatan:DEFAULT_CATATAN});
const validIdea=x=>x&&typeof x.nama==='string'&&x.f>=1&&x.f<=5&&x.i>=1&&x.i<=5;
const loadState=()=>{try{const s=JSON.parse(localStorage.getItem(STORE_KEY));
 if(s&&Array.isArray(s.ideas)&&s.ideas.every(validIdea))return{ideas:s.ideas,selectedId:s.selectedId??null,catatan:typeof s.catatan==='string'?s.catatan:DEFAULT_CATATAN}}catch(e){}
 return freshState()};
const saveState=S=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(S))}catch(e){}};

/* ---------- 6. EKSPOR ---------- */
const dl=(c,n,t)=>{const u=URL.createObjectURL(new Blob([c],{type:t}));const l=document.createElement('a');l.href=u;l.download=n;l.click();URL.revokeObjectURL(u)};
const exportCSV=a=>dl('\uFEFF'+['No,Nama Ide,Target,SCAMPER,Feasibility,Impact,Total,Kuadran',...ranked(a).map((x,k)=>[k+1,`"${x.nama.replace(/"/g,'""')}"`,`"${x.target}"`,x.scamper||'-',x.f,x.i,total(x),QUAD[quadrantOf(x.f,x.i)].label].join(','))].join('\r\n'),'valiquad-ide.csv','text/csv;charset=utf-8');
const exportJSON=a=>dl(JSON.stringify(a,null,2),'valiquad-ide.json','application/json');