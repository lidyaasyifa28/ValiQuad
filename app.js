/* ValiQuad · Omah Loopeace — app.js
   Navigasi sidebar (satu section per menu), render dashboard, form, tabel, grafik, bandingkan, dan laporan. */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const VIEWS=['dashboard','input','tabel','grafik','bandingkan','laporan'];
const DEFAULT_FLT={q:'',quad:'',target:'',sort:'total'};

let S=loadState(),editing=null,flt={...DEFAULT_FLT},cmp=[0,1],charts={},current='dashboard';

if(typeof Chart!=='undefined'){Chart.defaults.font.family="'Plus Jakarta Sans',sans-serif";Chart.defaults.color='#5F6B64';Chart.defaults.borderColor='#EEE8DA'}
const mk=(id,cfg)=>{if(typeof Chart==='undefined')return;charts[id]?.destroy();charts[id]=new Chart($('#'+id),cfg)};
const badge=q=>`<span class="badge" style="background:${QUAD[q].soft};color:${QUAD[q].color}">${QUAD[q].label}</span>`;
const bars=(l,v)=>`<div class="pg"><span>${l}: ${v}/5</span><div><i style="width:${v*20}%"></i></div><b>${v*20}%</b></div>`;
const selected=()=>{const t=topTied(S.ideas);return t.find(x=>x.id===S.selectedId)||[...t].sort((a,b)=>b.f-a.f)[0]||null};
const opts=a=>a.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('');
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add('hidden'),2300)};

/* ---------- navigasi: satu section per menu ---------- */
function openSide(o){$('#side').classList.toggle('open',o);$('#scrim').classList.toggle('on',o)}
function show(v,push=true){
 if(!VIEWS.includes(v))v='dashboard';current=v;
 document.querySelectorAll('.view').forEach(s=>s.classList.toggle('on',s.id===v));
 document.querySelectorAll('#nav button').forEach(b=>{const on=b.dataset.view===v;b.classList.toggle('on',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
 $('#crumb').textContent=$('#'+v).dataset.title;document.title=`${$('#'+v).dataset.title} · ValiQuad`;
 if(push&&location.hash!=='#'+v)history.pushState(null,'','#'+v);
 openSide(false);window.scrollTo({top:0});
 requestAnimationFrame(()=>Object.values(charts).forEach(c=>c.resize()));
}

/* ---------- Plugin scatter: warna kuadran, garis 3.5, label sudut, angka grup ---------- */
const quadPlugin={id:'quad',
 beforeDatasetsDraw(c){const{ctx,chartArea:a,scales:{x,y}}=c,mx=x.getPixelForValue(3.5),my=y.getPixelForValue(3.5);ctx.save();ctx.globalAlpha=.55;
  [[a.left,a.top,mx-a.left,my-a.top,'potensi'],[mx,a.top,a.right-mx,my-a.top,'prioritas'],[a.left,my,mx-a.left,a.bottom-my,'tunda'],[mx,my,a.right-mx,a.bottom-my,'pertimbangkan']].forEach(([X,Y,w,h,q])=>{ctx.fillStyle=QUAD[q].soft;ctx.fillRect(X,Y,w,h)});ctx.restore()},
 afterDatasetsDraw(c){const{ctx,chartArea:a,scales:{x,y}}=c;ctx.save();ctx.setLineDash([6,4]);ctx.strokeStyle='#8E9993';ctx.lineWidth=1.2;ctx.beginPath();
  ctx.moveTo(x.getPixelForValue(3.5),a.top);ctx.lineTo(x.getPixelForValue(3.5),a.bottom);ctx.moveTo(a.left,y.getPixelForValue(3.5));ctx.lineTo(a.right,y.getPixelForValue(3.5));ctx.stroke();ctx.setLineDash([]);
  ctx.font="700 11px 'Plus Jakarta Sans'";[['POTENSI',a.left+10,a.top+18,'left','potensi'],['PRIORITAS UTAMA',a.right-10,a.top+18,'right','prioritas'],['TUNDA',a.left+10,a.bottom-10,'left','tunda'],['PERTIMBANGKAN',a.right-10,a.bottom-10,'right','pertimbangkan']].forEach(([t,px,py,al,q])=>{ctx.fillStyle=QUAD[q].color;ctx.textAlign=al;ctx.fillText(t,px,py)});
  c.data.datasets.forEach((d,k)=>c.getDatasetMeta(k).data.forEach((p,j)=>{const n=d.data[j].n;if(n>1){ctx.fillStyle='#fff';ctx.font='700 13px Sora,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n,p.x,p.y)}}));ctx.restore()}};

/* ---------- Dashboard ---------- */
function renderDash(){
 const I=S.ideas,st=stats(I),s=selected(),t=topTied(I),g=groupByCoord(I);
 const kpi=(ic,bg,col,label,inner)=>`<div class="card kpi"><span class="ico" style="background:${bg};color:${col}">${ICON(ic)}</span><div><small>${label}</small>${inner}</div></div>`;
 $('#kpis').innerHTML=
  kpi('bulb','#E3EFE7','#1D4A38','Total Ide',`<b class="num">${st.n}</b><em>Data LKPD 5</em>`)+
  kpi('star','#E3EFE7','#1D4A38','Prioritas Utama',`<div style="display:flex;align-items:center;gap:10px"><b class="num">${st.c.prioritas}</b><span class="chip">${st.pct}% Layak</span></div>`)+
  kpi('chart','#FBF0E6','#C86D3B','Rata-rata Skor',`<b class="num">${st.avg}</b><em>Skala maks. 10</em>`)+
  kpi('trophy','#FBF0E6','#C86D3B','Ide Terpilih #1',`<b class="kt">${esc(s?s.nama:'—')}</b>${s?`<span class="score">Skor ${total(s)}/10</span>`:''}`);
 $('#strip').innerHTML=Object.entries(QUAD).map(([k,v])=>`<button data-quad="${k}" title="Lihat ${v.label} di tabel"><i style="background:${v.color}"></i><span>${v.label}</span><b>${st.c[k]}</b></button>`).join('');
 mk('scatter',{type:'scatter',plugins:[quadPlugin],
  data:{datasets:g.map(c=>({data:[{x:c.f,y:c.i,n:c.items.length,names:c.items.map(i=>i.nama)}],backgroundColor:QUAD[quadrantOf(c.f,c.i)].color,borderColor:'#fff',borderWidth:2,pointRadius:9+c.items.length*4,pointHoverRadius:13+c.items.length*4}))},
  options:{maintainAspectRatio:false,animation:{duration:500},
   scales:{x:{min:0,max:6,ticks:{stepSize:1},title:{display:true,text:'Feasibility',font:{weight:'700'}}},y:{min:0,max:6,ticks:{stepSize:1},title:{display:true,text:'Impact',font:{weight:'700'}}}},
   plugins:{legend:{display:false},tooltip:{padding:12,cornerRadius:12,callbacks:{title:i=>`F:${i[0].raw.x} · I:${i[0].raw.y} (${i[0].raw.x+i[0].raw.y}/10)`,label:i=>i.raw.names}}}}});
 $('#foot').textContent=`${st.n} ide dipetakan ke ${g.length} koordinat unik; angka di lingkaran = jumlah ide pada titik yang sama.`;
 $('#detView').innerHTML=Object.entries(QUAD).map(([k,v])=>`<div class="qbox" style="background:${v.soft}"><b style="color:${v.color}">${v.label}</b><ul>${I.filter(x=>quadrantOf(x.f,x.i)===k).map(x=>`<li>${esc(x.nama)} <small>F${x.f}·I${x.i}</small></li>`).join('')||'<li>Belum ada ide</li>'}</ul></div>`).join('');
 $('#spot').innerHTML=!s?'<p>Belum ada ide di Prioritas Utama. Tambahkan ide dengan Feasibility dan Impact minimal 4.</p>':
  `${badge(quadrantOf(s.f,s.i))}<h4>${esc(s.nama)}</h4>${bars('Feasibility',s.f)}${bars('Impact',s.i)}
  <div class="tags"><span>${esc(s.target)} · Omah Loopeace</span>${s.scamper?`<span>SCAMPER: ${esc(s.scamper)}</span>`:''}</div>
  ${t.length>1?`<label class="tie no-print">Skor sama tertinggi — pilih ide:<select id="tie">${t.map(x=>`<option value="${x.id}"${x.id===s.id?' selected':''}>${esc(x.nama)}</option>`).join('')}</select></label>`:''}
  <div class="insight"><b>Insight Keseimbangan Skor</b><p>${spotlightInsight(s)}</p></div>`;
}

/* ---------- Tabel ---------- */
function renderTable(){
 const l=filterIdeas(S.ideas,flt),tie=topTied(S.ideas);const ids=tie.length>1?tie.map(x=>x.id):[];
 $('#tableInfo').textContent=`Menampilkan ${l.length} dari ${S.ideas.length} ide.`;
 $('#tbody').innerHTML=l.map((x,k)=>`<tr><td>${k+1}</td><td>${esc(x.nama)}${x.scamper?`<span class="mini">${esc(x.scamper)}</span>`:''}</td><td>${esc(x.target)}</td><td>${x.f}</td><td>${x.i}</td><td><b>${total(x)}</b></td><td>${badge(quadrantOf(x.f,x.i))}</td>
  <td class="ac"><button data-edit="${x.id}">Edit</button><button data-del="${x.id}">Hapus</button>${ids.includes(x.id)?`<button data-pick="${x.id}">Jadikan Terpilih</button>`:''}</td></tr>`).join('')
  ||'<tr><td colspan="8" class="empty">Tidak ada ide yang cocok. Ubah filter atau tambahkan ide baru.</td></tr>';
}

/* ---------- Grafik ---------- */
function renderBar(){
 const r=ranked(S.ideas);
 mk('bar',{type:'bar',data:{labels:r.map(x=>x.nama.length>36?x.nama.slice(0,34)+'…':x.nama),datasets:[{data:r.map(total),backgroundColor:r.map(x=>QUAD[quadrantOf(x.f,x.i)].color),borderRadius:8,maxBarThickness:28}]},
  options:{indexAxis:'y',maintainAspectRatio:false,animation:{duration:600},scales:{x:{min:0,max:10,ticks:{stepSize:1}},y:{grid:{display:false}}},
   plugins:{legend:{display:false},tooltip:{padding:12,cornerRadius:12,callbacks:{title:i=>r[i[0].dataIndex].nama,afterLabel:i=>{const x=r[i.dataIndex];return`F${x.f} + I${x.i} · ${QUAD[quadrantOf(x.f,x.i)].label}`}}}}}});
 const ins=balanceInsights(S.ideas);
 $('#ins').innerHTML='<b>Panel Insight Keseimbangan Skor</b>'+(ins.length?ins.map(t=>`<p>${esc(t)}</p>`).join(''):'<p>Tidak ada ide dengan total sama yang berbeda kuadran.</p>');
}

/* ---------- Bandingkan ---------- */
function renderCompare(){
 const I=S.ideas;cmp=cmp.map(i=>Math.min(i,Math.max(I.length-1,0)));
 const o=v=>I.map((x,k)=>`<option value="${k}"${k===v?' selected':''}>${esc(x.nama)}</option>`).join('');
 $('#cA').innerHTML=o(cmp[0]);$('#cB').innerHTML=o(cmp[1]);
 if(I.length<2){$('#cCards').innerHTML='<p>Tambahkan minimal 2 ide untuk membandingkan.</p>';$('#cRec').innerHTML='';return}
 const A=I[cmp[0]],B=I[cmp[1]];
 $('#cCards').innerHTML=[[A,'Ide A'],[B,'Ide B']].map(([x,l])=>`<div class="card pad"><small style="color:var(--t);font-weight:700">${l}</small><h4>${esc(x.nama)}</h4>${badge(quadrantOf(x.f,x.i))}${bars('Feasibility',x.f)}${bars('Impact',x.i)}<b class="num" style="font-size:22px">Total ${total(x)}/10</b></div>`).join('');
 $('#cRec').innerHTML=`<b>${esc(compareVerdict(A,B))}</b>`;
}

/* ---------- Laporan ---------- */
function renderReport(){
 const r=ranked(S.ideas);
 $('#rbody').innerHTML=r.map((x,k)=>`<tr><td>${k+1}</td><td>${esc(x.nama)}</td><td>${x.f}</td><td>${x.i}</td><td>${total(x)}</td><td>${QUAD[quadrantOf(x.f,x.i)].label}</td></tr>`).join('');
 $('#concl').innerHTML=`<b>Kesimpulan:</b> ${esc(reportConclusion(S.ideas))}`;
 $('#rnote').innerHTML=`<b>Catatan Pertimbangan:</b> ${esc(S.catatan)}`;
}

/* ---------- Form ---------- */
function renderPrev(){
 const f=+$('#fF').value,i=+$('#fI').value,q=quadrantOf(f,i);
 $('#prev').style.background=QUAD[q].soft;
 $('#prev').innerHTML=`<small>Pratinjau Kuadran</small><b class="num big" style="color:${QUAD[q].color}">${f+i}/10</b><span class="badge" style="background:${QUAD[q].color};color:#fff;align-self:flex-start">${QUAD[q].label}</span><p>${QUAD[q].desc}</p>`;
}
function resetForm(){
 editing=null;$('#fNama').value='';$('#fTarget').value='Penjual';$('#fScamper').value='';$('#fF').value=3;$('#fI').value=3;$('#err').textContent='';
 $('#formTitle').textContent='Input Ide Baru';$('#saveBtn').textContent='Simpan Ide';$('#cancelBtn').classList.add('hidden');renderPrev();
}
function renderAll(){saveState(S);renderDash();renderTable();renderBar();renderCompare();renderReport();$('#navCount').textContent=S.ideas.length}

$('#form').addEventListener('submit',e=>{
 e.preventDefault();const nama=$('#fNama').value.trim();
 if(nama.length<3){$('#err').textContent='Nama ide minimal 3 karakter.';$('#fNama').focus();return}
 const d={nama,target:$('#fTarget').value,scamper:$('#fScamper').value,f:+$('#fF').value,i:+$('#fI').value};
 if(editing){S.ideas=S.ideas.map(x=>x.id===editing?{...x,...d}:x);toast('Ide diperbarui')}else{S.ideas.push({...d,id:uid()});toast('Ide disimpan')}
 resetForm();renderAll();
});
$('#cancelBtn').onclick=resetForm;
['fF','fI'].forEach(id=>$(`#${id}`).onchange=renderPrev);

/* ---------- Inisialisasi kontrol ---------- */
$('#fTarget').innerHTML=opts(TARGETS);$('#fScamper').innerHTML='<option value="">—</option>'+opts(SCAMPER);
$('#fF').innerHTML=$('#fI').innerHTML=[1,2,3,4,5].map(n=>`<option value="${n}"${n===3?' selected':''}>${n} — ${SCALE[n]}</option>`).join('');
$('#quad').innerHTML='<option value="">Semua kuadran</option>'+Object.entries(QUAD).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
$('#tgt').innerHTML='<option value="">Semua target</option>'+opts(TARGETS);
$('#note').value=S.catatan;

/* ---------- Event ---------- */
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-view],[data-quad],[data-edit],[data-del],[data-pick]');if(!t)return;
 if(t.dataset.view)show(t.dataset.view);
 else if(t.dataset.quad){flt.quad=t.dataset.quad;$('#quad').value=flt.quad;renderTable();show('tabel')}
 else if(t.dataset.edit){const x=S.ideas.find(i=>i.id===t.dataset.edit);if(!x)return;editing=x.id;
  $('#fNama').value=x.nama;$('#fTarget').value=x.target;$('#fScamper').value=x.scamper||'';$('#fF').value=x.f;$('#fI').value=x.i;
  $('#formTitle').textContent='Edit Ide';$('#saveBtn').textContent='Simpan Perubahan';$('#cancelBtn').classList.remove('hidden');renderPrev();show('input');$('#fNama').focus()}
 else if(t.dataset.del){if(confirm('Hapus ide ini?')){S.ideas=S.ideas.filter(x=>x.id!==t.dataset.del);if(editing===t.dataset.del)resetForm();renderAll();toast('Ide dihapus')}}
 else if(t.dataset.pick){S.selectedId=t.dataset.pick;renderAll();toast('Ide terpilih diganti');show('dashboard')}
});
document.addEventListener('change',e=>{if(e.target.id==='tie'){S.selectedId=e.target.value;renderAll()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')openSide(false)});
$('#burger').onclick=()=>openSide(true);$('#sideClose').onclick=$('#scrim').onclick=()=>openSide(false);
$('#addBtn').onclick=()=>{resetForm();show('input');setTimeout(()=>$('#fNama').focus(),150)};
$('#loadBtn').onclick=()=>{S.ideas=PRESET_IDEAS.map(x=>({...x}));S.selectedId=null;renderAll();toast('10 ide LKPD 5 dimuat')};
$('#printBtn').onclick=$('#print2').onclick=()=>window.print();
const setView=q=>{$('#vq').classList.toggle('on',q);$('#vd').classList.toggle('on',!q);$('#quadView').classList.toggle('hidden',!q);$('#detView').classList.toggle('hidden',q)};
$('#vq').onclick=()=>setView(true);$('#vd').onclick=()=>setView(false);
$('#q').oninput=e=>{flt.q=e.target.value;renderTable()};
$('#quad').onchange=e=>{flt.quad=e.target.value;renderTable()};$('#tgt').onchange=e=>{flt.target=e.target.value;renderTable()};$('#sort').onchange=e=>{flt.sort=e.target.value;renderTable()};
$('#csv').onclick=()=>exportCSV(S.ideas);$('#json').onclick=()=>exportJSON(S.ideas);
$('#reset').onclick=()=>{if(!confirm('Reset semua data ke 10 ide LKPD 5?'))return;
 S=freshState();flt={...DEFAULT_FLT};$('#note').value=S.catatan;$('#q').value='';$('#quad').value='';$('#tgt').value='';$('#sort').value='total';resetForm();renderAll();toast('Data direset')};
$('#cA').onchange=e=>{cmp[0]=+e.target.value;renderCompare()};$('#cB').onchange=e=>{cmp[1]=+e.target.value;renderCompare()};
$('#note').oninput=e=>{S.catatan=e.target.value;saveState(S);renderReport()};
$('#restore').onclick=()=>{S.catatan=DEFAULT_CATATAN;$('#note').value=S.catatan;saveState(S);renderReport();toast('Teks default dipulihkan')};
window.addEventListener('popstate',()=>show(location.hash.slice(1),false));
window.addEventListener('beforeprint',()=>Object.values(charts).forEach(c=>c.resize()));

/* ---------- Mulai ---------- */
renderPrev();renderAll();show(location.hash.slice(1)||'dashboard',false);