(function(){
  const svc=()=>window.SYKA_CONTROL_SERVICE;const esc=window.SYKA_UTILS.escapeHtml;const fmt=window.SYKA_UTILS.formatDateTime;const fn=window.SYKA_UTILS.formatNumber;
  const tabs=[['dashboard','Dashboard'],['users','Pengguna'],['competitions','Kompetisi'],['questions','Soal'],['twibbon','Twibbon'],['results','Hasil'],['certificates','Sertifikat'],['orders','Pesanan'],['moderation','Moderasi'],['plans','Paket'],['monetization','Monetisasi'],['settings','Pengaturan'],['audit','Audit']];
  const transitions={DRAFT:['PUBLISHED','SUSPENDED','CANCELLED'],PUBLISHED:['REGISTRATION_OPEN','SUSPENDED','CANCELLED'],REGISTRATION_OPEN:['REGISTRATION_CLOSED','SUSPENDED','CANCELLED'],REGISTRATION_CLOSED:['LIVE','SUSPENDED','CANCELLED'],LIVE:['SUBMISSION_CLOSED','SUSPENDED','CANCELLED'],SUBMISSION_CLOSED:['GRADING','SUSPENDED','CANCELLED'],GRADING:['RESULT_PUBLISHED','SUSPENDED'],RESULT_PUBLISHED:['ARCHIVED','SUSPENDED'],SUSPENDED:['DRAFT','PUBLISHED','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','CANCELLED']};
  function shell(tab,title,subtitle){return `<div class="control-head"><div><span class="eyebrow">ADMIN CONTROL PLANE</span><h1>${title}</h1><p>${subtitle}</p></div><div class="control-head-meta"><span class="security-badge">RLS · server authoritative</span></div></div><div class="control-tabs">${tabs.map(([k,l])=>`<button type="button" class="control-tab ${k===tab?'active':''}" data-tab="${k}">${l}</button>`).join('')}</div><div id="control-content"></div>`;}
  async function render(root){const auth=window.SYKA_STATE.getState().auth;if(!auth.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk diperlukan',text:'Panel admin hanya dapat diakses oleh administrator.',actionHtml:'<button class="btn btn-primary" id="admin-login">Masuk</button>'});document.getElementById('admin-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/admin'}));return;}if(!auth.roles.includes('admin')){root.innerHTML=window.SYKA_EMPTY.render({title:'Akses ditolak',text:'Akun ini belum memiliki role admin.',icon:'⊘'});return;}const q=window.SYKA_STATE.getState().route.query;const tab=tabs.some(([k])=>k===q.tab)?q.tab:'dashboard';root.innerHTML=shell(tab,'Panel Admin','Kelola platform, moderasi, kompetisi, transaksi, feature flags, dan audit dari satu control plane.');root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/admin',{tab:b.dataset.tab}));try{await renderTab(document.getElementById('control-content'),tab);}catch(error){document.getElementById('control-content').innerHTML=window.SYKA_EMPTY.render({title:'Modul gagal dimuat',text:error.message||'Periksa migration/RLS dan coba lagi.',actionHtml:'<button class="btn btn-ghost" id="cp-retry">Coba lagi</button>'});document.getElementById('cp-retry')?.addEventListener('click',()=>render(root));}}
  async function audit(root){
    const rows = await svc().listAudit({limit:200});
    root.innerHTML = `
      <div class="toolbar">
        <div>
          <span class="eyebrow">SYSTEM AUDIT</span>
          <h2>Audit Log</h2>
          <p>Riwayat mutation privileged dan aktivitas administratif.</p>
        </div>
        <div class="filter-line">
          <input class="control-search" id="audit-search" placeholder="Cari action, entity, atau ID…">
        </div>
      </div>
      <section class="panel-card">
        <div class="audit-list" id="audit-list">
          ${
            rows.length
              ? rows.map(item => `
                <div class="audit-row">
                  <div class="audit-row-icon">↗</div>
                  <div class="audit-row-main">
                    <strong>${esc(item.action || 'unknown.action')}</strong>
                    <small>
                      ${esc(item.entity_type || '—')}
                      ${item.entity_id ? ` · ${esc(item.entity_id)}` : ''}
                    </small>
                    ${item.reason ? `<p>${esc(item.reason)}</p>` : ''}
                  </div>
                  <time>${fmt(item.created_at)}</time>
                </div>
              `).join('')
              : window.SYKA_EMPTY.render({
                  title:'Audit masih kosong',
                  text:'Belum ada aktivitas administratif yang tercatat.'
                })
          }
        </div>
      </section>
    `;
    document.getElementById('audit-search')?.addEventListener('input', e => {
      const q = String(e.target.value || '').trim().toLowerCase();
      root.querySelectorAll('.audit-row').forEach(row => {
        row.style.display = !q || row.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }
  async function renderTab(root,tab){const map={dashboard,users,competitions,questions,twibbon,results,certificates,orders,moderation,plans,monetization,settings,audit};return map[tab]?.(root);}
  async function dashboard(root){const [stats,comps,users,audit,slides]=await Promise.all([svc().platformStats(),svc().listCompetitionsAdmin({limit:200}),svc().listUsers({limit:300}),svc().listAudit({limit:8}),svc().listSlides({admin:true})]);root.innerHTML=`<div class="kpi-grid"><div class="kpi-card"><span>Siswa</span><strong>${fn(stats.total_students)}</strong><small>akun aktif</small></div><div class="kpi-card"><span>Sekolah</span><strong>${fn(stats.total_schools)}</strong><small>institusi terdaftar</small></div><div class="kpi-card"><span>Penerima prestasi</span><strong>${fn(stats.total_award_recipients)}</strong><small>awards publik</small></div><div class="kpi-card"><span>Juara</span><strong>${fn(stats.total_champions)}</strong><small>peraih posisi 1</small></div></div><div class="control-grid-2"><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">PLATFORM</span><h2>Ringkasan operasional</h2></div><span class="live-dot">LIVE</span></div><div class="metric-grid"><div><b>${comps.length}</b><span>Kompetisi</span></div><div><b>${users.length}</b><span>Pengguna</span></div><div><b>${slides.length}</b><span>Promo slide</span></div><div><b>${audit.length}</b><span>Audit terbaru</span></div></div></section><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">AUDIT</span><h2>Aktivitas terakhir</h2></div></div>${audit.length?audit.map(a=>`<div class="activity-row"><div class="activity-icon">↗</div><div><strong>${esc(a.action)}</strong><small>${esc(a.entity_type)} · ${esc(a.entity_id||'')}</small></div><time>${fmt(a.created_at)}</time></div>`).join(''):window.SYKA_EMPTY.render({title:'Audit masih kosong',text:'Mutation privileged akan muncul di sini.'})}</section></div><section class="panel-card admin-section"><div class="panel-head"><div><span class="eyebrow">HOME PROMO</span><h2>Hero slides</h2></div><button class="btn btn-primary btn-sm" id="quick-slide">+ Tambah slide</button></div><div class="mini-list">${slides.slice(0,5).map(s=>`<div class="mini-list-row"><div class="media-thumb">${s.image_url?`<img src="${esc(s.image_url)}" alt="">`:'✦'}</div><div><strong>${esc(s.title)}</strong><small>${esc(s.subtitle||'—')}</small></div><span class="status-pill ${s.is_active?'status-success':'status-neutral'}">${s.is_active?'Aktif':'Draft'}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada slide',text:'Tambahkan banner promosi dari menu Kompetisi/Settings.'})}</div></section>`;document.getElementById('quick-slide').onclick=()=>slideModal();}
  async function users(root){const rows=await svc().listUsers({limit:250});root.innerHTML=`<div class="toolbar"><div><h2>Pengguna</h2><p>${rows.length} akun ditemukan.</p></div><input class="control-search" id="user-search" placeholder="Cari nama, username, sekolah…"></div><div class="data-table" id="user-table">${rows.map(u=>`<div class="data-row"><div class="row-main"><div class="avatar-mini">${u.avatar_url?`<img src="${esc(u.avatar_url)}" alt="">`:esc(window.SYKA_UTILS.initials(u.full_name))}</div><div><strong>${esc(u.full_name||u.username||'Tanpa nama')}</strong><small>@${esc(u.username||'—')} · ${esc(u.institution||'—')} · ${esc(u.grade||'—')}</small><div class="chip-row">${u.roles.map(r=>`<span class="chip">${esc(r.role)}</span>`).join('')}<span class="status-pill ${window.SYKA_UTILS.statusClass(u.status)}">${esc(u.status)}</span></div></div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-user-status="${u.id}" data-status="${u.status==='ACTIVE'?'SUSPENDED':'ACTIVE'}">${u.status==='ACTIVE'?'Suspend':'Aktifkan'}</button><button class="btn btn-secondary btn-sm" data-user-role="${u.id}">Role</button></div></div>`).join('')}</div>`;document.getElementById('user-search').oninput=e=>{const q=e.target.value.toLowerCase();root.querySelectorAll('.data-row').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?'flex':'none');};root.querySelectorAll('[data-user-status]').forEach(b=>b.onclick=async()=>{try{await svc().setUserStatus(b.dataset.userStatus,b.dataset.status,'Perubahan admin');window.SYKA_TOAST.show('Status pengguna diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});root.querySelectorAll('[data-user-role]').forEach(b=>roleModal(b.dataset.userRole));}
  function roleModal(userId){window.SYKA_MODAL.open({title:'Kelola role pengguna',html:`<form id="role-form" class="form-card"><label>Role<select id="role"><option value="student">Pelajar</option><option value="teacher">Guru</option><option value="organizer_member">Penyelenggara</option><option value="admin">Admin</option></select></label><label class="checkline"><input id="active" type="checkbox" checked> Role aktif</label><label>Alasan<textarea id="reason" rows="3" placeholder="Alasan perubahan role"></textarea></label><button class="btn btn-primary">Simpan</button><div id="role-feedback"></div></form>`,onOpen:body=>body.querySelector('#role-form').onsubmit=async e=>{e.preventDefault();try{await svc().setUserRole(userId,body.querySelector('#role').value,body.querySelector('#active').checked,body.querySelector('#reason').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Role diperbarui.','success');window.SYKA_ROUTER.refresh();}catch(error){body.querySelector('#role-feedback').innerHTML=`<div class="inline-error">${esc(error.message)}</div>`;}}});}
  async function competitions(root){const rows=await svc().listCompetitionsAdmin({limit:250});root.innerHTML=`<div class="toolbar"><div><h2>Kompetisi</h2><p>CRUD dan state machine server-authoritative.</p></div><button class="btn btn-primary" id="new-comp">+ Kompetisi</button></div><div class="filter-line"><input class="control-search" id="comp-search" placeholder="Cari kompetisi…"><select class="compact-select" id="comp-status"><option value="">Semua status</option>${['DRAFT','PUBLISHED','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','ARCHIVED','SUSPENDED','CANCELLED'].map(s=>`<option>${s}</option>`).join('')}</select></div><div class="data-table" id="comp-table">${rows.map(c=>competitionRow(c)).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama untuk mulai menggunakan control plane.'})}</div>`;document.getElementById('new-comp').onclick=()=>competitionModal();const filter=()=>{const q=document.getElementById('comp-search').value.toLowerCase();const s=document.getElementById('comp-status').value;root.querySelectorAll('.data-row[data-comp-row]').forEach(r=>r.style.display=(!q||r.innerText.toLowerCase().includes(q))&&(!s||r.dataset.status===s)?'flex':'none');};document.getElementById('comp-search').oninput=filter;document.getElementById('comp-status').onchange=filter;bindCompetitionRows(root,rows);}
  function competitionRow(c){const poster=window.SYKA_UTILS.cloudinaryTransform(c.poster_url,{width:120,height:80,crop:'fill'});return `<div class="data-row competition-admin-row" data-comp-row data-status="${esc(c.status)}"><div class="row-main"><div class="media-thumb">${poster?`<img src="${esc(poster)}" alt="" loading="lazy">`:'✦'}</div><div><div class="row-title"><strong>${esc(c.title)}</strong><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span></div><small>${esc(c.category||'Kompetisi')} · ${esc(c.slug||'')} · ${esc(c.visibility||'PUBLIC')}</small><div class="chip-row"><span class="chip">Registrasi ${fmt(c.registration_starts_at)} → ${fmt(c.registration_ends_at)}</span><span class="chip">Mulai ${fmt(c.starts_at)}</span></div></div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${c.id}">Edit</button><button class="btn btn-secondary btn-sm" data-config="${c.id}">Config</button><button class="btn btn-primary btn-sm" data-transition="${c.id}">Transisi</button></div></div>`;}
  function bindCompetitionRows(root,rows){root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>competitionModal(rows.find(x=>x.id===b.dataset.edit)));root.querySelectorAll('[data-config]').forEach(b=>b.onclick=()=>competitionConfigModal(rows.find(x=>x.id===b.dataset.config)));root.querySelectorAll('[data-transition]').forEach(b=>b.onclick=()=>transitionModal(rows.find(x=>x.id===b.dataset.transition)));}
  function dateField(id,label,value,required=false){return `<label>${label}${required?' *':''}<div class="date-control"><span>◷</span><input id="${id}" type="datetime-local" ${required?'required':''} value="${window.SYKA_UTILS.escapeHtml(window.SYKA_UTILS.toLocalInputValue(value))}"></div></label>`;}
  async function competitionModal(current=null){
    const organizers=await svc().listOrganizers().catch(()=>[]); const p=current||{};
    window.SYKA_MODAL.open({title:current?'Edit kompetisi':'Buat kompetisi baru',wide:true,html:`<form id="comp-form" class="form-card"><div class="form-section-title"><div><span class="eyebrow">BASIC INFO</span><h2>${current?'Edit':'Buat'} kompetisi</h2></div><span class="form-required">* wajib</span></div><div class="form-grid-2"><label>Judul *<input id="title" required value="${esc(p.title||'')}"></label><label>Slug *<input id="slug" required value="${esc(p.slug||'')}"><small class="field-help">Contoh: olimpiade-sains-2026</small></label></div><div class="form-grid-2"><label>Kategori<select id="category"><option ${p.category==='Kompetisi'||!p.category?'selected':''}>Kompetisi</option><option ${p.category==='Olimpiade'?'selected':''}>Olimpiade</option><option ${p.category==='Tryout'?'selected':''}>Tryout</option><option ${p.category==='Lomba Kreatif'?'selected':''}>Lomba Kreatif</option><option ${p.category==='Uji Kompetensi'?'selected':''}>Uji Kompetensi</option></select></label><label>Visibility<select id="visibility"><option ${p.visibility==='PUBLIC'||!p.visibility?'selected':''}>PUBLIC</option><option ${p.visibility==='UNLISTED'?'selected':''}>UNLISTED</option><option ${p.visibility==='PRIVATE'?'selected':''}>PRIVATE</option></select></label></div><label>Deskripsi singkat<textarea id="short" rows="4" placeholder="Jelaskan kompetisi dengan ringkas…">${esc(p.short_description||'')}</textarea></label><div class="upload-field-card"><div><span class="eyebrow">POSTER KOMPETISI</span><h3>Upload poster</h3><p>Gambar langsung ke Cloudinary. Rasio ideal 16:9.</p></div><div class="upload-preview" id="admin-poster-preview">${p.poster_url?`<img src="${esc(p.poster_url)}" alt="Poster"><div class="upload-file-meta"><strong>Poster tersimpan</strong></div>`:'<div class="upload-placeholder"><span>↑</span><strong>Belum ada poster</strong><small>PNG, JPG, WEBP • maksimal 10 MB</small></div>'}</div><button type="button" class="btn btn-secondary" id="admin-poster-upload">${p.poster_url?'Ganti poster':'Upload poster'}</button><input type="hidden" id="poster" value="${esc(p.poster_url||'')}"><input type="hidden" id="poster-public-id" value="${esc(p.poster_public_id||'')}"><input type="hidden" id="poster-width" value="${p.poster_width||''}"><input type="hidden" id="poster-height" value="${p.poster_height||''}"><input type="hidden" id="poster-version" value="${esc(p.poster_version||'')}"><input type="hidden" id="poster-resource" value="${esc(p.poster_resource_type||'')}"></div>${!current?`<label>Organizer *<select id="organizer_id" required>${organizers.map(o=>`<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select></label>`:''}<div class="form-section-title compact"><div><span class="eyebrow">TIMELINE</span><h2>Tanggal & jam</h2><p>Pilih tanggal dan jam lokal dengan kontrol yang mudah dibaca.</p></div></div><div class="form-grid-2">${dateField('registration_start','Pendaftaran mulai',p.registration_starts_at,true)}${dateField('registration_end','Pendaftaran berakhir',p.registration_ends_at,true)}</div><div class="form-grid-2">${dateField('start_at','Kompetisi mulai',p.starts_at,true)}${dateField('end_at','Kompetisi berakhir',p.ends_at,true)}</div>${dateField('announcement_at','Pengumuman hasil',p.announcement_at,false)}<div id="comp-feedback"></div><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">${current?'Simpan perubahan':'Buat kompetisi'}</button></div></form>`,onOpen:body=>{
      body.querySelector('#admin-poster-upload').onclick=async()=>{try{const info=await window.SYKA_CLOUDINARY.openCompetitionImageWidget();body.querySelector('#poster').value=info.secure_url||'';body.querySelector('#poster-public-id').value=info.public_id||'';body.querySelector('#poster-width').value=info.width||'';body.querySelector('#poster-height').value=info.height||'';body.querySelector('#poster-version').value=info.version||'';body.querySelector('#poster-resource').value=info.resource_type||'image';body.querySelector('#admin-poster-preview').innerHTML=`<img src="${esc(info.secure_url)}" alt="Poster"><div class="upload-file-meta"><strong>${esc(info.original_filename||'Poster kompetisi')}</strong></div>`;body.querySelector('#admin-poster-upload').textContent='Ganti poster';}catch(e){window.SYKA_TOAST.show(e.message||'Upload gagal.','error');}};
      body.querySelector('#comp-form').onsubmit=async e=>{e.preventDefault();const feedback=body.querySelector('#comp-feedback');const payload={title:body.querySelector('#title').value.trim(),slug:body.querySelector('#slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,''),category:body.querySelector('#category').value.trim()||'Kompetisi',short_description:body.querySelector('#short').value.trim()||null,visibility:body.querySelector('#visibility').value,poster_url:body.querySelector('#poster').value.trim()||null,poster_public_id:body.querySelector('#poster-public-id').value.trim()||null,poster_width:Number(body.querySelector('#poster-width').value)||null,poster_height:Number(body.querySelector('#poster-height').value)||null,poster_version:body.querySelector('#poster-version').value.trim()||null,poster_resource_type:body.querySelector('#poster-resource').value.trim()||'image',registration_starts_at:window.SYKA_UTILS.localInputToISO(body.querySelector('#registration_start').value),registration_ends_at:window.SYKA_UTILS.localInputToISO(body.querySelector('#registration_end').value),starts_at:window.SYKA_UTILS.localInputToISO(body.querySelector('#start_at').value),ends_at:window.SYKA_UTILS.localInputToISO(body.querySelector('#end_at').value),announcement_at:window.SYKA_UTILS.localInputToISO(body.querySelector('#announcement_at').value)};if(!current)payload.organizer_id=body.querySelector('#organizer_id')?.value||null;try{await svc().saveCompetition(payload,current?.id||null);window.SYKA_MODAL.close();window.SYKA_TOAST.show(current?'Kompetisi diperbarui.':'Kompetisi dibuat sebagai DRAFT.','success');window.SYKA_ROUTER.refresh();}catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Gagal menyimpan kompetisi.')}</div>`;}};
    }});
  }
  function competitionConfigModal(c){window.SYKA_MODAL.open({title:'Konfigurasi kompetisi',wide:true,html:`<div class="config-grid"><button class="config-card" id="cfg-level"><span>◫</span><strong>Jenjang & kelas</strong><small>Atur level, allowed grades, points.</small></button><button class="config-card" id="cfg-rules"><span>◌</span><strong>Aturan pendaftaran</strong><small>Twibbon, social proof, quota.</small></button><button class="config-card" id="cfg-reward"><span>✦</span><strong>Reward</strong><small>Juara, poin, emblem, sertifikat.</small></button></div>`,onOpen:body=>{body.querySelector('#cfg-level').onclick=()=>levelModal(c.id);body.querySelector('#cfg-rules').onclick=()=>rulesModal(c.id);body.querySelector('#cfg-reward').onclick=()=>rewardModal(c.id);}});}
  async function levelModal(compId){const rows=await svc().listLevels(compId);window.SYKA_MODAL.open({title:'Jenjang kompetisi',wide:true,html:`<div class="modal-toolbar"><button class="btn btn-primary btn-sm" id="new-level">+ Level</button></div><div class="stack-list">${rows.map(r=>`<div class="list-card"><strong>${esc(r.label)}</strong><small>${esc(r.code)} · ${esc((r.allowed_grades||[]).join(', '))}</small><span>${r.points} pts</span></div>`).join('')||'<div class="empty-inline">Belum ada level.</div>'}</div>`,onOpen:body=>body.querySelector('#new-level').onclick=()=>{window.SYKA_MODAL.open({title:'Tambah level',html:`<form id="lf" class="form-card"><label>Kode<input id="code" required placeholder="SD6"></label><label>Label<input id="label" required placeholder="Kelas 6 SD"></label><label>Allowed grades<textarea id="grades">SD6</textarea></label><label>Points<input id="points" type="number" value="0"></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#lf').onsubmit=async e=>{e.preventDefault();try{await svc().saveLevel({competition_id:compId,code:b.querySelector('#code').value.trim(),label:b.querySelector('#label').value.trim(),allowed_grades:b.querySelector('#grades').value.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean),points:Number(b.querySelector('#points').value||0),config:{} });window.SYKA_MODAL.close();window.SYKA_TOAST.show('Level tersimpan.','success');levelModal(compId);}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}});}
  async function rulesModal(compId){const r=await svc().getRegistrationRules(compId)||{};window.SYKA_MODAL.open({title:'Aturan pendaftaran',wide:false,html:`<form id="rf" class="form-card"><label>Allowed grades<textarea id="grades">${esc((r.allowed_grades||[]).join('\n'))}</textarea></label><label class="checkline"><input id="twibbon" type="checkbox" ${r.require_twibbon?'checked':''}> Wajib twibbon</label><label class="checkline"><input id="social" type="checkbox" ${r.require_social_proof?'checked':''}> Wajib social proof</label><label>Maximum peserta<input id="max" type="number" min="1" value="${r.max_participants||''}"></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#rf').onsubmit=async e=>{e.preventDefault();try{await svc().saveRegistrationRules({allowed_grades:b.querySelector('#grades').value.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean),require_twibbon:b.querySelector('#twibbon').checked,require_social_proof:b.querySelector('#social').checked,max_participants:b.querySelector('#max').value?Number(b.querySelector('#max').value):null,config:{}},compId);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Aturan tersimpan.','success');}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}
  async function rewardModal(compId){
    const rows=await svc().listRewards(compId);
    const listHtml=rows.length?rows.map(r=>`<div class="list-card"><strong>${esc(r.rank_code)}</strong><small>${esc(r.title||'Reward')}</small><span>${r.points} pts</span></div>`).join(''):'<div class="empty-inline">Belum ada reward.</div>';
    window.SYKA_MODAL.open({
      title:'Reward kompetisi',
      wide:true,
      html:`<div class="modal-toolbar"><button class="btn btn-primary btn-sm" id="new-reward">+ Reward</button></div><div class="stack-list">${listHtml}</div>`,
      onOpen:body=>{
        body.querySelector('#new-reward').onclick=()=>{
          window.SYKA_MODAL.open({
            title:'Tambah reward',
            html:`<form id="rewf" class="form-card"><label>Rank code<input id="rank" required placeholder="1ST"></label><label>Title<input id="title" required placeholder="Juara 1"></label><label>Points<input id="points" type="number" value="0"></label><label>Emblem name<input id="emblem"></label><label class="checkline"><input id="cert" type="checkbox" checked> Certificate</label><button class="btn btn-primary">Simpan</button></form>`,
            onOpen:b=>{
              b.querySelector('#rewf').onsubmit=async e=>{
                e.preventDefault();
                try{
                  await svc().saveReward({
                    competition_id:compId,
                    rank_code:b.querySelector('#rank').value.trim(),
                    title:b.querySelector('#title').value.trim(),
                    points:Number(b.querySelector('#points').value||0),
                    emblem_name:b.querySelector('#emblem').value.trim()||null,
                    certificate_enabled:b.querySelector('#cert').checked,
                    config:{}
                  });
                  window.SYKA_MODAL.close();
                  window.SYKA_TOAST.show('Reward tersimpan.','success');
                  rewardModal(compId);
                }catch(error){
                  b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);
                }
              };
            }
          });
        };
      }
    });
  }
  async function questions(root){const banks=await svc().listQuestionBanks();root.innerHTML=`<div class="toolbar"><div><h2>Question Builder</h2><p>Bank soal, moderation, answer key—tetap dibatasi RLS.</p></div><button class="btn btn-primary" id="new-bank">+ Bank soal</button></div><div class="data-table">${banks.map(b=>`<div class="data-row"><div><strong>${esc(b.name)}</strong><small>${esc(b.description||'—')}</small></div><span class="status-pill ${window.SYKA_UTILS.statusClass(b.status||'DRAFT')}">${esc(b.status||'DRAFT')}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada bank soal',text:'Buat bank soal untuk mulai menyusun question set.'})}</div>`;document.getElementById('new-bank').onclick=()=>window.SYKA_MODAL.open({title:'Bank soal baru',html:`<form id="bf" class="form-card"><label>Nama bank soal<input id="name" required></label><label>Deskripsi<textarea id="desc"></textarea></label><label>Status<select id="status"><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option></select></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#bf').onsubmit=async e=>{e.preventDefault();try{await svc().saveQuestionBank({name:b.querySelector('#name').value.trim(),description:b.querySelector('#desc').value.trim()||null,status:b.querySelector('#status').value,config:{}});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Bank soal dibuat.','success');window.SYKA_ROUTER.refresh();}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}
  async function twibbon(root){const rows=await svc().listTwibbonTemplates();root.innerHTML=`<div class="toolbar"><div><h2>Twibbon</h2><p>Template promosi yang dipakai kompetisi.</p></div><button class="btn btn-primary" id="new-tw">+ Template</button></div><div class="data-table">${rows.map(r=>`<div class="data-row"><div><strong>${esc(r.name)}</strong><small>${esc(r.competition_id||'Global')} · ${r.image_url?'Asset tersedia':'Belum ada asset'}</small></div><div class="chip-row"><span class="chip">${r.is_required?'Wajib':'Opsional'}</span><span class="chip">${r.is_active?'Aktif':'Nonaktif'}</span></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada template',text:'Tambahkan template twibbon dari sini.'})}</div>`;document.getElementById('new-tw').onclick=()=>slideOrTwibbonModal();}
  function slideOrTwibbonModal(){
    window.SYKA_MODAL.open({
      title:'Twibbon template',
      wide:true,
      html:`<form id="twf" class="form-card">
        <div class="form-grid-2">
          <label>Organizer ID<input id="oid" placeholder="Pilih dari workspace jika perlu"></label>
          <label>Competition ID<input id="cid" placeholder="UUID competition"></label>
        </div>
        <label>Nama template<input id="name" required></label>
        <div class="upload-field-card">
          <div><span class="eyebrow">TWIBBON</span><h3>Upload template</h3><p>Gambar langsung ke Cloudinary. Tidak ada input URL.</p></div>
          <div class="upload-preview" id="tw-preview"><div class="upload-placeholder"><span>↑</span><strong>Belum ada template</strong><small>PNG, JPG, WEBP • maksimal 10 MB</small></div></div>
          <div class="upload-actions"><button type="button" class="btn btn-secondary" id="tw-upload">Pilih gambar</button></div>
          <input type="hidden" id="url"><input type="hidden" id="pid"><input type="hidden" id="width"><input type="hidden" id="height"><input type="hidden" id="version"><input type="hidden" id="resource">
        </div>
        <label class="checkline"><input id="req" type="checkbox"> Wajib digunakan</label>
        <div id="tw-feedback"></div>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan template</button></div>
      </form>`,
      onOpen:b=>{
        let tw=null;
        b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
        b.querySelector('#tw-upload').onclick=async()=>{
          try{
            tw=await window.SYKA_CLOUDINARY.openTwibbonWidget();
            b.querySelector('#url').value=tw.secure_url||'';
            b.querySelector('#pid').value=tw.public_id||'';
            b.querySelector('#width').value=tw.width||'';
            b.querySelector('#height').value=tw.height||'';
            b.querySelector('#version').value=tw.version||'';
            b.querySelector('#resource').value=tw.resource_type||'image';
            b.querySelector('#tw-preview').innerHTML=`<img src="${esc(tw.secure_url)}" alt="Twibbon"><div class="upload-file-meta"><strong>${esc(tw.original_filename||'Twibbon')}</strong><small>Cloudinary • asset tersimpan</small></div>`;
            b.querySelector('#tw-upload').textContent='Ganti gambar';
          }catch(e){window.SYKA_TOAST.show(e.message||'Upload gagal.','error');}
        };
        b.querySelector('#twf').onsubmit=async e=>{
          e.preventDefault();
          const feedback=b.querySelector('#tw-feedback');
          try{
            const url=b.querySelector('#url').value.trim();
            if(!url){feedback.innerHTML='<div class="inline-error">Upload template terlebih dahulu.</div>';return;}
            await svc().saveTwibbonTemplate({
              organizer_id:b.querySelector('#oid').value.trim()||null,
              competition_id:b.querySelector('#cid').value.trim()||null,
              name:b.querySelector('#name').value.trim(),
              image_url:url,
              public_id:b.querySelector('#pid').value.trim()||null,
              is_required:b.querySelector('#req').checked,
              is_active:true,
              config:{width:Number(b.querySelector('#width').value)||null,height:Number(b.querySelector('#height').value)||null,version:b.querySelector('#version').value||null,resource_type:b.querySelector('#resource').value||'image'}
            });
            window.SYKA_MODAL.close();
            window.SYKA_TOAST.show('Template twibbon tersimpan.','success');
            window.SYKA_ROUTER.refresh();
          }catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Template gagal disimpan.')}</div>`;}
        };
      }
    });
  }

  async function results(root){const rows=await svc().listAttempts({status:'FINALIZED'});root.innerHTML=`<div class="toolbar"><div><h2>Hasil</h2><p>Attempt final siap ditinjau dan dipakai untuk award event.</p></div></div><div class="data-table">${rows.map(r=>`<div class="data-row"><div><strong>${esc(r.profiles?.full_name||r.participant_id)}</strong><small>${esc(r.competitions?.title||'')} · ${fmt(r.finalized_at)}</small></div><strong>${Number(r.score||0).toLocaleString('id-ID')} pts</strong></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada hasil final',text:'Finalized attempts akan muncul di sini.'})}</div>`;}
  async function certificates(root){const rows=await svc().listCertificates();root.innerHTML=`<div class="toolbar"><div><h2>Sertifikat</h2><p>Lifecycle: Generated → Review → Approved → Published → Revoked.</p></div></div><div class="data-table">${rows.map(r=>`<div class="data-row"><div><strong>${esc(r.user_id)}</strong><small>${esc(r.competition_id||'')} · revisi ${r.current_revision}</small></div><div class="row-actions">${['GENERATED','REVIEW','APPROVED','PUBLISHED','REVOKED'].map(s=>`<button class="btn btn-ghost btn-xs" data-cert="${r.id}" data-status="${s}">${s}</button>`).join('')}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada sertifikat',text:'Sertifikat akan muncul setelah award/hasil diproses.'})}</div>`;root.querySelectorAll('[data-cert]').forEach(b=>b.onclick=async()=>{try{await svc().updateCertificate(b.dataset.cert,b.dataset.status);window.SYKA_TOAST.show('Status sertifikat diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});}
  async function orders(root){
    const rows=await svc().listOrders({limit:200});
    root.innerHTML=`<div class="toolbar"><div><span class="eyebrow">COMMERCE REVIEW</span><h2>Pesanan</h2><p>Review pembayaran manual, bukti transfer, dan aktivasi benefit.</p></div><div class="filter-line"><select class="compact-select" id="order-filter"><option value="">Semua</option><option>PENDING_PAYMENT</option><option>PAID</option><option>PROCESSING</option><option>CANCELLED</option></select></div></div><div class="orders-admin-grid" id="admin-orders">${rows.map(o=>`<article class="order-admin-card" data-order-status="${esc(o.status||'DRAFT')}"><div class="order-card-head"><div><span class="eyebrow">ORDER</span><h3>#${esc(String(o.id).slice(0,10))}</h3><small>${fmt(o.created_at)}</small></div><span class="status-pill ${window.SYKA_UTILS.statusClass(o.status)}">${esc(o.status||'DRAFT')}</span></div><div class="order-summary-grid"><div><span>User</span><strong>${esc(String(o.user_id).slice(0,12))}</strong></div><div><span>Total</span><strong>Rp ${Number(o.total||0).toLocaleString('id-ID')}</strong></div><div><span>WhatsApp</span><strong>${esc(o.contact_whatsapp||'—')}</strong></div></div>${o.payment_proof_url?`<div class="order-proof order-proof-admin"><img src="${esc(window.SYKA_UTILS.cloudinaryTransform(o.payment_proof_url,{width:360,height:240,crop:'fit'}))}" alt="Bukti transfer" loading="lazy"><div><strong>Bukti transfer tersedia</strong><small>${esc(o.payment_proof_status||'SUBMITTED')}</small></div></div>`:'<div class="order-proof-empty">Tidak ada bukti transfer.</div>'}<div class="order-admin-actions">${o.status==='PENDING_PAYMENT'?`<button class="btn btn-primary btn-sm" data-order-approve="${o.id}">Setujui</button><button class="btn btn-danger btn-sm" data-order-reject="${o.id}">Tolak</button>`:''}<button class="btn btn-ghost btn-sm" data-order-detail="${o.id}">Detail</button></div></article>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada order',text:'Order dari Toko dan paket penyelenggara akan muncul setelah user mengirim pembayaran.'})}</div>`;
    const filter=document.getElementById('order-filter');filter.onchange=()=>root.querySelectorAll('[data-order-status]').forEach(r=>r.style.display=!filter.value||r.dataset.orderStatus===filter.value?'grid':'none');
    root.querySelectorAll('[data-order-approve]').forEach(b=>b.onclick=()=>reviewOrder(b.dataset.orderApprove,'APPROVE'));
    root.querySelectorAll('[data-order-reject]').forEach(b=>b.onclick=()=>reviewOrder(b.dataset.orderReject,'REJECT'));
  }
  function reviewOrder(id,decision){window.SYKA_MODAL.open({title:decision==='APPROVE'?'Setujui pembayaran':'Tolak pembayaran',html:`<form id="review-order" class="form-card"><p>${decision==='APPROVE'?'Order akan menjadi PAID. Jika ini pembelian paket, plan organizer akan otomatis aktif.':'Order akan ditandai CANCELLED dan bukti pembayaran ditolak.'}</p><label>Catatan admin<textarea id="reason" rows="3" placeholder="Catatan untuk audit…"></textarea></label><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn ${decision==='APPROVE'?'btn-primary':'btn-danger'}">${decision==='APPROVE'?'Setujui':'Tolak'}</button></div><div id="review-feedback"></div></form>`,onOpen:b=>b.querySelector('#review-order').onsubmit=async e=>{e.preventDefault();try{await window.SYKA_SUPABASE.get().rpc('admin_review_manual_order',{p_order_id:id,p_decision:decision,p_reason:b.querySelector('#reason').value.trim()||null});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Review order tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(error){b.querySelector('#review-feedback').innerHTML=`<div class="inline-error">${esc(error.message||'Review gagal.')}</div>`;}}});}
  async function moderation(root){const m=await svc().listModeration();root.innerHTML=`<div class="control-grid-2"><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">POSTS</span><h2>Moderasi posting</h2></div></div>${m.posts.map(p=>`<div class="data-row compact"><div><strong>${esc(p.title||'Untitled')}</strong><small>${fmt(p.created_at)}</small></div><select class="compact-select" data-post="${p.id}">${['PUBLISHED','HIDDEN','ARCHIVED'].map(s=>`<option ${s===p.status?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')||'<p class="muted">Tidak ada post.</p>'}</section><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">COMMENTS</span><h2>Moderasi komentar</h2></div></div>${m.comments.map(c=>`<div class="data-row compact"><div><strong>${esc(c.body).slice(0,90)}</strong><small>${fmt(c.created_at)}</small></div><select class="compact-select" data-comment="${c.id}">${['PUBLISHED','HIDDEN','QUARANTINED'].map(s=>`<option ${s===c.moderation_state?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')||'<p class="muted">Tidak ada komentar.</p>'}</section></div>`;root.querySelectorAll('[data-post]').forEach(s=>s.onchange=async()=>{try{await svc().moderatePost(s.dataset.post,s.value);window.SYKA_TOAST.show('Post dimoderasi.','success');}catch(error){window.SYKA_TOAST.show(error.message,'error');}});root.querySelectorAll('[data-comment]').forEach(s=>s.onchange=async()=>{try{await svc().moderateComment(s.dataset.comment,s.value);window.SYKA_TOAST.show('Komentar dimoderasi.','success');}catch(error){window.SYKA_TOAST.show(error.message,'error');}});}
  const PLAN_FEATURES=[
    {key:'competition_create',label:'Buat kompetisi',help:'Jumlah kompetisi yang dapat dibuat',kind:'limit',defaultLimit:1},
    {key:'participant_limit',label:'Batas peserta',help:'Maksimum peserta per kompetisi',kind:'limit',defaultLimit:50},
    {key:'question_bank',label:'Bank soal',help:'Jumlah bank soal yang dapat dikelola',kind:'limit',defaultLimit:1},
    {key:'question_limit',label:'Batas soal',help:'Maksimum soal yang tersedia',kind:'limit',defaultLimit:100},
    {key:'manual_grading',label:'Penilaian manual',help:'Essay / file dapat dinilai manual',kind:'toggle'},
    {key:'certificate',label:'Sertifikat',help:'Generate dan publish certificate',kind:'toggle'},
    {key:'twibbon',label:'Twibbon',help:'Template dan review twibbon',kind:'toggle'},
    {key:'analytics',label:'Analytics',help:'Insight kompetisi dan peserta',kind:'toggle'},
    {key:'advanced_reports',label:'Laporan lanjutan',help:'Export dan laporan operasional lebih lengkap',kind:'toggle'},
    {key:'bulk_notification',label:'Notifikasi massal',help:'Kirim pengumuman ke banyak peserta',kind:'toggle'},
    {key:'custom_branding',label:'Branding khusus',help:'Logo, warna, dan identitas organizer',kind:'toggle'},
    {key:'priority_support',label:'Priority support',help:'Dukungan prioritas',kind:'toggle'}
  ];
  async function plans(root){
    const [catalog,ents]=await Promise.all([svc().listPlanCatalog(),svc().listEntitlements()]);
    const fallback={FREE:{name:'Free',badge:'Mulai',description:'Untuk penyelenggara yang baru mulai.',monthly_price:0,yearly_price:0,is_active:true},PREMIUM:{name:'Premium',badge:'Populer',description:'Untuk penyelenggara aktif.',monthly_price:149000,yearly_price:1490000,is_active:true},PRO:{name:'Pro',badge:'Paling lengkap',description:'Untuk organizer skala besar.',monthly_price:349000,yearly_price:3490000,is_active:true}};
    const byCode=Object.fromEntries((catalog||[]).map(p=>[p.plan_code,p]));
    const entitlementByPlan={};(ents||[]).forEach(e=>((entitlementByPlan[e.plan_code]??=[]).push(e)));
    let selected='PREMIUM';
    const planCard=(code)=>{const p=byCode[code]||{plan_code:code,...fallback[code]};const count=(entitlementByPlan[code]||[]).length;return `<button type="button" class="plan-preset-card ${selected===code?'selected':''}" data-plan-preset="${code}"><div class="plan-preset-top"><span class="plan-badge ${code.toLowerCase()}">${esc(p.badge||code)}</span><span class="chip">${p.is_active?'AKTIF':'NONAKTIF'}</span></div><h3>${esc(p.name||code)}</h3><p>${esc(p.description||'')}</p><strong>${p.monthly_price?money(p.monthly_price)+'/bulan':'Gratis'}</strong><small>${count} capability aktif</small></button>`;};
    const renderEditor=()=>{const p=byCode[selected]||{plan_code:selected,...fallback[selected]};const current=Object.fromEntries((entitlementByPlan[selected]||[]).map(e=>[e.capability,e]));const cards=PLAN_FEATURES.map(f=>{const e=current[f.key];const checked=!!e;return `<label class="plan-feature-row"><span class="check-wrap"><input type="checkbox" data-cap="${f.key}" ${checked?'checked':''}></span><span class="plan-feature-copy"><strong>${esc(f.label)}</strong><small>${esc(f.help)}</small></span>${f.kind==='limit'?`<span class="plan-limit"><input type="number" min="0" step="1" data-limit="${f.key}" value="${e?.limit_value??f.defaultLimit??''}" ${checked?'':'disabled'} placeholder="∞"></span>`:`<span class="plan-enabled-dot">${checked?'ON':'OFF'}</span>`}</label>`}).join('');const editor=document.getElementById('plan-editor');editor.innerHTML=`<div class="plan-editor-head"><div><span class="eyebrow">PLAN BUILDER</span><h2>${esc(p.name||selected)}</h2><p>Pilih kemampuan dengan checkbox. Limit hanya perlu diisi pada fitur kuota.</p></div><div class="plan-editor-price"><label>Harga / bulan<input id="plan-monthly" type="number" min="0" value="${Number(p.monthly_price)||0}"></label><label>Harga / tahun<input id="plan-yearly" type="number" min="0" value="${Number(p.yearly_price)||0}"></label></div></div><div class="form-grid-2 plan-meta-grid"><label>Nama paket<input id="plan-name" value="${esc(p.name||selected)}"></label><label>Badge<input id="plan-badge" value="${esc(p.badge||'')}"></label><label class="span-2">Deskripsi<textarea id="plan-description" rows="2">${esc(p.description||'')}</textarea></label></div><div class="plan-feature-list">${cards}</div><div class="plan-editor-actions"><label class="switch-line"><input id="plan-active" type="checkbox" ${p.is_active!==false?'checked':''}><span>Plan aktif dan boleh dipakai</span></label><button class="btn btn-primary" id="save-plan-bundle">Simpan paket ${esc(selected)}</button></div>`;editor.querySelectorAll('[data-cap]').forEach(cb=>cb.onchange=()=>{const limit=editor.querySelector(`[data-limit="${cb.dataset.cap}"]`);if(limit)limit.disabled=!cb.checked;});editor.querySelector('#save-plan-bundle').onclick=async()=>{const ent=PLAN_FEATURES.flatMap(f=>{const cb=editor.querySelector(`[data-cap="${f.key}"]`);if(!cb?.checked)return[];const limitEl=editor.querySelector(`[data-limit="${f.key}"]`);return[{capability:f.key,limit_value:f.kind==='limit'?(limitEl.value===''?null:Number(limitEl.value)):1,config:{}}];});const btn=editor.querySelector('#save-plan-bundle');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Menyimpan…';try{await svc().savePlanBundle({plan_code:selected,name:editor.querySelector('#plan-name').value.trim(),badge:editor.querySelector('#plan-badge').value.trim(),description:editor.querySelector('#plan-description').value.trim(),monthly_price:editor.querySelector('#plan-monthly').value,yearly_price:editor.querySelector('#plan-yearly').value,is_active:editor.querySelector('#plan-active').checked,entitlements:ent});window.SYKA_TOAST.show(`Paket ${selected} berhasil diperbarui.`,'success');window.SYKA_ROUTER.refresh();}catch(error){window.SYKA_TOAST.show(error.message||'Paket gagal disimpan.','error');btn.disabled=false;btn.textContent=`Simpan paket ${selected}`;}};};
    root.innerHTML=`<div class="plans-page"><div class="toolbar"><div><h2>Paket Penyelenggara</h2><p>Kelola Free, Premium, dan Pro tanpa mengetik capability satu per satu.</p></div></div><div class="plan-preset-grid">${['FREE','PREMIUM','PRO'].map(planCard).join('')}</div><section class="panel-card plan-builder-card" id="plan-editor"></section><section class="panel-card plan-guide"><div class="panel-head"><div><span class="eyebrow">CARA KERJA</span><h3>Capability yang mudah dipahami</h3></div></div><div class="guide-grid">${PLAN_FEATURES.map(f=>`<div><strong>${esc(f.label)}</strong><small>${esc(f.help)}</small></div>`).join('')}</div></section></div>`;
    root.querySelectorAll('[data-plan-preset]').forEach(b=>b.onclick=()=>{selected=b.dataset.planPreset;root.querySelectorAll('[data-plan-preset]').forEach(x=>x.classList.toggle('selected',x===b));renderEditor();});
    renderEditor();

    const assignmentSection=document.createElement('section');
    assignmentSection.className='panel-card plan-assignment-card';
    root.querySelector('.plans-page').appendChild(assignmentSection);

    async function renderAssignments(){
      try{
        const organizers=await svc().listOrganizers();
        const rows=await Promise.all(organizers.map(async org=>({org,plan:await svc().listActiveOrganizerPlan(org.id).catch(()=>null)})));
        assignmentSection.innerHTML=`<div class="panel-head"><div><span class="eyebrow">WORKSPACE ASSIGNMENT</span><h3>Plan aktif per penyelenggara</h3><p>Catalog menentukan paket yang tersedia. Di sini Admin menentukan paket yang benar-benar aktif untuk workspace.</p></div></div><div class="assignment-grid">${rows.map(({org,plan})=>`<div class="assignment-row"><div><strong>${esc(org.name)}</strong><small>${esc(org.slug||'')} · ${plan?.plan_code?`Paket ${esc(plan.plan_code)}`:'Belum memilih paket'}</small></div><div class="assignment-actions"><select data-assign-org="${esc(org.id)}"><option value="">Pilih paket…</option>${['FREE','PREMIUM','PRO'].map(code=>`<option value="${code}" ${plan?.plan_code===code?'selected':''}>${code}</option>`).join('')}</select><button class="btn btn-secondary btn-sm" data-assign-save="${esc(org.id)}">Simpan</button></div></div>`).join('')||'<div class="empty-inline">Belum ada workspace organizer.</div>'}</div>`;
        assignmentSection.querySelectorAll('[data-assign-save]').forEach(btn=>btn.onclick=async()=>{
          const orgId=btn.dataset.assignSave;
          const select=assignmentSection.querySelector(`[data-assign-org="${orgId}"]`);
          const code=select?.value;
          if(!code){window.SYKA_TOAST.show('Pilih paket terlebih dahulu.','warning');return;}
          btn.disabled=true;btn.textContent='Menyimpan…';
          try{await svc().assignOrganizerPlan(orgId,code);window.SYKA_TOAST.show(`Paket ${code} diaktifkan untuk workspace.`,'success');await renderAssignments();}catch(error){window.SYKA_TOAST.show(error.message||'Gagal menetapkan paket.','error');btn.disabled=false;btn.textContent='Simpan';}
        });
      }catch(error){assignmentSection.innerHTML=`<div class="inline-error">${esc(error.message||'Assignment plan gagal dimuat.')}</div>`;}
    }
    renderAssignments();
  }
  function money(v){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0);}
  async function monetization(root){
    const products=await svc().listCommerceProducts({admin:true});
    const benefits={};
    await Promise.all(products.map(async p=>{benefits[p.id]=await svc().listCommerceBenefits(p.id);}));
    const audienceLabels={student:'Pelajar',teacher:'Guru',organizer:'Penyelenggara'};
    const typeLabels={EDU_COIN_TOPUP:'Koin Edu',FEATURE_UNLOCK:'Fitur',DIGITAL_ITEM:'Item digital',DONATION:'Donasi',PLAN:'Paket'};
    root.innerHTML=`<div class="toolbar"><div><h2>Monetisasi &amp; Katalog</h2><p>Atur apa yang boleh tampil untuk Pelajar, Guru, dan Penyelenggara. Semua item pembayaran tetap menunggu verifikasi webhook backend.</p></div><button class="btn btn-primary" id="new-product">+ Produk baru</button></div><div class="catalog-notice"><strong>Arsitektur siap untuk 3 audience</strong><span>Pelajar · Guru · Penyelenggara</span><small>Gunakan katalog ini untuk Koin Edu, fitur khusus, item digital, donasi, dan paket.</small></div><div class="data-table catalog-table">${products.map(p=>`<div class="data-row product-admin-row"><div class="product-admin-info"><div class="store-icon">${p.product_type==='DONATION'?'♥':p.product_type==='EDU_COIN_TOPUP'?'✦':'◆'}</div><div><strong>${esc(p.name)}</strong><small>${esc(p.code)} · ${esc(typeLabels[p.product_type]||p.product_type)}</small><div class="audience-chips">${(p.audiences||[]).map(a=>`<span class="chip">${audienceLabels[a]||a}</span>`).join('')}</div></div></div><div class="product-admin-meta"><span class="status-pill ${p.is_active?'status-success':'status-muted'}">${p.is_active?'ACTIVE':'DRAFT'}</span><strong>${money(p.price)}</strong><div class="row-actions"><button class="btn btn-ghost btn-xs" data-edit-product="${p.id}">Edit</button><button class="btn btn-ghost btn-xs" data-toggle-product="${p.id}" data-active="${p.is_active?'false':'true'}">${p.is_active?'Nonaktifkan':'Aktifkan'}</button></div></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Katalog masih kosong',text:'Buat produk pertama untuk mulai mengatur monetisasi.'})}</div>`;
    document.getElementById('new-product').onclick=()=>openProductModal();
    root.querySelectorAll('[data-edit-product]').forEach(b=>b.onclick=()=>openProductModal(products.find(p=>p.id===b.dataset.editProduct),benefits[b.dataset.editProduct]||[]));
    root.querySelectorAll('[data-toggle-product]').forEach(b=>b.onclick=async()=>{const product=products.find(p=>p.id===b.dataset.toggleProduct);try{await svc().saveCommerceProduct({...product,is_active:b.dataset.active==='true'},product.id);window.SYKA_TOAST.show('Status produk diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});

    function openProductModal(product=null,existingBenefits=[]){
      const isEdit=!!product;const audiences=product?.audiences||[];const benefit=existingBenefits[0]||{};
      window.SYKA_MODAL.open({title:isEdit?'Edit produk':'Produk baru',wide:true,html:`<form id="product-form" class="form-card"><div class="form-grid-2"><label>Nama produk *<input id="pr-name" required value="${esc(product?.name||'')}"></label><label>Kode *<input id="pr-code" required value="${esc(product?.code||'')}" ${isEdit?'readonly':''}></label></div><div class="form-grid-2"><label>Slug *<input id="pr-slug" required value="${esc(product?.slug||'')}"></label><label>Tipe *<select id="pr-type">${Object.entries(typeLabels).map(([v,l])=>`<option value="${v}" ${product?.product_type===v?'selected':''}>${l}</option>`).join('')}</select></label></div><label>Deskripsi singkat<textarea id="pr-short" rows="2">${esc(product?.short_description||'')}</textarea></label><label>Deskripsi lengkap<textarea id="pr-desc" rows="4">${esc(product?.description||'')}</textarea></label><div class="form-grid-2"><label>Harga (IDR) *<input id="pr-price" type="number" min="0" step="1000" required value="${Number(product?.price)||0}"></label><label>Urutan tampil<input id="pr-order" type="number" min="0" value="${Number(product?.sort_order)||0}"></label></div><fieldset class="check-group"><legend>Tampilkan untuk</legend>${[['student','Pelajar'],['teacher','Guru'],['organizer','Penyelenggara']].map(([v,l])=>`<label class="check-option"><input type="checkbox" data-audience="${v}" ${audiences.includes(v)?'checked':''}><span>${l}</span></label>`).join('')}</fieldset><fieldset class="check-group"><legend>Benefit produk</legend><div class="form-grid-2"><label>Benefit type<select id="pr-benefit-type"><option value="EDU_COIN" ${benefit.benefit_type==='EDU_COIN'?'selected':''}>Koin Edu</option><option value="FEATURE" ${benefit.benefit_type==='FEATURE'?'selected':''}>Feature unlock</option><option value="ITEM" ${benefit.benefit_type==='ITEM'?'selected':''}>Item digital</option><option value="PLAN" ${benefit.benefit_type==='PLAN'?'selected':''}>Plan</option></select></label><label>Benefit key<input id="pr-benefit-key" value="${esc(benefit.benefit_key||product?.metadata?.feature||'')}"></label><label>Jumlah<input id="pr-benefit-qty" type="number" min="0" value="${benefit.quantity??product?.metadata?.coin_amount??''}"></label><label>Durasi (hari)<input id="pr-benefit-days" type="number" min="0" value="${benefit.duration_days??product?.metadata?.duration_days??''}"></label></div></fieldset><div class="upload-field-card"><div><span class="eyebrow">PRODUCT IMAGE</span><h3>Upload gambar produk</h3><p>Disimpan langsung ke Cloudinary, tanpa input URL.</p></div><div class="upload-preview" id="product-image-preview">${product?.image_url?`<img src="${esc(product.image_url)}" alt="Produk"><div class="upload-file-meta"><strong>Asset tersimpan</strong></div>`:`<div class="upload-placeholder"><span>↑</span><strong>Belum ada gambar</strong><small>Square image • maksimal 8 MB</small></div>`}</div><button type="button" class="btn btn-secondary" id="product-image-upload">${product?.image_url?'Ganti gambar':'Upload gambar'}</button><input type="hidden" id="pr-image" value="${esc(product?.image_url||'')}"><input type="hidden" id="pr-public-id" value="${esc(product?.public_id||'')}"></div><label class="switch-line"><input id="pr-featured" type="checkbox" ${product?.is_featured?'checked':''}><span>Tampilkan sebagai produk unggulan</span></label><label class="switch-line"><input id="pr-active" type="checkbox" ${product?.is_active?'checked':''}><span>Produk aktif dan tampil di katalog</span></label><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batalkan</button><button class="btn btn-primary" type="submit">${isEdit?'Simpan perubahan':'Buat produk'}</button></div></form>`,onOpen:b=>{b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();b.querySelector('#product-image-upload')?.addEventListener('click',async()=>{try{const info=await window.SYKA_CLOUDINARY.openProductImageWidget();b.querySelector('#pr-image').value=info.secure_url||'';b.querySelector('#pr-public-id').value=info.public_id||'';b.querySelector('#product-image-preview').innerHTML=`<img src="${esc(info.secure_url)}" alt="Produk"><div class="upload-file-meta"><strong>${esc(info.original_filename||'Produk')}</strong></div>`;b.querySelector('#product-image-upload').textContent='Ganti gambar';}catch(e){window.SYKA_TOAST.show(e.message||'Upload gagal.','error');}});b.querySelector('#product-form').onsubmit=async e=>{e.preventDefault();const audiences=[...b.querySelectorAll('[data-audience]:checked')].map(x=>x.dataset.audience);if(!audiences.length){window.SYKA_TOAST.show('Pilih minimal satu audience.','error');return;}const payload={code:b.querySelector('#pr-code').value.trim().toUpperCase(),slug:b.querySelector('#pr-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-'),name:b.querySelector('#pr-name').value.trim(),short_description:b.querySelector('#pr-short').value.trim()||null,description:b.querySelector('#pr-desc').value.trim()||null,product_type:b.querySelector('#pr-type').value,audiences,price:Number(b.querySelector('#pr-price').value)||0,currency:'IDR',image_url:b.querySelector('#pr-image').value.trim()||null,public_id:b.querySelector('#pr-public-id').value.trim()||null,is_active:b.querySelector('#pr-active').checked,is_featured:b.querySelector('#pr-featured').checked,sort_order:Number(b.querySelector('#pr-order').value)||0,metadata:{}};try{const saved=await svc().saveCommerceProduct(payload,product?.id||null);const benefits=[];const btype=b.querySelector('#pr-benefit-type').value;const bkey=b.querySelector('#pr-benefit-key').value.trim()||null;const qty=b.querySelector('#pr-benefit-qty').value===''?null:Number(b.querySelector('#pr-benefit-qty').value);const days=b.querySelector('#pr-benefit-days').value===''?null:Number(b.querySelector('#pr-benefit-days').value);if(btype)benefits.push({benefit_type:btype,benefit_key:bkey,quantity:qty,duration_days:days,config:{}});await svc().replaceCommerceBenefits(saved.id,benefits);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Produk tersimpan.','success');render(root);}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message||'Produk gagal disimpan.')}</div>`);}};}});
    }
  }
  async function settings(root){const[flags,settings]=await Promise.all([svc().listFlags(),svc().listSettings()]);root.innerHTML=`<div class="control-grid-2"><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">FLAGS</span><h2>Feature flags</h2></div></div>${flags.map(f=>`<div class="data-row"><div><strong>${esc(f.key)}</strong><small>${f.enabled?'Enabled':'Disabled'}</small></div><button class="btn btn-ghost btn-sm" data-flag="${esc(f.key)}" data-enabled="${!f.enabled}">${f.enabled?'Matikan':'Nyalakan'}</button></div>`).join('')||'<p class="muted">Belum ada flag.</p>'}</section><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">GLOBAL SETTINGS</span><h2>Pengaturan</h2></div></div>${settings.map(s=>`<div class="data-row"><div><strong>${esc(s.key)}</strong><small>${esc(JSON.stringify(s.value))}</small></div><button class="btn btn-ghost btn-sm" data-setting="${esc(s.key)}">Edit</button></div>`).join('')||'<p class="muted">Belum ada setting.</p>'}</section></div>`;root.querySelectorAll('[data-flag]').forEach(b=>b.onclick=async()=>{try{await svc().setFlag(b.dataset.flag,b.dataset.enabled==='true',{});window.SYKA_TOAST.show('Feature flag diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});root.querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>settingModal(b.dataset.setting));}
  function settingModal(key){
    window.SYKA_MODAL.open({
      title:'Global setting',
      html:`<form id="setting-form" class="form-card">
        <label>Key<input id="key" value="${esc(key)}" required></label>
        <label>Value JSON<textarea id="value" rows="8">{}</textarea><small class="field-help">Harus berupa JSON valid.</small></label>
        <div id="setting-feedback"></div>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan</button></div>
      </form>`,
      onOpen:b=>{
        b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
        b.querySelector('#setting-form').onsubmit=async e=>{
          e.preventDefault();
          const feedback=b.querySelector('#setting-feedback');
          try{
            const value=JSON.parse(b.querySelector('#value').value||'{}');
            await svc().setSetting(b.querySelector('#key').value.trim(),value);
            window.SYKA_MODAL.close();
            window.SYKA_TOAST.show('Setting tersimpan.','success');
            window.SYKA_ROUTER.refresh();
          }catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Setting tidak valid.')}</div>`;}
        };
      }
    });
  }

  function slideModal(){
    window.SYKA_MODAL.open({
      title:'Promo slide',
      wide:true,
      html:`<form id="slide-form" class="form-card">
        <div class="form-grid-2"><label>Judul *<input id="title" required></label><label>Badge<input id="badge" value="PROMO"></label></div>
        <label>Subtitle<textarea id="subtitle" rows="3" placeholder="Pesan singkat promo…"></textarea></label>
        <div class="upload-field-card">
          <div><span class="eyebrow">PROMO IMAGE</span><h3>Upload gambar slide</h3><p>Rasio ideal 16:9. Gambar langsung diunggah ke Cloudinary.</p></div>
          <div class="upload-preview" id="promo-preview"><div class="upload-placeholder"><span>↑</span><strong>Belum ada gambar</strong><small>PNG, JPG, WEBP • maksimal 10 MB</small></div></div>
          <button type="button" class="btn btn-secondary" id="promo-upload">Pilih gambar</button>
          <input type="hidden" id="url"><input type="hidden" id="pid"><input type="hidden" id="w"><input type="hidden" id="h"><input type="hidden" id="v"><input type="hidden" id="r">
        </div>
        <div class="form-grid-2"><label>CTA label<input id="cta" placeholder="Jelajahi lomba"></label><label>CTA route<input id="route" value="/lomba"></label></div>
        <div class="form-grid-2">${dateField('start','Mulai tayang',null,false)}${dateField('end','Berakhir',null,false)}</div>
        <div id="slide-feedback"></div>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan slide</button></div>
      </form>`,
      onOpen:b=>{
        let info=null;
        b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
        b.querySelector('#promo-upload').onclick=async()=>{
          try{
            info=await window.SYKA_CLOUDINARY.openPromoImageWidget();
            b.querySelector('#url').value=info.secure_url||'';
            b.querySelector('#pid').value=info.public_id||'';
            b.querySelector('#w').value=info.width||'';
            b.querySelector('#h').value=info.height||'';
            b.querySelector('#v').value=info.version||'';
            b.querySelector('#r').value=info.resource_type||'image';
            b.querySelector('#promo-preview').innerHTML=`<img src="${esc(info.secure_url)}" alt="Promo"><div class="upload-file-meta"><strong>${esc(info.original_filename||'Promo')}</strong><small>Cloudinary • asset tersimpan</small></div>`;
            b.querySelector('#promo-upload').textContent='Ganti gambar';
          }catch(e){b.querySelector('#slide-feedback').innerHTML=`<div class="inline-error">${esc(e.message||'Upload gagal.')}</div>`;}
        };
        b.querySelector('#slide-form').onsubmit=async e=>{
          e.preventDefault();
          const feedback=b.querySelector('#slide-feedback');
          try{
            const imageUrl=b.querySelector('#url').value.trim();
            if(!imageUrl) throw new Error('Upload gambar promo terlebih dahulu.');
            await svc().saveSlide({
              title:b.querySelector('#title').value.trim(),
              subtitle:b.querySelector('#subtitle').value.trim()||null,
              badge:b.querySelector('#badge').value.trim()||'PROMO',
              image_url:imageUrl,
              cta_label:b.querySelector('#cta').value.trim()||null,
              cta_route:b.querySelector('#route').value.trim()||'/lomba',
              starts_at:window.SYKA_UTILS.localInputToISO(b.querySelector('#start').value),
              ends_at:window.SYKA_UTILS.localInputToISO(b.querySelector('#end').value),
              is_active:true,
              sort_order:0,
              config:{public_id:b.querySelector('#pid').value||null,width:Number(b.querySelector('#w').value)||null,height:Number(b.querySelector('#h').value)||null,version:b.querySelector('#v').value||null,resource_type:b.querySelector('#r').value||'image'}
            });
            window.SYKA_MODAL.close();
            window.SYKA_TOAST.show('Promo slide tersimpan.','success');
            window.SYKA_ROUTER.refresh();
          }catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Promo slide gagal disimpan.')}</div>`;}
        };
      }
    });
  }

  window.SYKA_PAGE_ADMIN={render};
})();
