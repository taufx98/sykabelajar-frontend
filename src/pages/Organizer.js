(function(){
  const svc=()=>window.SYKA_CONTROL_SERVICE;
  const U=window.SYKA_UTILS;
  const esc=U.escapeHtml;
  const fmt=U.formatDateTime;

  // Organizer is intentionally a competition workspace, not a collection of
  // UUID-driven sub-pages. Server ids remain internal implementation details.
  const tabs=[
    ['dashboard','Dashboard'],
    ['competitions','Kompetisi'],
    ['participants','Peserta'],
    ['awards','Hadiah & penghargaan'],
    ['notifications','Notifikasi'],
    ['plan','Plan & Usage']
  ];

  const TYPE_META={
    multiple_choice:{label:'Pilihan ganda',options:true,multi:false},
    multiple_checkbox:{label:'Pilihan ganda multi-jawaban',options:true,multi:true},
    true_false:{label:'Benar / Salah',options:true,multi:false,locked:true},
    short_answer:{label:'Isian singkat',options:false},
    essay:{label:'Essay',options:false},
    file_upload:{label:'Upload file',options:false}
  };

  const transitions={
    DRAFT:['PUBLISHED','SUSPENDED','CANCELLED'],
    PUBLISHED:['REGISTRATION_OPEN','SUSPENDED','CANCELLED'],
    REGISTRATION_OPEN:['REGISTRATION_CLOSED','SUSPENDED','CANCELLED'],
    REGISTRATION_CLOSED:['LIVE','SUSPENDED','CANCELLED'],
    LIVE:['SUBMISSION_CLOSED','SUSPENDED','CANCELLED'],
    SUBMISSION_CLOSED:['GRADING','SUSPENDED','CANCELLED'],
    GRADING:['RESULT_PUBLISHED','SUSPENDED'],
    RESULT_PUBLISHED:['ARCHIVED','SUSPENDED'],
    SUSPENDED:['DRAFT','PUBLISHED','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','CANCELLED']
  };

  async function membership(){
    const a=window.SYKA_STATE.getState().auth;
    const list=await svc().listMyOrganizerMemberships(a.user?.id).catch(()=>[]);
    return list[0]?.organizer_id||null;
  }

  function workspaceSwitcher(rows,selected){
    const options=(rows||[]).map(r=>{
      const id=r.id||r.organizer_id;
      const label=r.name||r.organizers?.name||'Workspace';
      return `<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(label)}</option>`;
    }).join('');
    return `<label class="workspace-picker"><span>Workspace</span><select id="organizer-workspace-select">${options}</select></label>`;
  }

  function shell(tab,activePlan){
    return `<div class="control-head organizer-control-head-v49">
      <div><span class="eyebrow">ORGANIZER CONTROL PLANE</span><h1>Panel Penyelenggara</h1><p>Bangun satu kompetisi dalam satu workspace: informasi, peserta, soal, grading, hasil, awards, sertifikat, dan twibbon.</p></div>
      <div class="control-head-meta"><span class="security-badge">Plan ${esc(activePlan?.plan_code||'FREE')} · server-side</span></div>
    </div>
    <div class="control-tabs">${tabs.map(([k,l])=>`<button type="button" class="control-tab ${tab===k?'active':''}" data-tab="${k}">${l}</button>`).join('')}</div>
    <div id="organizer-content"></div>`;
  }

  async function render(root){
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){
      root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk diperlukan',text:'Panel penyelenggara membutuhkan akun yang memiliki workspace.',actionHtml:'<button class="btn btn-primary" id="org-login">Masuk</button>'});
      document.getElementById('org-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/organizer'}));
      return;
    }
    if(!auth.roles.includes('organizer_member')&&!auth.roles.includes('admin')){
      root.innerHTML=window.SYKA_EMPTY.render({title:'Akses belum tersedia',text:'Akun ini belum memiliki jalur Penyelenggara.'});
      return;
    }

    try{
      const q=window.SYKA_STATE.getState().route.query||{};
      const competitionId=q.competition||null;
      const orgRows=auth.roles.includes('admin')?await svc().listOrganizers():await svc().listMyOrganizerMemberships(auth.user.id);
      let orgId=q.organizer||null;
      if(!orgId) orgId=orgRows[0]?.id||orgRows[0]?.organizer_id||null;
      if(!orgId){
        root.innerHTML=window.SYKA_EMPTY.render({title:'Belum ada workspace penyelenggara',text:auth.roles.includes('admin')?'Belum ada organizer yang terdaftar.':'Workspace penyelenggara akun ini belum tersedia.'});
        return;
      }
      if(auth.roles.includes('admin')&&!q.organizer){
        window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:q.tab||'dashboard'});
        return;
      }

      const activePlan=await svc().listActiveOrganizerPlan(orgId).catch(()=>null);
      const tab=tabs.some(([k])=>k===q.tab)?q.tab:'dashboard';
      if(!activePlan&&tab!=='plan'){
        root.innerHTML=shell('plan',activePlan);
        root.querySelector('.control-head-meta').innerHTML=`${auth.roles.includes('admin')?workspaceSwitcher(orgRows,orgId):'<span class="workspace-chip">Workspace aktif</span>'}<span class="security-badge">Pilih paket sebelum mengelola workspace</span>`;
        bindShell(root,orgId);
        await renderPlan(root.querySelector('#organizer-content'),orgId,true);
        return;
      }

      root.innerHTML=shell(tab,activePlan);
      root.querySelector('.control-head-meta').innerHTML=`${auth.roles.includes('admin')?workspaceSwitcher(orgRows,orgId):'<span class="workspace-chip">Workspace aktif</span>'}<span class="security-badge">Paket ${esc(activePlan?.plan_code||'FREE')}</span>`;
      bindShell(root,orgId);
      await renderTab(root.querySelector('#organizer-content'),tab,orgId,competitionId);
    }catch(error){
      root.innerHTML=window.SYKA_EMPTY.render({title:'Modul gagal dimuat',text:error.message||'Periksa workspace dan RLS lalu coba lagi.'});
    }
  }

  function bindShell(root,orgId){
    root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:b.dataset.tab}));
    root.querySelector('#organizer-workspace-select')?.addEventListener('change',e=>window.SYKA_ROUTER.navigate('/organizer',{organizer:e.target.value,tab:'competitions'}));
  }

  async function renderTab(root,tab,orgId,competitionId=null){
    if(tab==='dashboard') return dashboard(root,orgId);
    if(tab==='competitions') return workspaceCompetition(root,orgId,competitionId);
    if(tab==='participants') return participantsPage(root,orgId,competitionId);
    if(tab==='awards') return awardsPage(root,orgId,competitionId);
    if(tab==='notifications') return notifications(root);
    if(tab==='plan') return renderPlan(root,orgId,false);
  }

  async function dashboard(root,orgId){
    const comps=await svc().listCompetitionsAdmin({organizerId:orgId,limit:20});
    const active=comps.filter(c=>!['ARCHIVED','CANCELLED'].includes(String(c.status))).length;
    const published=comps.filter(c=>String(c.status)==='PUBLISHED'||String(c.status)==='REGISTRATION_OPEN').length;
    root.innerHTML=`<div class="workspace-dashboard-v49">
      <div class="workspace-dashboard-hero"><div><span class="eyebrow">WORKSPACE OVERVIEW</span><h2>Semua kebutuhan kompetisi dalam satu tempat.</h2><p>Pilih kompetisi untuk membuka workspace lengkap tanpa UUID, popup form besar, atau perpindahan modul.</p></div><button class="btn btn-primary" id="dash-new-competition">+ Buat kompetisi</button></div>
      <div class="workspace-stat-grid-v49"><div><span>Kompetisi aktif</span><strong>${active}</strong></div><div><span>Pendaftaran terbuka</span><strong>${published}</strong></div><div><span>Total kompetisi</span><strong>${comps.length}</strong></div></div>
      <section class="panel-card"><div class="panel-head"><div><span class="eyebrow">RECENT</span><h3>Kompetisi terbaru</h3></div><button class="btn btn-ghost btn-sm" id="dash-go-competitions">Buka workspace</button></div><div class="data-table">${comps.slice(0,6).map(c=>`<button class="data-row data-row-button" data-open-comp="${esc(c.id)}"><div><strong>${esc(c.title)}</strong><small>${esc(c.category||'Kompetisi')} · ${fmt(c.created_at)}</small></div><span class="status-pill ${U.statusClass(c.status)}">${esc(c.status)}</span></button>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Mulai dari tombol Buat kompetisi.'})}</div></section>
    </div>`;
    root.querySelector('#dash-new-competition').onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions',competition:'new'});
    root.querySelector('#dash-go-competitions').onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions'});
    root.querySelectorAll('[data-open-comp]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions',competition:b.dataset.openComp}));
  }

  function dateField(id,label,value,required=false){
    return U.dateTimePickerMarkup(id,value,{title:label,required,help:'Pilih tanggal dan waktu lokal.'});
  }

  async function workspaceCompetition(root,orgId,competitionId){
    if(competitionId==='new') return renderNewWorkspace(root,orgId);
    if(!competitionId){
      const comps=await svc().listCompetitionsAdmin({organizerId:orgId,limit:100});
      const readiness=await Promise.all((comps||[]).map(async c=>({c,ready:await competitionReady(c,orgId)})));
      root.innerHTML=`<div class="competition-workspace-v49"><div class="workspace-list-hero"><div><span class="eyebrow">COMPETITION WORKSPACE</span><h2>Pilih kompetisi untuk dikelola</h2><p>Satu workspace untuk semua konfigurasi. UUID, foreign key, dan ID internal tidak ditampilkan.</p></div><button class="btn btn-primary" id="ws-create-new">+ Buat kompetisi</button></div><div class="competition-picker-grid-v49">${readiness.map(({c,ready})=>`<article class="competition-picker-card-v49"><div class="competition-picker-top"><span class="status-pill ${U.statusClass(c.status)}">${esc(c.status)}</span><small>${fmt(c.created_at)}</small></div><h3>${esc(c.title)}</h3><p>${esc(c.short_description||'Belum ada deskripsi.')}</p><div class="competition-picker-foot"><span>${esc(c.category||'Kompetisi')}</span><span class="competition-ready-chip ${ready?'ready':'not-ready'}">${ready?'Siap dipublikasikan':'Belum lengkap'}</span></div><div class="competition-picker-actions"><button class="btn btn-secondary btn-sm" data-pick-comp="${esc(c.id)}">Kelola</button><button class="btn btn-ghost btn-sm" data-awards-comp="${esc(c.id)}">Hadiah</button><button class="btn btn-primary btn-sm" data-publish-comp="${esc(c.id)}" ${!ready||String(c.status)!=='DRAFT'?'disabled':''}>Publish</button></div></article>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama untuk membuka workspace lengkap.'})}</div></div>`;
      root.querySelector('#ws-create-new').onclick=()=>renderNewWorkspace(root,orgId);
      root.querySelectorAll('[data-pick-comp]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions',competition:b.dataset.pickComp}));
      root.querySelectorAll('[data-awards-comp]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'awards',competition:b.dataset.awardsComp}));
      root.querySelectorAll('[data-publish-comp]').forEach(b=>b.onclick=async()=>{if(b.disabled)return;try{await svc().transitionCompetition(b.dataset.publishComp,'PUBLISHED','Publish dari daftar Competition Workspace');window.SYKA_TOAST.show('Kompetisi berhasil dipublikasikan.','success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message||'Publish gagal.','error');}});
      return;
    }
    const comps=await svc().listCompetitionsAdmin({organizerId:orgId,limit:100});
    const comp=comps.find(x=>x.id===competitionId);
    if(!comp){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Pilih kompetisi lain dari workspace.'});return;}
    await renderWorkspaceEditor(root,orgId,comp);
  }

  async function renderNewWorkspace(root,orgId){
    const c={status:'DRAFT',visibility:'PUBLIC'};
    await renderWorkspaceEditor(root,orgId,c,true);
  }

  async function renderWorkspaceEditor(root,orgId,comp,isNew=false){
    const existingId=comp.id||null;
    const [rules,levels,rewards,banks,templates]=await Promise.all([
      existingId?svc().getRegistrationRules(existingId).catch(()=>null):Promise.resolve(null),
      existingId?svc().listLevels(existingId).catch(()=>[]):Promise.resolve([]),
      existingId?svc().listRewards(existingId).catch(()=>[]):Promise.resolve([]),
      svc().listQuestionBanks({organizerId:orgId}),
      existingId?svc().listTwibbonTemplates({competitionId:existingId}):Promise.resolve([])
    ]);

    root.innerHTML=`<div class="competition-workspace-v49">
      <div class="workspace-editor-hero-v49"><div><button class="btn btn-ghost btn-sm" id="ws-back">← Semua kompetisi</button><span class="eyebrow">COMPETITION WORKSPACE</span><h2>${esc(comp.title||'Kompetisi baru')}</h2><p>${isNew?'Selesaikan bagian-bagian berikut lalu simpan. Semua relation diisi otomatis oleh sistem.':'Kelola seluruh lifecycle kompetisi dari satu halaman.'}</p></div><div class="workspace-editor-actions"><span class="status-pill ${U.statusClass(comp.status||'DRAFT')}" id="ws-current-status">${esc(comp.status||'DRAFT')}</span><button class="btn btn-secondary" id="ws-save-all">${isNew?'Simpan draft':'Simpan perubahan'}</button><button class="btn btn-ghost" id="ws-awards-top" ${isNew?'disabled':''}>Hadiah</button><button class="btn btn-primary" id="ws-publish-top" disabled>Publish</button></div></div>
      <div class="workspace-layout-v410"><aside class="workspace-progress-v410" id="workspace-progress"><div class="workspace-progress-title"><span class="eyebrow">PROGRESS</span><strong>Checklist kompetisi</strong><small>Merah = wajib diisi · hijau = siap</small></div><button type="button" class="active" data-ws-nav="ws-info"><span>1</span><b>Informasi</b></button><button type="button" data-ws-nav="ws-eligibility"><span>2</span><b>Eligibility</b></button><button type="button" data-ws-nav="ws-timeline"><span>3</span><b>Jadwal</b></button><button type="button" data-ws-nav="ws-lifecycle"><span>4</span><b>Status</b></button><button type="button" data-ws-nav="ws-twibbon"><span>5</span><b>Twibbon</b></button><button type="button" data-ws-nav="ws-questions"><span>6</span><b>Soal</b></button><button type="button" data-ws-nav="ws-publish"><span>7</span><b>Publikasi</b></button></aside><main class="workspace-layout-content-v410"><div id="ws-info">${competitionBasicsHtml(comp)}</div>
      <div id="ws-eligibility">${eligibilityHtml(rules)}</div>
      <div id="ws-timeline">${timelineHtml(comp)}</div>
      <div id="ws-lifecycle">${lifecycleSection(comp)}</div>
      <div id="ws-twibbon">${twibbonSection(templates,comp)}</div>
      <div id="ws-questions">${questionsSection()}</div>
      <div id="ws-publish"><section class="workspace-section-v49 workspace-publish-section-v410"><div class="workspace-section-head"><div><span class="eyebrow">08 · PUBLIKASI</span><h2>Siap dipublikasikan?</h2><p>Semua checklist wajib harus hijau. Tombol Publish akan aktif hanya jika data inti kompetisi, jadwal, eligibility, reward, twibbon, juknis, dan bank soal sudah siap.</p></div><span class="status-pill status-warning workspace-progress-current">Lengkapi bagian merah terlebih dahulu</span></div><div class="publish-checklist-v410" id="ws-publish-checklist"></div><div class="workspace-actions"><button class="btn btn-primary" id="ws-publish-inline" disabled>Publish kompetisi</button></div></section></div>
      <div id="ws-grading">${gradingSection()}</div>
      <div id="ws-results">${resultsSection()}</div>
      <div id="ws-awards">${awardsSection()}</div>
      <div id="ws-certificates">${certificatesSection()}</div>
      <div class="workspace-bottom-actions-v410"><button class="btn btn-secondary" id="ws-save-all-bottom">${isNew?'Buat kompetisi':'Simpan semua perubahan'}</button><button class="btn btn-primary" id="ws-publish-final" disabled>Publish</button></div><div id="ws-feedback"></div></main></div></div>`;

    root.querySelector('#ws-back').onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions'});
    U.bindDateTimePickers(root);
    bindWorkspaceEvents(root,orgId,comp,isNew,banks);
    if(existingId){
      await refreshWorkspaceData(root,orgId,comp.id);
    }
  }

  function lifecycleSection(comp){
    const current=String(comp?.status||'DRAFT').toUpperCase();
    const next=transitions[current]||[];
    return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">04 · STATUS & PUBLIKASI</span><h2>Lifecycle kompetisi</h2><p>Gunakan status sesuai urutan lifecycle RPD. Perubahan tetap divalidasi server-side.</p></div><span class="status-pill ${U.statusClass(current)}">${esc(current)}</span></div><div class="lifecycle-workspace-v49"><div class="lifecycle-current-card"><span>Status sekarang</span><strong>${esc(current)}</strong><small>Perubahan status dicatat di backend dan audit.</small></div><div class="lifecycle-action-card"><label>Ubah ke<select id="ws-next-status"><option value="">Pilih status…</option>${next.map(s=>`<option value="${s}">${s.replaceAll('_',' ')}</option>`).join('')}</select></label><label>Alasan perubahan<textarea id="ws-transition-reason" rows=2 placeholder="Opsional untuk perubahan biasa; wajib sesuai policy server jika diperlukan."></textarea></label><button class="btn btn-primary" type="button" id="ws-transition" ${next.length?'':'disabled'}>Terapkan perubahan</button></div></div></section>`;
  }

  function rewardSection(rows){
    const ranks=['FIRST','SECOND','THIRD','PARTICIPANT'];
    const byRank=Object.fromEntries((rows||[]).map(r=>[r.rank_code,r]));
    return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">04 · HADIAH</span><h2>Hadiah & penghargaan</h2><p>Atur hanya poin penilaian lomba. XP dan Koin Edu ditetapkan oleh Admin.</p></div></div><div class="reward-editor-grid-v49">${ranks.map(rank=>{const r=byRank[rank]||{};return `<div class="reward-editor-card-v49"><span class="reward-rank-v47">${rank==='FIRST'?'1':rank==='SECOND'?'2':rank==='THIRD'?'3':'•'}</span><div><strong>${rank==='PARTICIPANT'?'Peserta':'Juara '+rank.replace('FIRST','1').replace('SECOND','2').replace('THIRD','3')}</strong><label>Judul<input data-reward-title="${rank}" value="${esc(r.title||'')}" placeholder="Contoh: Juara ${rank==='FIRST'?'1':''}"></label><label>Poin<input data-reward-points="${rank}" type="number" min="0" value="${Number(r.points)||0}"></label><div class="reward-asset-note-v410"><span>Emblem / ribbon</span><strong>Diatur sebagai asset hasil/Admin</strong><small>Organizer tidak memasukkan URL.</small></div></div></div>`;}).join('')}</div><div class="workspace-actions"><button class="btn btn-primary" id="ws-save-reward">Simpan hadiah</button></div></section>`;
  }

  function twibbonSection(rows,comp){
    const t=rows?.[0];
    return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">05 · TWIBBON</span><h2>Template twibbon</h2><p>Penyelenggara menyimpan template PNG/JPG di Cloudinary. Hasil twibbon peserta dibuat lokal di perangkat.</p></div><span class="status-pill ${t?.is_active?'status-success':'status-neutral'}">${t?'Template aktif':'Belum ada template'}</span></div><div class="twibbon-editor-v49"><div class="upload-preview" id="ws-tw-preview">${t?.image_url?`<img src="${esc(t.image_url)}" alt="Twibbon"><div class="upload-file-meta"><strong>${esc(t.name||'Template')}</strong><small>Template tersimpan di Cloudinary</small></div>`:'<div class="upload-placeholder"><span>↑</span><strong>Belum ada template</strong><small>Upload PNG transparan untuk peserta.</small></div>'}</div><div class="twibbon-editor-form-v49"><label>Nama template<input id="ws-tw-name" value="${esc(t?.name||'Twibbon '+(comp.title||''))}"></label><label class="checkline"><input id="ws-tw-required" type="checkbox" ${t?.is_required?'checked':''}> Wajib saat pendaftaran</label><input type="file" id="ws-tw-file" accept="image/png,image/jpeg,image/webp" hidden><div class="upload-actions"><button type="button" class="btn btn-secondary" id="ws-tw-upload">${t?'Ganti template':'Upload template'}</button><button type="button" class="btn btn-primary" id="ws-tw-save">Simpan template</button></div><div id="ws-tw-feedback"></div></div></div></section>`;
  }

  function questionsSection(){
    return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">06 · SOAL</span><h2>Bank soal & pertanyaan</h2><p>Bank soal adalah aset organizer. Di kompetisi ini kamu cukup memilih bank soal atau membuat soal baru.</p></div></div><div class="question-inline-workspace-v49"><div class="question-bank-tools-v49"><label>Bank soal yang dipakai<select id="ws-bank-select"><option value="">Pilih bank soal…</option></select></label><div class="inline-create-grid"><input id="ws-bank-name" placeholder="Nama bank soal baru"><select id="ws-bank-grade"><option value="">Pilih kelas bank…</option><option value="SD4">Kelas 4 SD</option><option value="SD5">Kelas 5 SD</option><option value="SD6">Kelas 6 SD</option><option value="SMP1">Kelas 1 SMP</option><option value="SMP2">Kelas 2 SMP</option><option value="SMP3">Kelas 3 SMP</option><option value="SMA1">Kelas 1 SMA</option><option value="SMA2">Kelas 2 SMA</option><option value="SMA3">Kelas 3 SMA</option></select><button class="btn btn-secondary" type="button" id="ws-bank-create">+ Buat bank</button></div><button class="btn btn-primary btn-sm" type="button" id="ws-bank-bind" disabled>Gunakan bank ini untuk kompetisi</button><div class="question-import-tools-v410"><button class="btn btn-secondary btn-sm" type="button" id="ws-download-template">Download template Excel</button><label class="btn btn-secondary btn-sm">Import Excel / CSV<input type="file" id="ws-import-sheet" accept=".xlsx,.xls,.csv,.tsv" hidden></label></div><small class="form-hint">Bank soal tetap menjadi milik organizer. Untuk Free, siapkan bank/soal per kelas secara manual. Premium/Pro dapat memakai template Excel.</small></div><div class="question-inline-editor-v49"><div id="ws-question-list"></div><div class="question-builder-inline-v49"><div class="question-builder-head-v49"><div><span class="eyebrow">QUESTION BUILDER</span><strong>Tambah soal</strong></div></div><div class="form-grid-2"><label>Jenis<select id="ws-q-type">${Object.entries(TYPE_META).map(([v,m])=>`<option value="${v}">${m.label}</option>`).join('')}</select></label><label>Poin<input id="ws-q-points" type="number" min="0" step="0.5" value="1"></label></div><label class="checkline"><input id="ws-q-bind-competition" type="checkbox" checked> Gunakan soal ini langsung untuk kompetisi ini</label><label>Pertanyaan<textarea id="ws-q-prompt" rows="4" placeholder="Tulis pertanyaan…"></textarea></label><div id="ws-q-type-fields"></div><label class="checkline"><input id="ws-q-required" type="checkbox" checked> Wajib dijawab</label><button class="btn btn-primary" type="button" id="ws-q-save">Simpan soal</button><div id="ws-q-feedback"></div></div></div></div></section>`;
  }

  function participantsSection(){
    return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">07 · PESERTA</span><h2>Peserta & persetujuan</h2><p>Semua peserta tampil di tabel yang sama. Tidak ada UUID manual.</p></div><label class="compact-filter">Status<select id="ws-participant-filter"><option value="">Semua</option><option value="PENDING">Menunggu</option><option value="ACTIVE">Disetujui</option><option value="REJECTED">Ditolak</option></select></label></div><div id="ws-participant-table" class="data-table"></div></section>`;
  }

  function gradingSection(){return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">08 · GRADING</span><h2>Penilaian</h2><p>Pilih attempt dari peserta dan beri score/feedback tanpa memasukkan ID.</p></div></div><div id="ws-grading-table" class="data-table"></div></section>`;}
  function resultsSection(){return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">09 · HASIL</span><h2>Hasil kompetisi</h2><p>Menampilkan attempt yang sudah finalized.</p></div></div><div id="ws-results-table" class="data-table"></div></section>`;}
  function awardsSection(){return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">10 · AWARDS</span><h2>Awards & emblem</h2><p>Award event akan mengikuti hasil final dan konfigurasi reward.</p></div></div><div id="ws-awards-table" class="data-table"></div></section>`;}
  function certificatesSection(){return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">11 · SERTIFIKAT</span><h2>Sertifikat</h2><p>Kelola status sertifikat peserta dari workspace ini. Template final dapat diproses backend tanpa UUID.</p></div></div><div id="ws-cert-table" class="data-table"></div></section>`;}

  async function refreshWorkspaceData(root,orgId,competitionId){
    const [banks,questions,participants,attempts,finalized,awards,certificates]=await Promise.all([
      svc().listQuestionBanks({organizerId:orgId}),
      svc().listQuestions({competitionId}),
      svc().listRegistrations({competitionId}),
      svc().listAttempts({competitionId,status:'SUBMITTED'}).catch(()=>[]),
      svc().listAttempts({competitionId,status:'FINALIZED'}).catch(()=>[]),
      svc().listAwards({competitionId}),
      svc().listCertificates({competitionId})
    ]);
    const bankSelect=root.querySelector('#ws-bank-select');
    if(bankSelect){bankSelect.innerHTML='<option value="">Pilih bank soal…</option>'+banks.map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');}
    const qList=root.querySelector('#ws-question-list');
    if(qList){ const selectedBank=bankSelect?.value||''; const shown=(questions||[]).filter(q=>!selectedBank||q.question_bank_id===selectedBank); qList.innerHTML=shown.length?shown.map((q,i)=>`<div class="question-inline-row-v49"><span>${i+1}</span><div><strong>${esc(q.prompt)}</strong><small>${esc(TYPE_META[q.type]?.label||q.type)} · ${Number(q.points||0)} poin · ${q.required?'Wajib':'Opsional'} · ${q.competition_id?'Terikat kompetisi':'Bank soal umum'}</small></div><button class="btn btn-ghost btn-xs" data-q-delete="${esc(q.id)}">Hapus</button></div>`).join(''):'<div class="inline-empty">Belum ada soal pada pilihan bank ini.</div>'; }
    root.querySelectorAll('[data-q-delete]').forEach(b=>b.onclick=async()=>{try{await svc().moderateQuestion(b.dataset.qDelete,'ARCHIVED');b.closest('.question-inline-row-v49')?.remove();window.SYKA_TOAST.show('Soal diarsipkan.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Gagal mengarsipkan soal.','error');}});
    renderParticipants(root,participants);
    renderGrading(root,attempts);
    renderResults(root,finalized);
    renderAwards(root,awards);
    renderCertificates(root,certificates);
  }

  function renderParticipants(root,rows){
    const el=root.querySelector('#ws-participant-table');if(!el)return;
    const filter=root.querySelector('#ws-participant-filter')?.value||'';
    const list=(rows||[]).filter(r=>!filter||r.status===filter);
    el.innerHTML=list.map(r=>`<div class="data-row organizer-participant-row-v49"><div><strong>${esc(r.profiles?.full_name||'Peserta')}</strong><small>@${esc(r.profiles?.username||'—')} · ${esc(r.profiles?.institution||'')} · ${esc(r.profiles?.grade||'')}</small><small>Social proof: ${esc(r.social_proof_url||'—')}</small></div><div class="row-actions-v49"><span class="status-pill ${U.statusClass(r.status)}">${esc(r.status)}</span>${r.status==='PENDING'?`<button class="btn btn-secondary btn-sm" data-approve="${esc(r.id)}">Approve</button><button class="btn btn-ghost btn-sm" data-reject="${esc(r.id)}">Reject</button>`:''}</div></div>`).join('')||'<div class="inline-empty">Belum ada peserta pada filter ini.</div>';
    el.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{try{await svc().reviewRegistration(b.dataset.approve,'APPROVE');window.SYKA_TOAST.show('Peserta disetujui.','success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message||'Approve gagal.','error');}});
    el.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>rejectParticipant(b.dataset.reject));
  }

  function rejectParticipant(id){
    window.SYKA_MODAL.open({title:'Tolak peserta',html:`<form id="ws-reject-form" class="form-card"><label>Alasan penolakan *<textarea id="ws-reason" rows="4" required placeholder="Tuliskan alasan yang akan diterima peserta…"></textarea></label><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Tolak peserta</button></div></form>`,onOpen:b=>{b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();b.querySelector('#ws-reject-form').onsubmit=async e=>{e.preventDefault();try{await svc().reviewRegistration(id,'REJECT',b.querySelector('#ws-reason').value.trim());window.SYKA_MODAL.close();window.SYKA_TOAST.show('Peserta ditolak.','success');window.SYKA_ROUTER.refresh();}catch(err){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(err.message||'Reject gagal.')}</div>`);}};}});
  }

  async function awardsPage(root,orgId,competitionId){
    if(!competitionId){root.innerHTML=window.SYKA_EMPTY.render({title:'Pilih kompetisi terlebih dahulu',text:'Buka Kompetisi lalu pilih Hadiah.'});return;}
    const comps=await svc().listCompetitionsAdmin({organizerId:orgId,limit:200});
    const comp=comps.find(c=>c.id===competitionId);
    if(!comp){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Pilih kompetisi yang tersedia di workspace.'});return;}
    const attempts=await svc().listAttempts({competitionId});
    const awards=await svc().listAwards({competitionId});
    const finished=['SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','ARCHIVED'].includes(String(comp.status||''));
    root.innerHTML=`<div class="awards-management-page">
      <div class="awards-page-head"><div><span class="eyebrow">HADIAH & PENGHARGAAN</span><h1>${esc(comp.title)}</h1><p>Kelola ribbon/emblem, pemenang, dan sertifikat dari satu tempat. Data peserta tetap mengikuti hasil kompetisi.</p></div><div class="awards-page-actions"><button class="btn btn-ghost" id="awards-back">← Kompetisi</button><span class="status-pill ${U.statusClass(comp.status)}">${esc(comp.status)}</span></div></div>
      <div class="awards-status-note ${finished?'ready':'locked'}"><strong>${finished?'Hasil tersedia':'Sertifikat belum dibuka'}</strong><span>${finished?'Daftar peserta dan hasil dapat difilter berdasarkan tingkat.':'Sebelum lomba selesai, hanya ribbon/emblem untuk Juara 1–3 dan Peserta yang dapat dikelola.'}</span></div>
      <section class="panel-card awards-config-card"><div class="panel-head"><div><span class="eyebrow">EMBLEM / RIBBON</span><h3>Asset penghargaan</h3><p>PNG/JPG maksimal 1080×1080 px.</p></div></div><div class="award-asset-grid"><label>Juara 1<input type="file" accept="image/png,image/jpeg" data-award-asset="FIRST"></label><label>Juara 2<input type="file" accept="image/png,image/jpeg" data-award-asset="SECOND"></label><label>Juara 3<input type="file" accept="image/png,image/jpeg" data-award-asset="THIRD"></label><label>Peserta<input type="file" accept="image/png,image/jpeg" data-award-asset="PARTICIPANT"></label></div></section>
      <section class="panel-card awards-results-card"><div class="panel-head"><div><span class="eyebrow">HASIL</span><h3>Pemenang & sertifikat</h3></div><label class="compact-filter">Tingkat<select id="awards-grade-filter"><option value="">Semua tingkat</option><option value="SD4">SD 4</option><option value="SD5">SD 5</option><option value="SD6">SD 6</option><option value="SMP7">SMP 7</option><option value="SMP8">SMP 8</option><option value="SMP9">SMP 9</option><option value="SMA10">SMA 10</option><option value="SMA11">SMA 11</option><option value="SMA12">SMA 12</option><option value="UMUM">Umum</option></select></label></div><div class="awards-table-wrap"><table class="awards-table"><thead><tr><th>No</th><th>Juara / Status</th><th>Nilai</th><th>Nama Peserta</th><th>Sekolah / Instansi</th><th>Upload Sertifikat</th></tr></thead><tbody id="awards-results-body"></tbody></table></div></section>
    </div>`;
    const body=root.querySelector('#awards-results-body');
    function renderRows(){
      const grade=root.querySelector('#awards-grade-filter').value;
      let rows=(attempts||[]).filter(r=>['FINALIZED','GRADING','SUBMITTED'].includes(String(r.status||'')) && (!grade||String(r.profiles?.grade||'').toUpperCase()===grade));
      const ranked=rows.slice().sort((a,b)=>Number(b.score||0)-Number(a.score||0));
      body.innerHTML=ranked.map((r,i)=>{const rank=i<3?`Juara ${i+1}`:'Peserta';const certDisabled=!finished;return `<tr><td>${i+1}</td><td><span class="status-pill ${i<3?'status-success':'status-neutral'}">${rank}</span></td><td>${Number(r.score||0).toLocaleString('id-ID')}</td><td>${esc(r.profiles?.full_name||'Peserta')}</td><td>${esc(r.profiles?.institution||'—')}</td><td><button type="button" class="btn btn-secondary btn-sm" ${certDisabled?'disabled':''} data-cert-upload="${esc(r.participant_id||'')}">${certDisabled?'Tersedia setelah hasil':'Upload'}</button></td></tr>`;}).join('')||`<tr><td colspan="6"><div class="inline-empty">Belum ada hasil untuk filter ini.</div></td></tr>`;
    }
    renderRows(); root.querySelector('#awards-grade-filter').addEventListener('change',renderRows); root.querySelector('#awards-back').onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions',competition:competitionId});
  }

  function renderGrading(root,rows){
    const el=root.querySelector('#ws-grading-table');if(!el)return;
    el.innerHTML=(rows||[]).map(r=>`<div class="data-row grading-row-v49"><div><strong>${esc(r.profiles?.full_name||'Peserta')}</strong><small>${esc(r.status)} · Mulai ${fmt(r.started_at)}</small></div><div class="inline-score"><input data-score="${esc(r.id)}" type="number" step="0.01" min="0" placeholder="Score" value="${r.score??''}"><button class="btn btn-secondary btn-sm" data-finalize="${esc(r.id)}">Finalisasi</button></div></div>`).join('')||'<div class="inline-empty">Belum ada attempt yang siap dinilai.</div>';
    el.querySelectorAll('[data-finalize]').forEach(b=>b.onclick=async()=>{const input=el.querySelector(`[data-score="${CSS.escape(b.dataset.finalize)}"]`);try{await svc().finalizeAttempt(b.dataset.finalize,Number(input?.value||0));window.SYKA_TOAST.show('Hasil difinalisasi.','success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message||'Finalisasi gagal.','error');}});
  }

  function renderResults(root,rows){const el=root.querySelector('#ws-results-table');if(!el)return;el.innerHTML=(rows||[]).map(r=>`<div class="data-row"><div><strong>${esc(r.profiles?.full_name||'Peserta')}</strong><small>Final ${fmt(r.finalized_at)} · ${esc(r.status)}</small></div><strong>${Number(r.score||0).toLocaleString('id-ID')} pts</strong></div>`).join('')||'<div class="inline-empty">Belum ada hasil final.</div>';}
  function renderAwards(root,rows){const el=root.querySelector('#ws-awards-table');if(!el)return;el.innerHTML=(rows||[]).map(r=>`<div class="data-row"><div><strong>${esc(r.title||'Award')}</strong><small>${esc(r.rank_code||'PARTICIPANT')} · ${esc(r.profiles?.full_name||'Peserta')}</small></div><span class="chip">${Number(r.points||0)} pts</span></div>`).join('')||'<div class="inline-empty">Award akan muncul setelah result event dipublish.</div>';}
  function renderCertificates(root,rows){const el=root.querySelector('#ws-cert-table');if(!el)return;el.innerHTML=(rows||[]).map(r=>`<div class="data-row"><div><strong>${esc(r.profiles?.full_name||'Peserta')}</strong><small>@${esc(r.profiles?.username||'user')} · Revisi ${esc(r.current_revision||1)} · ${fmt(r.updated_at||r.created_at)}</small></div><span class="status-pill ${U.statusClass(r.status)}">${esc(r.status)}</span></div>`).join('')||'<div class="inline-empty">Belum ada sertifikat yang terbit.</div>';}

  function bindWorkspaceEvents(root,orgId,comp,isNew,banks){
    root.querySelectorAll('[data-ws-nav]').forEach(btn=>btn.onclick=()=>{root.querySelectorAll('[data-ws-nav]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.getElementById(btn.dataset.wsNav)?.scrollIntoView({behavior:'smooth',block:'start'}); if(btn.dataset.wsNav==='ws-info') root.querySelector('#ws-title')?.focus();});
    const updateProgress=()=>{
      const checks={
        'ws-info':!!root.querySelector('#ws-title')?.value.trim() && !!root.querySelector('#ws-poster-preview img') && (!!root.querySelector('#ws-juknis-preview .upload-file-meta') || !!root.querySelector('#ws-juknis-preview a') || !!root.querySelector('#ws-juknis-preview embed')),
        'ws-eligibility':root.querySelectorAll('[data-grade-scope]:checked').length>0,
        'ws-timeline':['ws-rs','ws-re','ws-start','ws-end'].every(id=>!!root.querySelector(`[data-dt-value="${id}"]`)?.value),
        'ws-lifecycle':true,
        'ws-twibbon':!!root.querySelector('#ws-tw-name')?.value.trim() && !!root.querySelector('#ws-tw-preview img'),
        'ws-questions':!!root.querySelector('#ws-bank-select')?.value,
        'ws-publish':true
      };
      root.querySelectorAll('[data-ws-nav]').forEach(b=>{const ok=checks[b.dataset.wsNav];b.classList.toggle('is-complete',!!ok);b.classList.toggle('is-required',!ok);const mark=b.querySelector('span');if(mark)mark.textContent=ok?'✓':'✕';});
      const ready=!isNew&&checks['ws-info']&&checks['ws-eligibility']&&checks['ws-timeline']&&checks['ws-twibbon']&&checks['ws-questions']&&((rewards||[]).length>0);
      root.querySelector('#ws-publish-top')?.toggleAttribute('disabled',!ready);
      root.querySelector('#ws-publish-final')?.toggleAttribute('disabled',!ready);
      const label=root.querySelector('.workspace-progress-current');
      if(label){label.textContent=ready?'Siap dipublikasikan':'Lengkapi bagian merah terlebih dahulu';label.className='status-pill '+(ready?'status-success':'status-warning')+' workspace-progress-current';}
      const checklist=root.querySelector('#ws-publish-checklist');
      if(checklist){const labels={info:'Informasi & poster',eligibility:'Eligibility',timeline:'Jadwal',lifecycle:'Status',twibbon:'Template twibbon',questions:'Bank soal',awards:'Hadiah tersedia'};checklist.innerHTML=Object.entries(labels).map(([key,labelText])=>{const map={'info':'ws-info','eligibility':'ws-eligibility','timeline':'ws-timeline','lifecycle':'ws-lifecycle','twibbon':'ws-twibbon','questions':'ws-questions','awards':'__awards'};const ok=key==='awards'?((rewards||[]).length>0):checks[map[key]];return `<div class="publish-check-item ${ok?'ok':'bad'}"><span>${ok?'✓':'!'}</span><strong>${labelText}</strong><small>${ok?'Siap':'Wajib dilengkapi'}</small></div>`}).join('');}
      root.querySelector('#ws-publish-inline')?.toggleAttribute('disabled',!ready);
    };
    root.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('input',updateProgress));
    root.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('change',updateProgress));
    root.querySelector('#ws-awards-top')?.addEventListener('click',()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'awards',competition:comp.id}));
    root.querySelector('#ws-publish-top')?.addEventListener('click',()=>root.querySelector('#ws-publish-final')?.click());
    root.querySelector('#ws-publish-final')?.addEventListener('click',async()=>{try{await saveWorkspace(root,orgId,comp,isNew);const id=comp.id||window.SYKA_STATE.getState().route.query.competition;if(id&&id!=='new'){await svc().transitionCompetition(id,'PUBLISHED','Publish dari Competition Workspace');window.SYKA_TOAST.show('Kompetisi berhasil dipublikasikan.','success');window.SYKA_ROUTER.refresh();}}catch(e){window.SYKA_TOAST.show(e.message||'Publish gagal.','error');}});
    root.querySelector('#ws-publish-inline')?.addEventListener('click',()=>root.querySelector('#ws-publish-final')?.click());

    root.querySelector('#ws-check-name')?.addEventListener('click',async()=>{const out=root.querySelector('#ws-name-check');out.textContent='Memeriksa ketersediaan nama…';try{const r=await svc().checkCompetitionName(root.querySelector('#ws-title').value.trim(),comp.id||null);out.textContent=r.available?`✓ Nama tersedia · slug otomatis: ${r.slug}`:`✕ ${r.reason}`;out.className=r.available?'field-success':'field-error';}catch(e){out.textContent=e.message||'Gagal memeriksa nama.';out.className='field-error';}});
    let pendingPoster=null,pendingPosterUrl=null,pendingJuknis=null,pendingTwibbon=null,pendingTwibbonUrl=null;
    const saveButtons=[root.querySelector('#ws-save-all'),root.querySelector('#ws-save-all-bottom')].filter(Boolean);
    const posterInput=root.querySelector('#ws-poster-file');
    root.querySelector('#ws-poster-btn')?.addEventListener('click',()=>posterInput.click());
    posterInput?.addEventListener('change',()=>{const f=posterInput.files?.[0];if(!f)return;if(f.size>10000000){window.SYKA_TOAST.show('Poster maksimal 10 MB.','error');return;}pendingPoster=f;pendingPosterUrl=URL.createObjectURL(f);root.querySelector('#ws-poster-preview').innerHTML=`<img src="${pendingPosterUrl}" alt="Poster baru"><div class="upload-file-meta"><strong>${esc(f.name)}</strong><small>Belum diupload. Akan dikirim saat disimpan.</small></div>`;});
    const juknisInput=root.querySelector('#ws-juknis-file');
    root.querySelector('#ws-juknis-btn')?.addEventListener('click',()=>juknisInput.click());
    juknisInput?.addEventListener('change',()=>{const f=juknisInput.files?.[0];if(!f)return;if(f.size>15000000){window.SYKA_TOAST.show('Juknis maksimal 15 MB.','error');return;}pendingJuknis=f;root.querySelector('#ws-juknis-preview').innerHTML=`<div class="upload-file-meta"><strong>${esc(f.name)}</strong><small>Belum diupload. Akan dikirim saat disimpan.</small></div>`;});

    async function saveBasics(){
      const title=root.querySelector('#ws-title').value.trim(); if(!title)throw new Error('Nama kompetisi wajib diisi.'); const nameCheck=await svc().checkCompetitionName(title,comp.id||null); if(!nameCheck.available)throw new Error(nameCheck.reason); const payload={organizer_id:orgId,title,slug:nameCheck.slug,category:root.querySelector('#ws-category').value,visibility:root.querySelector('#ws-visibility').value,short_description:root.querySelector('#ws-short').value.trim()||null};
      let saved=comp.id?await svc().saveCompetition(payload,comp.id):await svc().saveCompetition({...payload,status:'DRAFT'});
      if(pendingPoster){const media=await window.SYKA_CLOUDINARY.uploadFile(pendingPoster,{folder:'sykabelajar/competitions/posters',maxFileSize:10000000});saved=await svc().saveCompetition({poster_url:media.secure_url,poster_public_id:media.public_id||null,poster_width:media.width||null,poster_height:media.height||null,poster_version:media.version||null,poster_resource_type:media.resource_type||'image'},saved.id);}
      if(pendingJuknis){const doc=await window.SYKA_CLOUDINARY.uploadDocumentFile(pendingJuknis,{folder:'sykabelajar/competitions/juknis',maxFileSize:15000000});saved=await svc().saveCompetition({juknis_url:doc.secure_url,juknis_public_id:doc.public_id||null},saved.id);}
      if(isNew)window.history.replaceState({},'',`${location.pathname}?route=/organizer&organizer=${encodeURIComponent(orgId)}&tab=competitions&competition=${encodeURIComponent(saved.id)}`);
      window.SYKA_TOAST.show('Informasi kompetisi tersimpan.','success');return saved;
    }

    saveButtons.forEach(b=>b.onclick=async()=>{try{b.disabled=true;const saved=await saveBasics();window.location.href=location.pathname+`?route=/organizer&organizer=${encodeURIComponent(orgId)}&tab=competitions&competition=${encodeURIComponent(saved.id)}`;}catch(e){window.SYKA_TOAST.show(e.message||'Gagal menyimpan kompetisi.','error');}finally{b.disabled=false;}});

    root.querySelector('#ws-save-basic')?.addEventListener('click',async()=>{try{await saveBasics();window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message||'Gagal menyimpan informasi.','error');}});
    root.querySelector('#ws-save-rules')?.addEventListener('click',async()=>{try{if(!comp.id)throw new Error('Simpan informasi kompetisi terlebih dahulu.');await svc().saveRegistrationRules({allowed_grades:[...root.querySelectorAll('[data-grade-scope]:checked')].map(x=>x.dataset.gradeScope),twibbon_required:root.querySelector('#ws-tw-required').checked,social_proof_required:root.querySelector('#ws-social-required').checked},comp.id);window.SYKA_TOAST.show('Aturan peserta tersimpan.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Gagal menyimpan aturan.','error');}});
    root.querySelector('#ws-save-timeline')?.addEventListener('click',async()=>{try{if(!comp.id)throw new Error('Simpan informasi kompetisi terlebih dahulu.');await svc().saveCompetition({registration_starts_at:U.readDateTimeField('ws-rs',root),registration_ends_at:U.readDateTimeField('ws-re',root),starts_at:U.readDateTimeField('ws-start',root),ends_at:U.readDateTimeField('ws-end',root),announcement_at:U.readDateTimeField('ws-ann',root)},comp.id);window.SYKA_TOAST.show('Jadwal tersimpan.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Gagal menyimpan jadwal.','error');}});
    root.querySelector('#ws-transition')?.addEventListener('click',async()=>{try{const next=root.querySelector('#ws-next-status').value;if(!next)throw new Error('Pilih status tujuan terlebih dahulu.');await svc().transitionCompetition(comp.id,next,root.querySelector('#ws-transition-reason').value.trim()||null);window.SYKA_TOAST.show(`Status diubah menjadi ${next}.`,'success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message||'Perubahan status gagal.','error');}});


    const twInput=root.querySelector('#ws-tw-file');
    root.querySelector('#ws-tw-upload')?.addEventListener('click',()=>twInput.click());
    twInput?.addEventListener('change',()=>{const f=twInput.files?.[0];if(!f)return;if(f.size>10000000){window.SYKA_TOAST.show('Template maksimal 10 MB.','error');return;}pendingTwibbon=f;pendingTwibbonUrl=URL.createObjectURL(f);root.querySelector('#ws-tw-preview').innerHTML=`<img src="${pendingTwibbonUrl}" alt="Template"><div class="upload-file-meta"><strong>${esc(f.name)}</strong><small>Belum diupload. Akan dikirim saat template disimpan.</small></div>`;});
    root.querySelector('#ws-tw-save')?.addEventListener('click',async()=>{try{if(!comp.id)throw new Error('Simpan informasi kompetisi terlebih dahulu.');if(!pendingTwibbon&&!root.querySelector('#ws-tw-name').value.trim())throw new Error('Nama template wajib diisi.');let media=null;if(pendingTwibbon)media=await window.SYKA_CLOUDINARY.uploadFile(pendingTwibbon,{folder:'sykabelajar/competitions/twibbon',maxFileSize:10000000,formats:['png','jpg','jpeg','webp']});if(media||root.querySelector('#ws-tw-name').value.trim()){await svc().saveTwibbonTemplate({organizer_id:orgId,competition_id:comp.id,name:root.querySelector('#ws-tw-name').value.trim(),image_url:media?.secure_url||null,public_id:media?.public_id||null,is_required:root.querySelector('#ws-tw-required').checked,is_active:true,config:{width:media?.width||null,height:media?.height||null,version:media?.version||null,resource_type:media?.resource_type||'image'}},null);}window.SYKA_TOAST.show('Template twibbon tersimpan.','success');}catch(e){root.querySelector('#ws-tw-feedback').innerHTML=`<div class="inline-error">${esc(e.message||'Gagal menyimpan template.')}</div>`;}});

    root.querySelector('#ws-bank-create')?.addEventListener('click',async()=>{try{const name=root.querySelector('#ws-bank-name').value.trim();if(!name)throw new Error('Nama bank soal wajib diisi.');await svc().saveQuestionBank({organizer_id:orgId,name,description:null,grade_code:root.querySelector('#ws-bank-grade')?.value||null,is_active:true});root.querySelector('#ws-bank-name').value='';await refreshWorkspaceData(root,orgId,comp.id);window.SYKA_TOAST.show('Bank soal dibuat.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Gagal membuat bank soal.','error');}});
    root.querySelector('#ws-bank-bind')?.addEventListener('click',async()=>{const bankId=root.querySelector('#ws-bank-select')?.value;if(!bankId) return; try{const rows=await svc().listQuestions({bankId}); if(!rows.length){window.SYKA_TOAST.show('Bank soal ini belum memiliki pertanyaan.','warning');return;} for(const q of rows){ if(q.competition_id!==comp.id){ await svc().saveQuestion({competition_id:comp.id},q.id); } } window.SYKA_TOAST.show(`${rows.length} soal dikaitkan ke kompetisi.`,'success'); await refreshWorkspaceData(root,orgId,comp.id);}catch(e){window.SYKA_TOAST.show(e.message||'Gagal mengaitkan bank soal.','error');}});
    root.querySelector('#ws-bank-select')?.addEventListener('change',async e=>{const bankId=e.target.value; const bind=root.querySelector('#ws-bank-bind'); if(bind)bind.disabled=!bankId;if(!bankId){await refreshWorkspaceData(root,orgId,comp.id);return;}try{const rows=await svc().listQuestions({bankId});const qList=root.querySelector('#ws-question-list');qList.innerHTML=rows.length?rows.map((q,i)=>`<div class="question-inline-row-v49"><span>${i+1}</span><div><strong>${esc(q.prompt)}</strong><small>${esc(TYPE_META[q.type]?.label||q.type)} · ${Number(q.points||0)} poin · ${q.competition_id?'Terikat kompetisi':'Bank soal umum'}</small></div><button class="btn btn-ghost btn-xs" data-q-delete="${esc(q.id)}">Arsipkan</button></div>`).join(''):'<div class="inline-empty">Belum ada soal dalam bank ini.</div>';qList.querySelectorAll('[data-q-delete]').forEach(b=>b.onclick=async()=>{try{await svc().moderateQuestion(b.dataset.qDelete,'ARCHIVED');b.closest('.question-inline-row-v49')?.remove();window.SYKA_TOAST.show('Soal diarsipkan.','success');}catch(err){window.SYKA_TOAST.show(err.message||'Gagal mengarsipkan soal.','error');}});}catch(err){window.SYKA_TOAST.show(err.message||'Gagal memuat bank soal.','error');}});
    root.querySelector('#ws-q-type')?.addEventListener('change',()=>renderQuestionFields(root,root.querySelector('#ws-q-type').value));
    renderQuestionFields(root,root.querySelector('#ws-q-type')?.value||'multiple_choice');
    root.querySelector('#ws-download-template')?.addEventListener('click',async()=>{try{await downloadQuestionTemplate();}catch(e){window.SYKA_TOAST.show(e.message||'Template gagal dibuat.','error');}});
    root.querySelector('#ws-import-sheet')?.addEventListener('change',async e=>{try{const plan=await svc().listActiveOrganizerPlan(orgId);if(!['PREMIUM','PRO'].includes(plan?.plan_code)){throw new Error('Import Excel tersedia untuk paket Premium dan Pro.');}const file=e.target.files?.[0];if(!file)return;const rows=await parseQuestionSheet(file);const bankId=root.querySelector('#ws-bank-select')?.value;if(!bankId)throw new Error('Pilih bank soal terlebih dahulu.');const imported=await importQuestionRows(rows,bankId,comp.id);window.SYKA_TOAST.show(`${imported} soal berhasil diimport.`,'success');await refreshWorkspaceData(root,orgId,comp.id);}catch(err){window.SYKA_TOAST.show(err.message||'Import gagal.','error');}e.target.value='';});
    root.querySelector('#ws-q-save')?.addEventListener('click',async()=>saveInlineQuestion(root,orgId,comp.id));
    root.querySelector('#ws-participant-filter')?.addEventListener('change',async()=>{const rows=await svc().listRegistrations({competitionId:comp.id,status:''});renderParticipants(root,rows);});
  }

  function renderQuestionFields(root,type){
    const box=root.querySelector('#ws-q-type-fields'); if(!box)return;
    if(type==='true_false'){
      box.innerHTML=`<div class="option-builder-v49"><div class="inline-option-row"><label><input type="radio" name="ws-tf" value="true" checked> Benar</label><label><input type="radio" name="ws-tf" value="false"> Salah</label></div></div>`;
      return;
    }
    if(TYPE_META[type]?.options){
      box.innerHTML=`<div class="option-builder-v49" id="ws-inline-options"><div class="option-builder-head-v49"><strong>Opsi jawaban</strong><small>Pilih satu jawaban benar untuk Pilihan Ganda, atau beberapa untuk Multi-jawaban.</small></div>${['A','B','C','D'].map((l,i)=>`<div class="option-row-v47"><input data-inline-label value="${l}" class="input" placeholder="Label"><input data-inline-value class="input" placeholder="Teks jawaban"><label><input data-inline-correct type="${type==='multiple_checkbox'?'checkbox':'radio'}" name="ws-correct"> Benar</label></div>`).join('')}</div>`;
      return;
    }
    if(type==='short_answer'){
      box.innerHTML=`<div class="option-builder-v49"><label>Jawaban yang diterima<textarea id="ws-short-answers" rows="3" placeholder="Satu jawaban per baris"></textarea></label></div>`;return;
    }
    if(type==='essay'){
      box.innerHTML=`<div class="option-builder-v49"><label>Rubrik penilaian<textarea id="ws-rubric" rows="4" placeholder="Kriteria penilaian essay…"></textarea></label></div>`;return;
    }
    box.innerHTML=`<div class="option-builder-v49"><div class="form-grid-2"><label>Format<select id="ws-file-format"><option value="pdf">PDF</option><option value="image">Gambar</option><option value="document">Dokumen</option><option value="mixed">Campuran</option></select></label><label>Maksimal ukuran (MB)<input id="ws-file-size" type="number" min="1" max="50" value="10"></label></div><label class="checkline"><input id="ws-file-required" type="checkbox" checked> File wajib</label></div>`;
  }

  async function saveInlineQuestion(root,orgId,competitionId){
    try{
      const bankId=root.querySelector('#ws-bank-select').value;
      if(!bankId)throw new Error('Pilih bank soal terlebih dahulu.');
      const type=root.querySelector('#ws-q-type').value;
      const prompt=root.querySelector('#ws-q-prompt').value.trim();
      if(!prompt)throw new Error('Pertanyaan wajib diisi.');
      const config={}; let options=[];
      if(TYPE_META[type]?.options){options=[...root.querySelectorAll('[data-inline-value]')].map((el,i)=>({label:root.querySelectorAll('[data-inline-label]')[i]?.value.trim()||String.fromCharCode(65+i),value:el.value.trim(),is_correct:!!root.querySelectorAll('[data-inline-correct]')[i]?.checked})).filter(x=>x.value);if(options.length<2)throw new Error('Minimal 2 opsi.');const correct=options.filter(x=>x.is_correct).length;if(type==='multiple_choice'||type==='true_false'){if(correct!==1)throw new Error('Pilih tepat satu jawaban benar.');}else if(correct<1)throw new Error('Pilih minimal satu jawaban benar.');config.options=options.map(x=>x.value);}else if(type==='short_answer'){config.accepted_answers=(root.querySelector('#ws-short-answers').value||'').split('\n').map(x=>x.trim()).filter(Boolean);if(!config.accepted_answers.length)throw new Error('Isi minimal satu jawaban yang diterima.');}else if(type==='essay'){config.rubric=root.querySelector('#ws-rubric').value.trim()||null;}else{config.allowed_mime=root.querySelector('#ws-file-format').value;config.max_size_mb=Number(root.querySelector('#ws-file-size').value)||10;config.file_required=root.querySelector('#ws-file-required').checked;}
      const bindToCompetition=root.querySelector('#ws-q-bind-competition')?.checked!==false; const currentQuestions=await svc().listQuestions({bankId}); const q=await svc().saveQuestion({question_bank_id:bankId,competition_id:bindToCompetition?competitionId:null,type,prompt,points:Number(root.querySelector('#ws-q-points').value)||0,required:root.querySelector('#ws-q-required').checked,display_order:currentQuestions.length,status:'DRAFT',config});
      if(options.length)await svc().replaceOptions(q.id,options);
      root.querySelector('#ws-q-prompt').value='';window.SYKA_TOAST.show('Soal tersimpan.','success');await refreshWorkspaceData(root,orgId,competitionId);
    }catch(e){root.querySelector('#ws-q-feedback').innerHTML=`<div class="inline-error">${esc(e.message||'Gagal menyimpan soal.')}</div>`;}
  }

  async function participantsPage(root,orgId,competitionId=null){
    const comps=await svc().listCompetitionsAdmin({organizerId:orgId,limit:100});
    const activeId=competitionId||comps[0]?.id||null;
    root.innerHTML=`<section class="control-section-v410"><div class="control-section-head-v410"><div><span class="eyebrow">PESERTA & PERSETUJUAN</span><h2>Review peserta</h2><p>Pilih program dari daftar. Sistem mengisi konteks kompetisi otomatis.</p></div><label class="context-select-v410">Program<select id="participant-competition-select">${comps.map(c=>`<option value="${esc(c.id)}" ${c.id===activeId?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label></div><div class="participant-toolbar-v410"><select id="participant-status-filter"><option value="">Semua status</option><option value="PENDING">Menunggu persetujuan</option><option value="ACTIVE">Disetujui</option><option value="REJECTED">Ditolak</option></select></div><div id="participants-page-table" class="data-table"></div></section>`;
    async function load(){const id=root.querySelector('#participant-competition-select')?.value;if(!id)return;const status=root.querySelector('#participant-status-filter')?.value||'';const rows=await svc().listRegistrations({competitionId:id,status});const el=root.querySelector('#participants-page-table');el.innerHTML=rows.map(r=>`<div class="data-row organizer-participant-row-v49"><div><strong>${esc(r.profiles?.full_name||'Peserta')}</strong><small>@${esc(r.profiles?.username||'—')} · ${esc(r.profiles?.institution||'')} · ${esc(r.profiles?.grade||'')}</small><small>${esc(r.social_proof_url||'Belum ada social proof')}</small></div><div class="row-actions-v49"><span class="status-pill ${U.statusClass(r.status)}">${esc(r.status)}</span>${r.status==='PENDING'?`<button class="btn btn-secondary btn-sm" data-approve="${esc(r.id)}">Approve</button><button class="btn btn-danger btn-sm" data-reject="${esc(r.id)}">Reject</button>`:''}</div></div>`).join('')||'<div class="inline-empty">Belum ada peserta pada filter ini.</div>';el.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{try{await svc().reviewRegistration(b.dataset.approve,'APPROVE');await load();window.SYKA_TOAST.show('Peserta disetujui.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Approve gagal.','error');}});el.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>rejectParticipant(b.dataset.reject));}
    root.querySelector('#participant-competition-select')?.addEventListener('change',load);root.querySelector('#participant-status-filter')?.addEventListener('change',load);await load();
  }

  async function downloadQuestionTemplate(){
    const rows=[
      ['nomor','soal','A','B','C','D','jawaban'],
      ['1','Contoh pilihan ganda','Opsi A','Opsi B','Opsi C','Opsi D','A'],
      ['2','Contoh benar/salah','Benar','Salah','','','A'],
      ['3','Contoh pilihan ganda 3 opsi','Opsi A','Opsi B','Opsi C','','B'],
      ['4','Contoh multi-jawaban','Opsi A','Opsi B','Opsi C','Opsi D','A,C'],
      ['5','Contoh essay','','','','',''],
      ['6','Contoh isian singkat','','','','','jawaban yang benar']
    ];
    await loadXlsx();
    if(window.XLSX){
      const ws=window.XLSX.utils.aoa_to_sheet(rows); const wb=window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb,ws,'Soal');
      window.XLSX.writeFile(wb,'template-bank-soal-sykabelajar.xlsx'); return;
    }
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='template-bank-soal-sykabelajar.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);
  }
  async function parseQuestionSheet(file){
    const text=await file.text();
    if(!/\.(csv|tsv)$/i.test(file.name) && !window.XLSX){await loadXlsx();}
    if(window.XLSX){const wb=window.XLSX.read(await file.arrayBuffer(),{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];return window.XLSX.utils.sheet_to_json(ws,{defval:''});}
    const sep=file.name.toLowerCase().endsWith('.tsv')?'\t':',';const lines=text.split(/\r?\n/).filter(Boolean);const heads=lines.shift().split(sep).map(x=>x.replace(/^"|"$/g,''));return lines.map(line=>{const vals=line.split(sep).map(x=>x.replace(/^"|"$/g,''));return Object.fromEntries(heads.map((h,i)=>[h,vals[i]||'']));});
  }
  async function loadXlsx(){if(window.XLSX)return;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=resolve;s.onerror=()=>reject(new Error('Library Excel tidak dapat dimuat.'));document.head.appendChild(s);});}
  function inferImportedType(row){const has=['A','B','C','D'].filter(k=>String(row[k]||'').trim()!=='');const answer=String(row.jawaban||'').trim();if(!has.length){return answer?{type:'short_answer',config:{accepted_answers:[answer]}}:{type:'essay',config:{}};}if(has.length===2)return {type:'true_false',config:{options:has.map(k=>String(row[k]).trim()),correct:answer}};if(has.length===3||has.length===4){const answers=answer.split(/[\s,;]+/).filter(Boolean).map(x=>x.toUpperCase());return {type:answers.length>1?'multiple_checkbox':'multiple_choice',config:{answers}};}return {type:'essay',config:{}};}
  async function importQuestionRows(rows,bankId,competitionId){let count=0;for(const row of rows){const prompt=String(row.soal||row.Soal||'').trim();if(!prompt)continue;const inf=inferImportedType(row);const opts=['A','B','C','D'].filter(k=>String(row[k]||'').trim()!=='').map(k=>({label:k,value:String(row[k]).trim(),is_correct:String(row.jawaban||'').toUpperCase().split(/[\s,;]+/).includes(k)}));const q=await svc().saveQuestion({question_bank_id:bankId,competition_id:competitionId||null,type:inf.type,prompt,points:1,required:true,display_order:count,status:'DRAFT',config:inf.config});if(opts.length)await svc().replaceOptions(q.id,opts);count++;}return count;}

  async function notifications(root){
    const a=window.SYKA_STATE.getState().auth;
    const rows=await window.SYKA_NOTIFICATION_SERVICE.list(a.user.id);
    root.innerHTML=`<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">NOTIFIKASI</span><h2>Notifikasi</h2><p>Event approval, order, grading, dan update workspace.</p></div></div><div class="data-table">${rows.map(n=>`<div class="data-row"><div><strong>${esc(n.title||'Notifikasi')}</strong><small>${esc(n.body||'')} · ${fmt(n.created_at)}</small></div><span class="status-pill ${n.read_at?'status-neutral':'status-success'}">${n.read_at?'Sudah dibaca':'Baru'}</span></div>`).join('')||'<div class="inline-empty">Belum ada notifikasi.</div>'}</div></section>`;
  }

  async function renderPlan(root,orgId,onboarding=false){
    const [active,entitlements,catalog]=await Promise.all([svc().listActiveOrganizerPlan(orgId),svc().listEntitlements(),svc().listPlanCatalog()]);
    const current=active?.plan_code||null;
    const rank={FREE:0,PREMIUM:1,PRO:2};
    const ordered=catalog.filter(p=>!current||((rank[p.plan_code]??0)>=(rank[current]??0)));
    root.innerHTML=`<div class="plan-usage-workspace-v49"><section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">PLAN & USAGE</span><h2>${onboarding?'Pilih paket workspace':`Paket aktif: ${esc(current||'FREE')}`}</h2><p>${current?'Downgrade tidak tersedia untuk self-service. Kamu hanya dapat mempertahankan atau upgrade.':'Pilih paket untuk mengaktifkan workspace.'}</p></div></div><div class="plan-choice-grid-v47">${ordered.map(p=>{const isCurrent=current===p.plan_code;const higher=current&&(rank[p.plan_code]??0)>(rank[current]??0);return `<article class="plan-choice-card-v47 ${p.plan_code==='PREMIUM'?'featured':''} ${isCurrent?'current':''}"><div class="plan-choice-top"><span class="plan-badge ${p.plan_code.toLowerCase()}">${esc(p.badge||p.plan_code)}</span><span>${isCurrent?'DIGUNAKAN':higher?'UPGRADE':'TERSEDIA'}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><strong>${Number(p.monthly_price||0)?`Rp ${Number(p.monthly_price).toLocaleString('id-ID')} / bulan`:'Gratis'}</strong><button class="btn ${isCurrent?'btn-secondary':'btn-primary'} btn-block" ${isCurrent?'disabled':''} data-plan-select="${esc(p.plan_code)}">${isCurrent?'Digunakan':higher||!current?'Pilih paket':'Tidak tersedia'}</button></article>`;}).join('')}</div></section><section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">CAPABILITY</span><h2>Fitur aktif</h2></div></div><div class="plan-entitlement-grid-v46">${entitlements.filter(e=>e.plan_code===current).map(e=>`<div class="entitlement-card-v46"><span>✓</span><div><strong>${esc(e.capability.replaceAll('_',' '))}</strong><small>${e.limit_value==null?'Tanpa batas':`Limit ${Number(e.limit_value).toLocaleString('id-ID')}`}</small></div></div>`).join('')||'<div class="inline-empty">Belum ada paket aktif.</div>'}</div></section></div>`;
    root.querySelectorAll('[data-plan-select]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'plan'}));
  }

  window.SYKA_PAGE_ORGANIZER={render};
})();
