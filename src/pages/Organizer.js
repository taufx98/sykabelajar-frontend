(function() {
    const svc = () => window.SYKA_CONTROL_SERVICE;
    const esc = v => window.SYKA_UTILS.escapeHtml(v);
    const fmt = v => window.SYKA_UTILS.formatDate(v);
    const tabs = [
        ['dashboard', 'Dashboard'],
        ['competitions', 'Kompetisi'],
        ['participants', 'Peserta'],
        ['questions', 'Soal'],
        ['grading', 'Grading'],
        ['results', 'Results'],
        ['awards', 'Awards'],
        ['certificates', 'Certificate'],
        ['twibbon', 'Twibbon'],
        ['notifications', 'Notifikasi'],
        ['plan', 'Plan & Usage']
    ];
    async function membership() {
        const a = window.SYKA_STATE.getState().auth;
        return window.SYKA_ADMIN_SERVICE.listMyOrganizerMemberships(a.user.id);
    }

    function shell(tab, org) {
        return `<div class="control-head"><div><span class="eyebrow">ORGANIZER CONTROL PLANE</span><h1>${esc(org?.name||'Penyelenggara')}</h1><p>Create competition → approval → grading → result → award/certificate.</p></div><div class="org-plan-chip">${esc(org?.plan_code||'FREE')}</div></div><div class="control-tabs">${tabs.map(([k,l])=>`<a href="${window.SYKA_ROUTER.href('/organizer')}&tab=${k}" class="control-tab ${k===tab?'active':''}" data-org-tab="${k}">${l}</a>`).join('')}</div><div id="control-content"><div class="page-loading"><div class="loading-spinner"></div></div></div>`;
    }
    async function render(root) {
        const a = window.SYKA_STATE.getState().auth;
        if (!a.user) {
            root.innerHTML = window.SYKA_EMPTY.render({
                title: 'Masuk diperlukan',
                text: 'Panel penyelenggara hanya untuk anggota organizer.'
            }) + '<div class="control-center"><button class="btn btn-primary" id="org-login">Masuk</button></div>';
            document.getElementById('org-login').onclick = () => window.SYKA_APP.openAuth('login');
            return;
        }
        if (!a.roles.includes('organizer_member') && !a.roles.includes('admin')) {
            root.innerHTML = window.SYKA_EMPTY.render({
                title: 'Akses organizer diperlukan',
                text: 'Tambahkan role organizer_member dan membership terlebih dahulu.'
            });
            return;
        }
        const memberships = await membership();
        const m = memberships[0] || {};
        const tab = window.SYKA_STATE.getState().route.query.tab || 'dashboard';
        root.innerHTML = shell(tabs.some(x => x[0] === tab) ? tab : 'dashboard', m.organizers || {});
        root.querySelectorAll('[data-org-tab]').forEach(x => {
  x.addEventListener('click', e => {
    e.preventDefault();

    const u = new URL(x.href);
    const tab = u.searchParams.get('tab') || 'dashboard';

    const cfg = window.SYKA_CONFIG || {};
    const appPage = cfg.APP_PAGE || '/p/app.html';

    const target = new URL(window.location.href);

    target.pathname = appPage;
    target.search = '';

    target.searchParams.set('route', '/organizer');
    target.searchParams.set('tab', tab);

    window.history.pushState(
      {},
      '',
      target.pathname + '?' + target.searchParams.toString()
    );

    window.SYKA_ROUTER.refresh();
  });
});
        await renderTab(document.getElementById('control-content'), tab, m.organizer_id || null);
    }
    async function renderTab(root, tab, orgId) {
        try {
            if (tab === 'dashboard') return dashboard(root, orgId);
            if (tab === 'competitions') return competitions(root, orgId);
            if (tab === 'participants') return participants(root, orgId);
            if (tab === 'questions') return questions(root, orgId);
            if (tab === 'grading') return grading(root, orgId);
            if (tab === 'results') return results(root, orgId);
            if (tab === 'awards') return awards(root, orgId);
            if (tab === 'certificates') return certificates(root, orgId);
            if (tab === 'twibbon') return twibbon(root, orgId);
            if (tab === 'notifications') return notifications(root);
            if (tab === 'plan') return plan(root, orgId);
        } catch (e) {
            root.innerHTML = window.SYKA_EMPTY.render({
                title: 'Modul organizer gagal',
                text: e.message || 'Periksa RLS dan membership.'
            });
        }
    }
    async function dashboard(root, orgId) {
        const rows = await svc().listCompetitionsAdmin({
            limit: 200
        });
        const mine = rows.filter(x => x.organizer_id === orgId);
        const regs = await Promise.all(mine.slice(0, 20).map(c => svc().listRegistrations({
            competitionId: c.id
        })));
        const allRegs = regs.flat();
        root.innerHTML = `<div class="admin-kpi-grid"><div class="syka-card admin-kpi"><strong>${mine.length}</strong><span>Kompetisi dikelola</span></div><div class="syka-card admin-kpi"><strong>${mine.filter(x=>x.status==='REGISTRATION_OPEN').length}</strong><span>Registration open</span></div><div class="syka-card admin-kpi"><strong>${allRegs.filter(r=>['APPROVED','ACTIVE'].includes(r.status)).length}</strong><span>Peserta approved</span></div><div class="syka-card admin-kpi"><strong>${allRegs.filter(r=>r.status==='PENDING').length}</strong><span>Pending approval</span></div></div><section class="syka-card admin-section"><div class="admin-section-head"><div><span class="eyebrow">LIFECYCLE</span><h2>Kompetisi terakhir</h2></div><button class="btn btn-primary btn-sm" id="new-org-comp">+ Kompetisi</button></div><div class="admin-table">${mine.slice(0,10).map(c=>`<div class="admin-row"><div><strong>${esc(c.title)}</strong><small>${esc(c.status)} · ${fmt(c.created_at)}</small></div><span class="chip">${esc(c.slug)}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama dari tombol di atas.'})}</div></section>`;
        document.getElementById('new-org-comp').onclick = () => competitionModal(orgId, null);
    }
    async function competitions(root, orgId) {
        const rows = (await svc().listCompetitionsAdmin({
            limit: 200
        })).filter(x => x.organizer_id === orgId);
        root.innerHTML = `<div class="control-local-head"><div><h2>Kompetisi</h2><span>Draft sampai archive sesuai state machine.</span></div><button class="btn btn-primary" id="org-comp-new">+ Kompetisi</button></div><div class="admin-table">${rows.map(c=>`<div class="admin-row"><div><strong>${esc(c.title)}</strong><small>${esc(c.category)} · ${esc(c.slug)}</small><div class="chip-row"><span class="chip">${esc(c.status)}</span><span class="chip">Reg: ${fmt(c.registration_starts_at)} — ${fmt(c.registration_ends_at)}</span></div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${c.id}">Edit</button><button class="btn btn-primary btn-sm" data-trans="${c.id}">Transisi</button></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama.'})}</div>`;
        root.querySelector('#org-comp-new').onclick = () => competitionModal(orgId, null);
        root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => competitionModal(orgId, rows.find(x => x.id === b.dataset.edit)));
        root.querySelectorAll('[data-trans]').forEach(b => transitionModal(rows.find(x => x.id === b.dataset.trans)));
    }

    function competitionModal(orgId, current) {
        const p = current || {};
        window.SYKA_MODAL.open({
            title: current ? 'Edit kompetisi' : 'Buat kompetisi',
            wide: true,
            html: `<form id="ocf" class="form-card"><div class="form-grid-2"><label>Judul *<input id="title" required value="${esc(p.title||'')}"></label><label>Slug *<input id="slug" required value="${esc(p.slug||'')}"></label></div><label>Deskripsi singkat<textarea id="short">${esc(p.short_description||'')}</textarea></label><label>Deskripsi lengkap<textarea id="desc">${esc(p.description||'')}</textarea></label><div class="form-grid-2"><label>Kategori<input id="cat" value="${esc(p.category||'Kompetisi')}"></label><label>Visibility<select id="vis"><option>PUBLIC</option><option>UNLISTED</option><option>PRIVATE</option></select></label></div><div class="form-grid-2"><label>Pendaftaran mulai<input id="rs" type="datetime-local"></label><label>Pendaftaran selesai<input id="re" type="datetime-local"></label></div><div class="form-grid-2"><label>Competition mulai<input id="s" type="datetime-local"></label><label>Competition selesai<input id="e" type="datetime-local"></label></div><label>Pengumuman<input id="a" type="datetime-local"></label><label>Poster URL<input id="poster" placeholder="https://..." value="${esc(p.poster_url||'')}"></label><label>Juknis URL<input id="juknis" value="${esc(p.juknis_url||'')}"></label><div class="form-actions"><button class="btn btn-ghost" type="button" data-close>Batal</button><button class="btn btn-primary">Simpan DRAFT</button></div><div id="fb"></div></form>`,
            onOpen: body => {
                const f = body.querySelector('#ocf');
                body.querySelector('#vis').value = p.visibility || 'PUBLIC';
                const set = (id, v) => {
                    if (v) body.querySelector(id).value = new Date(v).toISOString().slice(0, 16);
                };
                set('#rs', p.registration_starts_at);
                set('#re', p.registration_ends_at);
                set('#s', p.starts_at);
                set('#e', p.ends_at);
                set('#a', p.announcement_at);
                f.onsubmit = async e => {
                    e.preventDefault();
                    const d = x => x ? new Date(x).toISOString() : null;
                    try {
                        const payload = {
                            organizer_id: orgId,
                            title: f.querySelector('#title').value.trim(),
                            slug: f.querySelector('#slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''),
                            short_description: f.querySelector('#short').value.trim(),
                            description: f.querySelector('#desc').value.trim(),
                            category: f.querySelector('#cat').value.trim() || 'Kompetisi',
                            visibility: f.querySelector('#vis').value,
                            registration_starts_at: d(f.querySelector('#rs').value),
                            registration_ends_at: d(f.querySelector('#re').value),
                            starts_at: d(f.querySelector('#s').value),
                            ends_at: d(f.querySelector('#e').value),
                            announcement_at: d(f.querySelector('#a').value),
                            poster_url: f.querySelector('#poster').value.trim() || null,
                            juknis_url: f.querySelector('#juknis').value.trim() || null
                        };
                        await svc().saveCompetition(payload, current?.id || null);
                        window.SYKA_MODAL.close();
                        window.SYKA_TOAST.show('Kompetisi tersimpan sebagai DRAFT.', 'success');
                        window.SYKA_ROUTER.refresh();
                    } catch (err) {
                        f.querySelector('#fb').innerHTML = `<div class="inline-error">${esc(err.message)}</div>`;
                    }
                };
            }
        });
    }

    function transitionModal(c) {
        const next = ['PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LIVE', 'SUBMISSION_CLOSED', 'GRADING', 'RESULT_PUBLISHED', 'ARCHIVED', 'SUSPENDED', 'CANCELLED'];
        window.SYKA_MODAL.open({
            title: 'Competition state machine',
            html: `<form id="tm" class="form-card"><p>Current: <b>${esc(c.status)}</b></p><label>Target<select id="to">${next.map(x=>`<option>${x}</option>`).join('')}</select></label><label>Reason<textarea id="reason"></textarea></label><button class="btn btn-primary">Apply transition</button><div id="fb"></div></form>`,
            onOpen: body => body.querySelector('#tm').onsubmit = async e => {
                e.preventDefault();
                try {
                    await svc().transitionCompetition(c.id, body.querySelector('#to').value, body.querySelector('#reason').value);
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('State competition diperbarui.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (err) {
                    body.querySelector('#fb').innerHTML = `<div class="inline-error">${esc(err.message)}</div>`;
                }
            }
        });
    }
    async function participants(root, orgId) {
        const comps = (await svc().listCompetitionsAdmin({
            limit: 200
        })).filter(x => x.organizer_id === orgId);
        let rows = [];
        for (const c of comps.slice(0, 20)) {
            const rs = await svc().listRegistrations({
                competitionId: c.id
            });
            rows.push(...rs);
        }
        root.innerHTML = `<div class="control-local-head"><div><h2>Peserta</h2><span>Approval, reject, twibbon evidence.</span></div><select class="compact-select" id="p-filter"><option value="">Semua status</option><option>PENDING</option><option>APPROVED</option><option>ACTIVE</option><option>REJECTED</option></select></div><div class="admin-table" id="participants">${rows.map(r=>`<div class="admin-row" data-status="${r.status}"><div><strong>${esc(r.profiles?.full_name||r.user_id)}</strong><small>${esc(r.competitions?.title||'')} · @${esc(r.profiles?.username||'—')} · ${esc(r.profiles?.grade||'—')} · ${esc(r.profiles?.institution||'—')}</small><div class="chip-row"><span class="chip">${esc(r.status)}</span>${r.twibbon_asset_url?'<span class="chip">Twibbon ada</span>':''}</div></div><div class="row-actions">${r.status==='PENDING'?`<button class="btn btn-primary btn-sm" data-review="${r.id}" data-decision="APPROVED">Approve</button><button class="btn btn-danger btn-sm" data-review="${r.id}" data-decision="REJECTED">Reject</button>`:''}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada peserta',text:'Registrasi peserta akan muncul di sini.'})}</div>`;
        document.getElementById('p-filter').onchange = e => document.querySelectorAll('#participants .admin-row').forEach(r => r.style.display = !e.target.value || r.dataset.status === e.target.value ? 'flex' : 'none');
        root.querySelectorAll('[data-review]').forEach(b => b.onclick = () => reviewModal(b.dataset.review, b.dataset.decision));
    }

    function reviewModal(id, decision) {
        window.SYKA_MODAL.open({
            title: decision === 'APPROVED' ? 'Approve peserta' : 'Reject peserta',
            html: `<form id="rf" class="form-card"><label>Reason / catatan<textarea id="reason"></textarea></label><button class="btn ${decision==='APPROVED'?'btn-primary':'btn-danger'}">${decision==='APPROVED'?'Approve':'Reject'}</button><div id="fb"></div></form>`,
            onOpen: body => body.querySelector('#rf').onsubmit = async e => {
                e.preventDefault();
                try {
                    await svc().reviewRegistration(id, decision, body.querySelector('#reason').value);
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('Registration diperbarui.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (err) {
                    body.querySelector('#fb').innerHTML = `<div class="inline-error">${esc(err.message)}</div>`;
                }
            }
        });
    }
    async function questions(root, orgId) {
        const [banks, qs] = await Promise.all([svc().listQuestionBanks({
            organizerId: orgId
        }), svc().listQuestions({})]);
        const mine = qs.filter(q => banks.some(b => b.id === q.question_bank_id) || q.status);
        root.innerHTML = `<div class="control-local-head"><div><h2>Question Builder</h2><span>Bank soal, tipe soal, answer key, scoring.</span></div><div class="row-actions"><button class="btn btn-ghost btn-sm" id="qb">+ Bank</button><button class="btn btn-primary btn-sm" id="qq">+ Soal</button></div></div><div class="control-grid-2"><section><h3>Bank Soal</h3><div class="admin-table">${banks.map(b=>`<div class="admin-row"><div><strong>${esc(b.name)}</strong><small>${esc(b.status)} · ${esc(b.description||'')}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada bank',text:'Buat bank soal.'})}</div></section><section><h3>Questions</h3><div class="admin-table">${mine.map(q=>`<div class="admin-row"><div><strong>${esc(q.prompt)}</strong><small>${esc(q.type)} · ${q.points} poin · ${esc(q.status)}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada soal',text:'Buat soal pertama.'})}</div></section></div>`;
        root.querySelector('#qb').onclick = () => bankModal(orgId);
        root.querySelector('#qq').onclick = () => questionModal();
    }

    function bankModal(orgId) {
        window.SYKA_MODAL.open({
            title: 'Question Bank',
            html: `<form id="bf" class="form-card"><label>Nama *<input id="name" required></label><label>Deskripsi<textarea id="desc"></textarea></label><button class="btn btn-primary">Simpan</button><div id="fb"></div></form>`,
            onOpen: body => body.querySelector('#bf').onsubmit = async e => {
                e.preventDefault();
                try {
                    const a = window.SYKA_STATE.getState().auth;
                    await svc().saveQuestionBank({
                        organizer_id: orgId,
                        owner_user_id: a.user.id,
                        name: body.querySelector('#name').value.trim(),
                        description: body.querySelector('#desc').value.trim(),
                        status: 'DRAFT'
                    });
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('Bank soal dibuat.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (err) {
                    body.querySelector('#fb').innerHTML = `<div class="inline-error">${esc(err.message)}</div>`;
                }
            }
        });
    }

    function questionModal() {
        window.SYKA_MODAL.open({
            title: 'Question Builder',
            wide: true,
            html: `<form id="qf" class="form-card"><label>Pertanyaan *<textarea id="prompt" required></textarea></label><div class="form-grid-2"><label>Type<select id="type"><option value="multiple_choice">Multiple Choice</option><option value="checkbox">Checkbox</option><option value="essay">Essay</option><option value="file">File</option></select></label><label>Points<input id="points" type="number" value="1" step="0.5"></label></div><label>Question Bank ID<input id="bank"></label><label>Competition ID<input id="comp"></label><button class="btn btn-primary">Simpan</button><div id="fb"></div></form>`,
            onOpen: body => body.querySelector('#qf').onsubmit = async e => {
                e.preventDefault();
                try {
                    await svc().saveQuestion({
                        prompt: body.querySelector('#prompt').value.trim(),
                        type: body.querySelector('#type').value,
                        points: Number(body.querySelector('#points').value || 1),
                        required: true,
                        question_bank_id: body.querySelector('#bank').value.trim() || null,
                        competition_id: body.querySelector('#comp').value.trim() || null,
                        status: 'DRAFT',
                        config: {}
                    });
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('Soal dibuat.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (err) {
                    body.querySelector('#fb').innerHTML = `<div class="inline-error">${esc(err.message)}</div>`;
                }
            }
        });
    }
    async function grading(root, orgId) {
        const comps = (await svc().listCompetitionsAdmin({
            limit: 200
        })).filter(x => x.organizer_id === orgId);
        let rows = [];
        for (const c of comps) rows.push(...await svc().listAttempts({
            competitionId: c.id
        }));
        root.innerHTML = `<div class="control-local-head"><div><h2>Grading</h2><span>Auto/manual grading dan finalize score.</span></div><select id="gstatus" class="compact-select"><option value="">Semua status</option><option>SUBMITTED</option><option>GRADING</option><option>FINALIZED</option></select></div><div class="admin-table" id="grading-list">${rows.map(a=>`<div class="admin-row" data-status="${a.status}"><div><strong>${esc(a.profiles?.full_name||a.participant_id)}</strong><small>${esc(a.competitions?.title||'')} · ${esc(a.status)} · Score ${a.score}</small></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-grade="${a.id}">Grade</button>${a.status!=='FINALIZED'?`<button class="btn btn-primary btn-sm" data-final="${a.id}">Finalize</button>`:''}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada attempt',text:'Attempt akan muncul saat peserta submit.'})}</div>`;
        document.getElementById('gstatus').onchange = e => document.querySelectorAll('#grading-list .admin-row').forEach(r => r.style.display = !e.target.value || r.dataset.status === e.target.value ? 'flex' : 'none');
        root.querySelectorAll('[data-grade]').forEach(b => b.onclick = () => gradeModal(b.dataset.grade));
        root.querySelectorAll('[data-final]').forEach(b => b.onclick = () => finalizeModal(b.dataset.final));
    }
    async function gradeModal(attemptId) {
        try {
            const items = await svc().listGradingItems(attemptId);
            window.SYKA_MODAL.open({
                title: 'Grade attempt',
                wide: true,
                html: `<form id="grf" class="form-card">${items.map((i,n)=>`<div class="grade-row"><strong>Item ${n+1}</strong><div class="form-grid-2"><label>Score<input type="number" step="0.01" data-score="${i.id}" value="${i.score}"></label><label>Feedback<input data-feedback="${i.id}" value="${esc(i.feedback||'')}"></label></div></div>`).join('')||'<p class="muted">Belum ada manual grading item.</p>'}<button class="btn btn-primary">Simpan grading</button><div id="fb"></div></form>`,
                onOpen: body => {
                    body.querySelector('#grf').onsubmit = async e => {
                        e.preventDefault();
                        try {
                            for (const i of items) {
                                await svc().saveGrade({
                                    attempt_id: attemptId,
                                    question_id: i.question_id,
                                    grader_id: window.SYKA_STATE.getState().auth.user.id,
                                    score: Number(body.querySelector(`[data-score="${i.id}"]`).value || 0),
                                    feedback: body.querySelector(`[data-feedback="${i.id}"]`).value || null
                                }, i.id);
                            }
                            window.SYKA_MODAL.close();
                            window.SYKA_TOAST.show('Grading tersimpan.', 'success');
                        } catch (err) {
                            body.querySelector('#fb').innerHTML = `<div class="inline-error">${esc(err.message)}</div>`;
                        }
                    };
                }
            });
        } catch (e) {
            window.SYKA_TOAST.show(e.message, 'error');
        }
    }

    function finalizeModal(id) {
        window.SYKA_MODAL.open({
            title: 'Finalize result',
            html: `<form id="ff" class="form-card"><label>Score final<input id="score" type="number" step="0.01" required></label><button class="btn btn-primary">Finalize</button><div id="fb"></div></form>`,
            onOpen: body => body.querySelector('#ff').onsubmit = async e => {
                e.preventDefault();
                try {
                    await svc().finalizeAttempt(id, body.querySelector('#score').value);
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('Result final.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (err) {
                    body.querySelector('#fb').innerHTML = `<div class="inline-error">${esc(err.message)}</div>`;
                }
            }
        });
    }
    async function results(root, orgId) {
        const comps = (await svc().listCompetitionsAdmin({
            limit: 200
        })).filter(x => x.organizer_id === orgId);
        let rows = [];
        for (const c of comps) rows.push(...await svc().listAttempts({
            competitionId: c.id,
            status: 'FINALIZED'
        }));
        root.innerHTML = `<div class="control-local-head"><div><h2>Results</h2><span>Preview hasil dan publish result dilakukan via competition state.</span></div></div><div class="admin-table">${rows.map(a=>`<div class="admin-row"><div><strong>${esc(a.profiles?.full_name||a.participant_id)}</strong><small>${esc(a.competitions?.title||'')} · Score ${a.score} · finalized ${fmt(a.finalized_at)}</small></div><span class="chip">FINALIZED</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada hasil finalized',text:'Finalisasi attempt dari Grading.'})}</div>`;
    }
    async function awards(root, orgId) {
        const comps = (await svc().listCompetitionsAdmin({
            limit: 200
        })).filter(x => x.organizer_id === orgId);
        let rows = [];
        for (const c of comps) rows.push(...await svc().listAwards({
            competitionId: c.id
        }));
        root.innerHTML = `<div class="control-local-head"><div><h2>Awards</h2><span>Achievement dan emblem peserta.</span></div></div><div class="admin-table">${rows.map(a=>`<div class="admin-row"><div><strong>${esc(a.profiles?.full_name||a.user_id)}</strong><small>${esc(a.competitions?.title||'')} · ${esc(a.rank_code||'PARTICIPANT')} · ${esc(a.title)}</small></div><span class="chip">${a.points} pts</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada award',text:'Award event akan muncul setelah result publish.'})}</div>`;
    }
    async function certificates(root, orgId) {
        const comps = (await svc().listCompetitionsAdmin({
            limit: 200
        })).filter(x => x.organizer_id === orgId);
        let rows = [];
        for (const c of comps) rows.push(...await svc().listCertificates({
            competitionId: c.id
        }));
        root.innerHTML = `<div class="control-local-head"><div><h2>Certificates</h2><span>DRAFT → GENERATED → REVIEW → APPROVED → PUBLISHED → REVOKED</span></div></div><div class="admin-table">${rows.map(x=>`<div class="admin-row"><div><strong>${esc(x.profiles?.full_name||x.user_id)}</strong><small>${esc(x.competitions?.title||'')} · rev ${x.current_revision}</small></div><div class="row-actions">${['GENERATED','REVIEW','APPROVED','PUBLISHED','REVOKED'].map(s=>`<button class="btn btn-ghost btn-sm" data-cert="${x.id}" data-status="${s}">${s}</button>`).join('')}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada certificate',text:'Certificate dibuat setelah award/result.'})}</div>`;
        root.querySelectorAll('[data-cert]').forEach(b => b.onclick = async () => {
            try {
                await svc().updateCertificate(b.dataset.cert, b.dataset.status);
                window.SYKA_TOAST.show('Certificate diperbarui.', 'success');
                window.SYKA_ROUTER.refresh();
            } catch (e) {
                window.SYKA_TOAST.show(e.message, 'error');
            }
        });
    }
    async function twibbon(root, orgId) {
        const rows = await svc().listTwibbonTemplates({
            organizerId: orgId
        });
        root.innerHTML = `<div class="control-local-head"><div><h2>Twibbon</h2><span>Template dan review asset peserta.</span></div><button class="btn btn-primary" id="new-tw">+ Template</button></div><div class="admin-table">${rows.map(t=>`<div class="admin-row"><div><strong>${esc(t.name)}</strong><small>${esc(t.competition_id||'Global')} · ${t.is_required?'Wajib':'Opsional'}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada template',text:'Tambah template untuk competition.'})}</div>`;
        root.querySelector('#new-tw').onclick = () => twModal(orgId);
    }

    function twModal(orgId) {
        window.SYKA_MODAL.open({
            title: 'Twibbon template',
            html: `<form id="twf" class="form-card"><label>Nama *<input id="name" required></label><label>Competition ID<input id="cid"></label><label>Image URL<input id="url"></label><label>Public ID<input id="pid"></label><label class="checkline"><input id="req" type="checkbox"> Required</label><button class="btn btn-primary">Simpan</button></form>`,
            onOpen: body => body.querySelector('#twf').onsubmit = async e => {
                e.preventDefault();
                try {
                    await svc().saveTwibbonTemplate({
                        organizer_id: orgId,
                        competition_id: body.querySelector('#cid').value.trim() || null,
                        name: body.querySelector('#name').value.trim(),
                        image_url: body.querySelector('#url').value.trim() || null,
                        public_id: body.querySelector('#pid').value.trim() || null,
                        is_required: body.querySelector('#req').checked
                    });
                    window.SYKA_MODAL.close();
                    window.SYKA_TOAST.show('Template tersimpan.', 'success');
                    window.SYKA_ROUTER.refresh();
                } catch (err) {
                    window.SYKA_TOAST.show(err.message, 'error');
                }
            }
        });
    }
    async function notifications(root) {
        const rows = await window.SYKA_NOTIFICATION_SERVICE.list?.() || [];
        root.innerHTML = `<div class="control-local-head"><div><h2>Notifikasi</h2><span>Domain events akan muncul setelah backend event handlers aktif.</span></div></div>${rows.length?`<div class="admin-table">${rows.map(n=>`<div class="admin-row"><div><strong>${esc(n.title)}</strong><small>${esc(n.body||'')} · ${fmt(n.created_at)}</small></div></div>`).join('')}</div>`:window.SYKA_EMPTY.render({title:'Belum ada event',text:'Notification record disimpan di database, bukan hanya toast.'})}`;
    }
    async function plan(root, orgId) {
        const plans = await svc().listPlans();
        const ents = await svc().listEntitlements();
        const mine = plans.filter(p => p.organizer_id === orgId && p.is_active)[0];
        root.innerHTML = `<div class="control-grid-2"><section class="syka-card admin-section"><span class="eyebrow">CURRENT PLAN</span><h2>${esc(mine?.plan_code||'FREE')}</h2><p>${mine?`Aktif sejak ${fmt(mine.starts_at)}${mine.ends_at?` sampai ${fmt(mine.ends_at)}`:''}`:'Belum ada organizer plan aktif. Fallback: FREE.'}</p></section><section class="syka-card admin-section"><span class="eyebrow">ENTITLEMENT</span><div class="admin-table">${ents.filter(e=>e.plan_code===(mine?.plan_code||'FREE')).map(e=>`<div class="admin-row"><div><strong>${esc(e.capability)}</strong><small>Limit: ${e.limit_value??'—'}</small></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada entitlement',text:'Admin dapat mengatur capability pada panel Plans.'})}</div></section></div>`;
    }
    window.SYKA_PAGE_ORGANIZER = {
        render
    };
})();
