(function(){
  const esc=window.SYKA_UTILS.escapeHtml;
  const fmt=window.SYKA_UTILS.formatDateTime;

  function optionValue(question){
    const cfg=question.config||{};
    return cfg.options||[];
  }

  function renderQuestion(q,idx,answer){
    const type=q.type;
    const current=answer?.answer_json;
    let body='';
    if(['multiple_choice','true_false'].includes(type)){
      const options=q.options||[];
      body=options.map(o=>`<label class="attempt-option"><input type="radio" name="q-${q.id}" value="${esc(o.value)}" ${current?.value===o.value?'checked':''}><span>${esc(o.label)}</span></label>`).join('');
    }else if(type==='multiple_checkbox'){
      const selected=Array.isArray(current?.values)?current.values:[];
      body=(q.options||[]).map(o=>`<label class="attempt-option"><input type="checkbox" data-multi-q="${q.id}" value="${esc(o.value)}" ${selected.includes(o.value)?'checked':''}><span>${esc(o.label)}</span></label>`).join('');
    }else if(type==='short_answer'){
      body=`<input class="attempt-text-input" data-short-q="${q.id}" value="${esc(current?.value||'')}" placeholder="Tulis jawaban singkat…">`;
    }else if(type==='essay'){
      body=`<textarea class="attempt-essay" data-essay-q="${q.id}" rows="8" placeholder="Tulis jawabanmu di sini…">${esc(current?.value||'')}</textarea>`;
    }else if(type==='file_upload'){
      body=`<input type="file" class="attempt-file" data-file-q="${q.id}"><small class="field-help">File dikirim saat jawaban disimpan sesuai aturan kompetisi.</small>`;
    }else{
      body='<div class="inline-error">Jenis soal belum didukung.</div>';
    }
    return `<article class="attempt-question" data-question="${q.id}"><div class="attempt-question-head"><span>${String(idx+1).padStart(2,'0')}</span><div><span class="eyebrow">${esc(q.type)}</span><h3>${esc(q.prompt)}</h3></div><b>${Number(q.points||0)} pts</b></div><div class="attempt-question-body">${body}</div><div class="attempt-save-state" data-save-state="${q.id}"></div></article>`;
  }

  async function render(root,attemptId){
    try{
      const state=await window.SYKA_ATTEMPT_SERVICE.getResume(attemptId);
      if(!state){root.innerHTML=window.SYKA_EMPTY.render({title:'Attempt tidak ditemukan',text:'Sesi ujian tidak tersedia atau sudah berakhir.'});return;}
      const attempt=state.attempt||state;
      const questions=state.questions||[];
      const answers=state.answers||[];
      const map=new Map(answers.map(a=>[a.question_id,a]));
      root.innerHTML=`<div class="attempt-page-v48"><div class="attempt-topbar"><div><span class="eyebrow">ASSESSMENT</span><h1>${esc(state.competition?.title||'Kompetisi')}</h1><small>Mulai ${fmt(attempt.started_at)} · Berakhir ${fmt(attempt.expires_at)}</small></div><div class="attempt-clock" id="attempt-clock">--:--</div></div><div class="attempt-progress"><div class="attempt-progress-track"><span id="attempt-progress-fill"></span></div><span id="attempt-progress-label">0 / ${questions.length} terjawab</span></div><form id="attempt-form">${questions.map((q,i)=>renderQuestion(q,i,map.get(q.id))).join('')}<div class="attempt-submit-bar"><span id="attempt-submit-feedback"></span><button class="btn btn-primary btn-lg" type="submit">Kirim jawaban</button></div></form></div>`;
      const form=root.querySelector('#attempt-form');
      const dirtyTimers=new Map();
      const pending=new Map();
      function readAnswer(q){
        if(q.type==='multiple_choice'||q.type==='true_false'){
          const el=form.querySelector(`input[name="q-${q.id}"]:checked`);return {value:el?.value||null};
        }
        if(q.type==='multiple_checkbox'){
          return {values:[...form.querySelectorAll(`[data-multi-q="${q.id}"]:checked`)].map(x=>x.value)};
        }
        if(q.type==='short_answer') return {value:form.querySelector(`[data-short-q="${q.id}"]`)?.value||''};
        if(q.type==='essay') return {value:form.querySelector(`[data-essay-q="${q.id}"]`)?.value||''};
        return {value:null};
      }
      async function persist(q){
        const answerJson=readAnswer(q);
        const stateEl=form.querySelector(`[data-save-state="${q.id}"]`);
        stateEl.textContent='Menyimpan…';
        try{pending.set(q.id,true);await window.SYKA_ATTEMPT_SERVICE.saveAnswer({attemptId,questionId:q.id,answerJson});stateEl.textContent='Tersimpan';}catch(e){stateEl.textContent='Gagal menyimpan';console.error('[Sykabelajar] answer save failed',e);}finally{pending.delete(q.id);updateProgress();}
      }
      function queue(q){clearTimeout(dirtyTimers.get(q.id));dirtyTimers.set(q.id,setTimeout(()=>persist(q),700));}
      function updateProgress(){let n=0;for(const q of questions){const a=readAnswer(q);if(a.value||Array.isArray(a.values)&&a.values.length)n++;}root.querySelector('#attempt-progress-fill').style.width=(questions.length?Math.round(n/questions.length*100):0)+'%';root.querySelector('#attempt-progress-label').textContent=`${n} / ${questions.length} terjawab`;}
      questions.forEach(q=>{form.querySelectorAll(`[data-question="${q.id}"] input, [data-question="${q.id}"] textarea`).forEach(el=>el.addEventListener('input',()=>queue(q)));form.querySelectorAll(`[data-question="${q.id}"] input[type="radio"], [data-question="${q.id}"] input[type="checkbox"]`).forEach(el=>el.addEventListener('change',()=>{queue(q);updateProgress();}));});
      updateProgress();
      const expires=new Date(attempt.expires_at||Date.now()).getTime();
      const tick=()=>{const left=Math.max(0,expires-Date.now());const sec=Math.floor(left/1000);const mm=String(Math.floor(sec/60)).padStart(2,'0');const ss=String(sec%60).padStart(2,'0');root.querySelector('#attempt-clock').textContent=`${mm}:${ss}`;if(left<=0){clearInterval(timer);root.querySelector('#attempt-submit-feedback').textContent='Waktu habis. Mengirim jawaban…';form.requestSubmit();}};
      const timer=setInterval(tick,1000);tick();
      form.onsubmit=async e=>{e.preventDefault();const btn=form.querySelector('button[type="submit"]');btn.disabled=true;root.querySelector('#attempt-submit-feedback').textContent='Mengirim jawaban…';try{for(const q of questions)await persist(q);const result=await window.SYKA_ATTEMPT_SERVICE.submit({attemptId});clearInterval(timer);root.innerHTML=`<div class="attempt-result-panel"><div class="confirm-icon">✓</div><span class="eyebrow">SUBMITTED</span><h2>Jawaban sudah dikirim</h2><p>${result?.status==='FINALIZED'?'Hasil otomatis sudah diproses.':'Jawaban terkirim dan masuk tahap penilaian.'}</p><a class="btn btn-primary" href="${window.SYKA_ROUTER.href('/lomba')}" >Kembali ke lomba</a></div>`;}catch(err){btn.disabled=false;root.querySelector('#attempt-submit-feedback').innerHTML=`<span class="inline-error">${esc(err.message||'Submit gagal.')}</span>`;}};
    }catch(e){console.error('[Sykabelajar] attempt render failed',e);root.innerHTML=window.SYKA_EMPTY.render({title:'Ujian gagal dimuat',text:e.message||'Silakan coba lagi.',actionHtml:`<button class="btn btn-primary" id="retry-attempt">Coba lagi</button>`});root.querySelector('#retry-attempt')?.addEventListener('click',()=>render(root,attemptId));}
  }
  window.SYKA_PAGE_ATTEMPT={render};
})();
