(function(){
  const esc=window.SYKA_UTILS.escapeHtml;
  const fmt=window.SYKA_UTILS.formatDateTime;

  function registrationState(status){
    const map={
      PUBLISHED:{label:'Pendaftaran belum dibuka',detail:'Kompetisi sudah dipublikasikan. Pendaftaran akan dibuka sesuai jadwal.'},
      REGISTRATION_OPEN:{label:'Pendaftaran dibuka',detail:'Periksa syarat, buat twibbon bila diwajibkan, lalu kirim pendaftaran.'},
      REGISTRATION_CLOSED:{label:'Pendaftaran ditutup',detail:'Batas pendaftaran sudah berakhir.'},
      LIVE:{label:'Kompetisi sedang berjalan',detail:'Peserta aktif dapat mengikuti tahap kompetisi.'},
      SUBMISSION_CLOSED:{label:'Pengumpulan ditutup',detail:'Kompetisi masuk tahap penilaian.'},
      GRADING:{label:'Sedang dinilai',detail:'Penyelenggara sedang memproses hasil peserta.'},
      RESULT_PUBLISHED:{label:'Hasil telah diumumkan',detail:'Lihat hasil dan rekam prestasi dari akun kamu.'},
      ARCHIVED:{label:'Kompetisi selesai',detail:'Kompetisi ini sudah diarsipkan.'},
      SUSPENDED:{label:'Kompetisi ditangguhkan',detail:'Aksi pendaftaran sementara tidak tersedia.'},
      CANCELLED:{label:'Kompetisi dibatalkan',detail:'Pendaftaran tidak tersedia.'}
    };
    return map[status]||{label:'Pendaftaran belum tersedia',detail:'Ikuti informasi resmi penyelenggara.'};
  }

  function shareOptions(){
    return `<div class="share-sheet-v47">
      <button class="share-option" data-share="native"><span>↗</span><div><strong>Bagikan</strong><small>Gunakan menu share perangkat</small></div></button>
      <button class="share-option" data-share="whatsapp"><span>◉</span><div><strong>WhatsApp</strong><small>Kirim ke teman</small></div></button>
      <button class="share-option" data-share="copy"><span>⧉</span><div><strong>Salin link</strong><small>Tempel di mana saja</small></div></button>
    </div>`;
  }

  function openJuknis(url,title){
    if(!url){window.SYKA_TOAST.show('Juknis belum diunggah penyelenggara.','info');return;}
    window.SYKA_MODAL.open({
      title:'Juknis • '+title,
      wide:true,
      html:`<div class="pdf-viewer-v47"><iframe src="${esc(url)}" title="Juknis ${esc(title)}" loading="lazy"></iframe></div><div class="modal-pdf-actions"><a class="btn btn-secondary" href="${esc(url)}" target="_blank" rel="noopener">Buka penuh</a><a class="btn btn-primary" href="${esc(url)}" target="_blank" rel="noopener" download>Download PDF</a></div>`
    });
  }

  function openKisiKisi(c){
    window.SYKA_MODAL.open({
      title:'Kisi-kisi • '+c.title,
      wide:true,
      html:`<article class="kisi-kisi-v47"><div class="kisi-kisi-head"><span class="eyebrow">PERSIAPAN KOMPETISI</span><h2>${esc(c.title)}</h2><p>Materi persiapan yang sudah dipublikasikan penyelenggara.</p></div><div class="kisi-kisi-body">${c.kisiKisiContent?esc(c.kisiKisiContent).replace(/\n/g,'<br>'):'Kisi-kisi belum diisi.'}</div></article>`
    });
  }

  function validSocialUrl(value){
    try{
      const u=new URL(value);
      return u.protocol==='https:' && /(^|\\.)instagram\\.com$|(^|\\.)tiktok\\.com$/i.test(u.hostname);
    }catch(_){return false;}
  }

  async function openRegistrationFlow(c,template,rules,reg){
    if(reg){
      window.SYKA_MODAL.open({
        title:'Status pendaftaran',
        html:`<div class="registration-status-modal-v47"><span class="status-pill ${window.SYKA_UTILS.statusClass(reg.status)}">${esc(reg.status)}</span><h2>${reg.status==='ACTIVE'?'Pendaftaran disetujui':reg.status==='REJECTED'?'Pendaftaran ditolak':'Menunggu persetujuan'}</h2><p>${reg.status==='ACTIVE'?'Kamu sudah terdaftar sebagai peserta aktif.':reg.status==='REJECTED'?'Pendaftaran ditolak oleh penyelenggara.':'Pendaftaran sedang menunggu pemeriksaan penyelenggara.'}</p>${reg.rejection_reason?`<div class="inline-error">${esc(reg.rejection_reason)}</div>`:''}</div>`
      });
      return;
    }

    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){
      window.SYKA_APP.openAuth('login',{target:window.location.pathname+window.location.search});
      return;
    }

    const profile=auth.profile||{};
    const eligibility=await window.SYKA_REGISTRATION_SERVICE.checkEligibility({competitionId:c.id,grade:profile.grade});
    if(!eligibility?.eligible){
      const messages={
        LOGIN_REQUIRED:'Masuk diperlukan',
        COMPETITION_NOT_FOUND:'Kompetisi tidak ditemukan',
        REGISTRATION_NOT_OPEN:'Pendaftaran belum dibuka',
        REGISTRATION_CLOSED:'Pendaftaran sudah ditutup',
        ELIGIBILITY_FAILED:'Kamu belum memenuhi ketentuan jenjang/kelas',
        ALREADY_REGISTERED:'Kamu sudah memiliki pendaftaran untuk kompetisi ini',
        PARTICIPANT_LIMIT_REACHED:'Kuota peserta sudah penuh'
      };
      window.SYKA_MODAL.open({title:'Belum bisa mendaftar',html:`<div class="registration-guard-v47"><div class="guard-icon">!</div><h2>${esc(messages[eligibility.reason]||'Pendaftaran belum tersedia')}</h2><p>Aturan final berasal dari server. Periksa profil dan jadwal kompetisi sebelum mencoba lagi.</p></div>`});
      return;
    }

    const needsTwibbon=!!rules?.require_twibbon;
    const needsSocial=!!rules?.require_social_proof;
    const templateImg=template?.image_url||'';

    if(needsTwibbon && !templateImg){
      window.SYKA_MODAL.open({title:'Twibbon belum siap',html:`<div class="registration-guard-v47"><div class="guard-icon">!</div><h2>Template twibbon belum tersedia</h2><p>Penyelenggara mewajibkan twibbon tetapi belum menyiapkan template aktif.</p></div>`});
      return;
    }

    let stage=needsTwibbon?1:(needsSocial?2:3);
    let twibbonReady=false;
    let twibbonDataUrl=null;
    let socialUrl='';

    function progress(){
      const steps=[];
      if(needsTwibbon)steps.push(['01','Twibbon']);
      if(needsSocial)steps.push([String(steps.length+1).padStart(2,'0'),'Social proof']);
      steps.push([String(steps.length+1).padStart(2,'0'),'Kirim']);
      const activeIndex=stage===1&&needsTwibbon?0:stage===2?steps.findIndex(x=>x[1]==='Social proof'):steps.length-1;
      return `<div class="flow-progress-v47">${steps.map((s,i)=>`<div class="flow-step ${i<activeIndex?'done':i===activeIndex?'active':''}"><span>${i<activeIndex?'✓':s[0]}</span><b>${s[1]}</b></div>${i<steps.length-1?'<i></i>':''}`).join('')}</div>`;
    }

    function openStep(){
      const title=stage===1&&needsTwibbon?'Daftar • Buat Twibbon':stage===2?'Daftar • Social proof':'Daftar • Konfirmasi';
      window.SYKA_MODAL.open({title,wide:true,html:stepHtml(),onOpen:bindStep});
    }

    function stepHtml(){
      if(stage===1&&needsTwibbon){
        return `<div class="registration-flow-v47">${progress()}<section class="registration-step-card"><span class="eyebrow">LANGKAH 01</span><h2>Gunakan twibbon resmi</h2><p>Foto peserta diproses sepenuhnya di browser. Hasilnya tidak disimpan ke server.</p><div class="twibbon-local-box-v47"><div class="twibbon-canvas-wrap-v47"><canvas id="twibbon-canvas" width="1080" height="1080"></canvas><span class="local-badge-v47">Lokal • belum upload</span></div><div class="twibbon-upload-help"><label class="btn btn-secondary"><input id="twibbon-photo" type="file" accept="image/png,image/jpeg,image/webp" hidden>Pilih foto</label><small>PNG, JPG, WEBP · maksimal 5 MB</small><div class="local-workflow-note-v47"><strong>Privasi</strong><span>Hasil twibbon tidak masuk Cloudinary dan tidak tersimpan di database.</span></div></div></div><div class="twibbon-actions-v47"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-secondary" id="tw-download" disabled>Download</button><button class="btn btn-secondary" id="tw-save" disabled>Simpan sementara</button><button class="btn btn-secondary" id="tw-share" disabled>Share</button><button class="btn btn-primary" id="tw-next" disabled>Lanjut</button></div><div id="tw-feedback"></div></section></div>`;
      }
      if(stage===2&&needsSocial){
        return `<div class="registration-flow-v47">${progress()}<section class="registration-step-card"><span class="eyebrow">LANGKAH 02</span><h2>Bagikan dan tempel link</h2><p>Posting hasil twibbon di Instagram atau TikTok, lalu masukkan URL postingan publiknya.</p><div class="social-proof-platforms"><span>Instagram</span><span>TikTok</span></div><label>URL postingan *<input id="social-url" type="url" placeholder="https://www.instagram.com/... atau https://www.tiktok.com/..." value="${esc(socialUrl)}"></label><div class="form-hint">Yang disimpan ke server hanya URL bukti. Hasil gambar twibbon peserta tidak disimpan.</div><div class="twibbon-actions-v47"><button class="btn btn-ghost" id="sp-back">Kembali</button><button class="btn btn-primary" id="sp-next">Lanjut</button></div><div id="sp-feedback"></div></section></div>`;
      }
      return `<div class="registration-flow-v47">${progress()}<section class="registration-step-card registration-confirm-v47"><div class="confirm-icon">✓</div><span class="eyebrow">LANGKAH TERAKHIR</span><h2>Siap mengirim pendaftaran?</h2><p>Setelah dikirim, status mengikuti mode persetujuan yang ditetapkan penyelenggara.</p><div class="confirm-summary-v47"><div><span>Kompetisi</span><strong>${esc(c.title)}</strong></div><div><span>Persetujuan</span><strong>${rules?.approval_mode==='AUTO'?'Otomatis':'Manual oleh organizer'}</strong></div>${needsTwibbon?'<div><span>Twibbon</span><strong>✓ Selesai lokal</strong></div>':''}${needsSocial?'<div><span>Social proof</span><strong>✓ URL disiapkan</strong></div>':''}</div><div class="twibbon-actions-v47"><button class="btn btn-ghost" id="confirm-back">Kembali</button><button class="btn btn-primary" id="submit-registration">Kirim pendaftaran</button></div><div id="confirm-feedback"></div></section></div>`;
    }

    function drawCanvas(canvas,photoImg,overlayImg){
      const ctx=canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if(photoImg){
        const scale=Math.max(canvas.width/photoImg.width,canvas.height/photoImg.height);
        const w=photoImg.width*scale,h=photoImg.height*scale;
        ctx.drawImage(photoImg,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
      }
      if(overlayImg&&overlayImg.complete)ctx.drawImage(overlayImg,0,0,canvas.width,canvas.height);
      twibbonDataUrl=canvas.toDataURL('image/png');
      twibbonReady=true;
    }

    async function twibbonBlob(){
      if(!twibbonDataUrl)return null;
      const res=await fetch(twibbonDataUrl);
      return res.blob();
    }

    function bindStep(b){
      b.querySelector('[data-close]')?.addEventListener('click',()=>window.SYKA_MODAL.close());
      if(stage===1&&needsTwibbon){
        const canvas=b.querySelector('#twibbon-canvas');
        const ctx=canvas.getContext('2d');
        const file=b.querySelector('#twibbon-photo');
        const download=b.querySelector('#tw-download');
        const save=b.querySelector('#tw-save');
        const share=b.querySelector('#tw-share');
        const next=b.querySelector('#tw-next');
        const feedback=b.querySelector('#tw-feedback');
        let photoImg=null;
        let overlayImg=null;
        if(templateImg){
          overlayImg=new Image();
          overlayImg.crossOrigin='anonymous';
          overlayImg.onload=()=>{if(photoImg)drawCanvas(canvas,photoImg,overlayImg);};
          overlayImg.onerror=()=>{feedback.innerHTML='<div class="inline-error">Template twibbon tidak dapat diproses di browser. Minta penyelenggara memperbaiki asset Cloudinary.</div>';};
          overlayImg.src=templateImg;
        }
        file.onchange=()=>{
          const f=file.files?.[0];
          if(!f)return;
          if(f.size>5000000){feedback.innerHTML='<div class="inline-error">Ukuran foto maksimal 5 MB.</div>';return;}
          if(!['image/png','image/jpeg','image/webp'].includes(f.type)){feedback.innerHTML='<div class="inline-error">Gunakan PNG, JPG, atau WEBP.</div>';return;}
          const url=URL.createObjectURL(f);
          const img=new Image();
          img.onload=()=>{photoImg=img;drawCanvas(canvas,photoImg,overlayImg);download.disabled=false;save.disabled=false;share.disabled=false;next.disabled=false;feedback.innerHTML='<div class="success-inline">Preview twibbon siap. Belum ada file yang dikirim ke server.</div>';URL.revokeObjectURL(url);};
          img.onerror=()=>{feedback.innerHTML='<div class="inline-error">Foto tidak dapat dibaca.</div>';URL.revokeObjectURL(url);};
          img.src=url;
        };
        download.onclick=()=>{if(!twibbonReady)return;const a=document.createElement('a');a.href=twibbonDataUrl;a.download=(c.slug||'sykabelajar')+'-twibbon.png';a.click();};
        save.onclick=()=>{if(!twibbonReady)return;window.__SYKA_TWIBBON_DRAFT__={competitionId:c.id,dataUrl:twibbonDataUrl,createdAt:Date.now()};feedback.innerHTML='<div class="success-inline">Twibbon disimpan sementara di sesi browser. Tidak ada upload ke server.</div>';};
        share.onclick=async()=>{
          if(!twibbonReady)return;
          try{
            if(navigator.share){
              const blob=await twibbonBlob();
              const fileObj=new File([blob],'sykabelajar-twibbon.png',{type:'image/png'});
              if(!navigator.canShare||navigator.canShare({files:[fileObj]})){
                await navigator.share({title:c.title,text:'Twibbon '+c.title,files:[fileObj]});
                feedback.innerHTML='<div class="success-inline">Menu share perangkat dibuka.</div>';
                return;
              }
            }
            await navigator.clipboard.writeText(window.location.href);
            feedback.innerHTML='<div class="success-inline">Perangkat belum mendukung share file. Link kompetisi disalin.</div>';
          }catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Share dibatalkan.')}</div>`;}
        };
        next.onclick=()=>{stage=needsSocial?2:3;openStep();};
        return;
      }
      if(stage===2&&needsSocial){
        b.querySelector('#sp-back').onclick=()=>{stage=needsTwibbon?1:3;openStep();};
        b.querySelector('#sp-next').onclick=()=>{
          const value=b.querySelector('#social-url').value.trim();
          const feedback=b.querySelector('#sp-feedback');
          if(!validSocialUrl(value)){feedback.innerHTML='<div class="inline-error">Gunakan URL postingan Instagram atau TikTok yang valid.</div>';return;}
          socialUrl=value;stage=3;openStep();
        };
        return;
      }
      b.querySelector('#confirm-back').onclick=()=>{stage=needsSocial?2:(needsTwibbon?1:3);openStep();};
      b.querySelector('#submit-registration').onclick=async()=>{
        const btn=b.querySelector('#submit-registration');
        const feedback=b.querySelector('#confirm-feedback');
        btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Mengirim…';
        try{
          const result=await window.SYKA_REGISTRATION_SERVICE.register({competitionId:c.id,socialProofUrl:needsSocial?socialUrl:null,twibbonCompleted:needsTwibbon?twibbonReady:false});
          window.SYKA_MODAL.close();
          window.SYKA_TOAST.show(result?.status==='ACTIVE'?'Pendaftaran otomatis disetujui.':'Pendaftaran terkirim dan menunggu review.','success');
          window.SYKA_ROUTER.refresh();
        }catch(error){btn.disabled=false;btn.textContent='Kirim pendaftaran';feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Pendaftaran gagal.')}</div>`;}
      };
    }

    openStep();
  }

  async function render(root,slug){
    root.innerHTML='<div class="page-loading"><div class="loading-spinner"></div><span>Memuat detail kompetisi…</span></div>';
    const c=await window.SYKA_COMPETITION_SERVICE.getBySlug(slug);
    if(!c){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Slug kompetisi tidak tersedia atau sudah diarsipkan.',actionHtml:`<a class="btn btn-secondary" href="${window.SYKA_ROUTER.href('/lomba')}">Kembali ke katalog</a>`});return;}
    const [levels,rules,rewards,template]=await Promise.all([
      window.SYKA_COMPETITION_SERVICE.getLevels(c.id).catch(()=>[]),
      window.SYKA_COMPETITION_SERVICE.getRules(c.id).catch(()=>null),
      window.SYKA_COMPETITION_SERVICE.getRewards(c.id).catch(()=>[]),
      window.SYKA_COMPETITION_SERVICE.getTwibbonTemplate(c.id).catch(()=>null)
    ]);
    const auth=window.SYKA_STATE.getState().auth;
    const reg=auth.user?await window.SYKA_REGISTRATION_SERVICE.getStatus(auth.user.id,c.id).catch(()=>null):null;
    const poster=window.SYKA_UTILS.cloudinaryTransform(c.poster||c.poster_url,{width:1400,height:900,crop:'fill'});
    const state=registrationState(c.status);
    const canRegister=c.status==='REGISTRATION_OPEN';
    const active=reg?.status==='ACTIVE';
    const showKisi=active&&!!c.kisiKisiPublished;
    let primary='Daftar';
    if(reg?.status==='PENDING')primary='Menunggu persetujuan';
    else if(reg?.status==='REJECTED')primary='Daftar ulang';
    else if(active&&showKisi)primary='Kisi-kisi';
    else if(active)primary='Sudah terdaftar';
    else if(!canRegister)primary=state.label;

    root.innerHTML=`<div class="competition-page-v47">
      <div class="competition-breadcrumb"><a href="${window.SYKA_ROUTER.href('/lomba')}">Lomba</a><span>›</span><strong>${esc(c.category||'Kompetisi')}</strong><span>›</span><strong>${esc(c.title)}</strong></div>
      <section class="competition-hero-v47 competition-hero-polished-v47">
        <div class="competition-poster-wrap-v47">${poster?`<img src="${esc(poster)}" alt="${esc(c.title)}" loading="eager">`:'<div class="competition-cover-empty"><span>✦</span><strong>Poster kompetisi</strong><small>Belum ditambahkan penyelenggara.</small></div>'}<div class="poster-badges-v47"><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span><span class="chip chip-white">${esc(c.category||'Kompetisi')}</span></div></div>
        <div class="competition-hero-copy-v47"><div class="competition-label-row-v47"><span class="eyebrow">SYKABELAJAR COMPETITION</span><span class="competition-id-badge">PUBLIC</span></div><h1>${esc(c.title)}</h1><p>${esc(c.description||'Ikuti kompetisi, selesaikan prosesnya, dan bangun rekam prestasi yang dapat diverifikasi.')}</p><div class="competition-countdown-card-v47"><div><span>Pendaftaran</span><strong>${fmt(c.registrationStartsAt)}</strong><small>sampai ${fmt(c.registrationEndsAt)}</small></div><div><span>Kompetisi</span><strong>${fmt(c.startsAt)}</strong><small>sampai ${fmt(c.endsAt)}</small></div><div><span>Pengumuman</span><strong>${fmt(c.announcementAt)}</strong><small>hasil resmi</small></div></div><div class="competition-cta-bar-v47"><button class="btn ${primary==='Menunggu persetujuan'||primary==='Sudah terdaftar'?'btn-secondary':'btn-primary'} btn-lg" id="primary-action" ${primary==='Menunggu persetujuan'?'disabled':''}>${esc(primary)}${primary!=='Sudah terdaftar'&&primary!=='Menunggu persetujuan'?' <span>→</span>':''}</button><button class="btn btn-secondary btn-lg" id="juknis-action">Juknis</button><button class="btn btn-secondary btn-lg" id="share-action">Share</button></div>${reg?`<div class="registration-inline-status-v47"><span class="status-pill ${window.SYKA_UTILS.statusClass(reg.status)}">${esc(reg.status)}</span><div><strong>${reg.status==='ACTIVE'?'Peserta aktif':reg.status==='PENDING'?'Menunggu persetujuan penyelenggara':reg.status==='REJECTED'?'Pendaftaran ditolak':'Status pendaftaran'}</strong><small>${reg.rejection_reason?esc(reg.rejection_reason):'Status berasal dari server.'}</small></div></div>`:`<div class="registration-inline-status-v47"><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span><div><strong>${esc(state.label)}</strong><small>${esc(state.detail)}</small></div></div>`}</div>
      </section>
      <section class="detail-grid-v47">
        <article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">ELIGIBILITY</span><h2>Siapa yang bisa ikut?</h2><p>Persyaratan yang diterapkan penyelenggara.</p></div></div><div class="detail-list-v47">${[['Jenjang / kelas',levels.length?levels.map(x=>x.label||x.code).join(' · '):((rules?.allowed_grades||[]).join(' · ')||'Mengikuti aturan kompetisi')],['Twibbon',rules?.require_twibbon?'Wajib':'Opsional'],['Social proof',rules?.require_social_proof?'Wajib':'Opsional'],['Approval',rules?.approval_mode==='AUTO'?'Otomatis sesuai paket':'Manual oleh penyelenggara'],['Kuota',rules?.max_participants?Number(rules.max_participants).toLocaleString('id-ID'):'Tanpa batas khusus']].map(([l,v])=>`<div><span>${l}</span><strong>${esc(v)}</strong></div>`).join('')}</div></article>
        <article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">PANDUAN</span><h2>Dokumen & persiapan</h2><p>Semua bahan penting sebelum mengikuti kompetisi.</p></div></div><div class="guide-actions-v47"><button class="guide-action" id="guide-juknis"><span>PDF</span><div><strong>Juknis</strong><small>${c.juknisUrl?'Panduan resmi siap dibaca':'Belum diunggah'}</small></div><b>→</b></button><button class="guide-action" id="guide-kisi" ${showKisi?'':'disabled'}><span>KI</span><div><strong>Kisi-kisi</strong><small>${showKisi?'Sudah dipublikasikan':'Muncul setelah organizer publish'}</small></div><b>→</b></button><div class="guide-action static"><span>03</span><div><strong>Timeline</strong><small>Ikuti seluruh jadwal kompetisi.</small></div></div></div></article>
      </section>
      <section class="detail-grid-v47 detail-grid-equal-v47"><article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">REWARD</span><h2>Hadiah & penghargaan</h2><p>Reward yang dikonfigurasi penyelenggara.</p></div></div><div class="reward-list-v47">${rewards.length?rewards.map((r,i)=>`<div class="reward-card-v47"><span class="reward-rank-v47">${esc(r.rank_code||String(i+1))}</span><div><strong>${esc(r.title||'Reward')}</strong><small>${Number(r.points||0).toLocaleString('id-ID')} points${r.emblem_name?' · '+esc(r.emblem_name):''}</small></div><b>✦</b></div>`).join(''):'<div class="reward-empty-v47"><span>✦</span><strong>Reward belum dipublikasikan</strong><small>Penyelenggara belum mengisi reward kompetisi.</small></div>'}</div></article><article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">TWIBBON</span><h2>Template peserta</h2><p>Template tetap disimpan sebagai asset organizer.</p></div></div><div class="twibbon-info-v47">${template?`<img src="${esc(window.SYKA_UTILS.cloudinaryTransform(template.image_url,{width:240,height:240,crop:'fit'}))}" alt="Twibbon template"><div><strong>${esc(template.name)}</strong><small>Hasil twibbon dibuat lokal, diunduh, dan tidak disimpan ke server.</small></div>`:'<div class="empty-inline">Template belum tersedia.</div>'}</div></article></section>
      <section class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">CHECKLIST</span><h2>Yang perlu disiapkan</h2><p>Ikuti urutan ini supaya proses pendaftaran lancar.</p></div></div><div class="prep-grid-v47"><div><span>01</span><strong>Lengkapi profil</strong><small>Nama, kelas, sekolah, dan data pendukung harus sesuai.</small></div><div><span>02</span><strong>Buat twibbon</strong><small>Gunakan template resmi dan simpan hasilnya di perangkat.</small></div><div><span>03</span><strong>Share & bukti URL</strong><small>Posting di Instagram/TikTok lalu tempel link publik.</small></div><div><span>04</span><strong>Siap ikut</strong><small>Soal peserta hanya tersedia ketika kompetisi LIVE.</small></div></div></section>
      <section class="detail-grid-v47"><article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">SUPPORT</span><h2>Butuh bantuan?</h2><p>Pastikan profil dan dokumenmu siap sebelum mendaftar.</p></div></div><a class="support-callout-v47" href="${window.SYKA_ROUTER.href('/profile')}"><strong>Periksa profil saya</strong><span>Buka profil →</span></a></article><article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">ASSESSMENT</span><h2>Soal kompetisi</h2><p>${c.status==='LIVE'?'Soal hanya dibuka untuk peserta aktif saat tahap LIVE.':'Soal belum dibuka. Tunggu tahap LIVE setelah pendaftaran ditutup.'}</p></div></div><div class="assessment-state-v47"><span>${c.status==='LIVE'?'LIVE':'LOCKED'}</span><strong>${c.status==='LIVE'?'Peserta aktif dapat masuk ke tahap ujian.':'Belum tersedia untuk peserta.'}</strong></div></article></section>
    </div>`;

    document.getElementById('primary-action')?.addEventListener('click',()=>{
      if(primary==='Kisi-kisi'){openKisiKisi(c);return;}
      if(reg?.status==='PENDING'||reg?.status==='REJECTED'){openRegistrationFlow(c,template,rules,reg?.status==='PENDING'?reg:null);return;}
      if(reg?.status==='ACTIVE'){window.SYKA_MODAL.open({title:'Pendaftaran aktif',html:`<div class="registration-status-modal-v47"><span class="status-pill status-success">ACTIVE</span><h2>Kamu sudah terdaftar</h2><p>${c.status==='LIVE'?'Kompetisi sedang LIVE. Soal peserta hanya dibuka untuk peserta aktif.':'Ikuti timeline dan tunggu tahap LIVE.'}</p></div>`});return;}
      if(canRegister){openRegistrationFlow(c,template,rules,null);return;}
      window.SYKA_TOAST.show(state.detail,'info');
    });

    document.getElementById('juknis-action')?.addEventListener('click',()=>openJuknis(c.juknisUrl,c.title));
    document.getElementById('guide-juknis')?.addEventListener('click',()=>openJuknis(c.juknisUrl,c.title));
    document.getElementById('guide-kisi')?.addEventListener('click',()=>showKisi&&openKisiKisi(c));
    document.getElementById('share-action')?.addEventListener('click',()=>window.SYKA_MODAL.open({title:'Bagikan kompetisi',html:shareOptions(),onOpen:b=>{
      b.querySelector('[data-share="native"]')?.addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:c.title,url:location.href});else await navigator.clipboard.writeText(location.href);window.SYKA_MODAL.close();}catch(_){}});
      b.querySelector('[data-share="whatsapp"]')?.addEventListener('click',()=>window.open(`https://wa.me/?text=${encodeURIComponent(c.title+' '+location.href)}`,'_blank','noopener'));
      b.querySelector('[data-share="copy"]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);window.SYKA_TOAST.show('Link kompetisi disalin.','success');window.SYKA_MODAL.close();}catch(_){}});
    }}));
  }

  window.SYKA_PAGE_COMPETITION={render};
})();
