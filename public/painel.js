const $ = (id) => document.getElementById(id);
const fmt = (v) => v.toFixed(2).replace('.', ',');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const api = async (url, body) => {
  const res = await fetch(url, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (res.status === 401) location.href = '/entrar';
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro');
  return data;
};

let me;
let plans = [];
let pollTimer;

async function load() {
  [me, { plans }] = await Promise.all([api('/api/eu'), api('/api/planos')]);
  $('user-name').textContent = me.name;
  $('admin-link').classList.toggle('hidden', !me.isAdmin);

  // Assinatura
  $('plan-name').textContent = me.plan ? `${me.plan.name}` : 'Nenhum';
  $('sub-status').innerHTML = me.active
    ? (me.status === 'canceled' ? '<span class="status wait">Cancelada</span>' : '<span class="status ok">Ativa</span>')
    : '<span class="status off">Inativa</span>';
  $('paid-until').textContent = me.paidUntil ? new Date(me.paidUntil).toLocaleDateString('pt-BR') : '—';
  const limit = me.plan?.monthlyReplies || 0;
  $('usage').textContent = limit ? `${me.usage} / ${limit.toLocaleString('pt-BR')}` : '—';
  $('usage-bar').style.width = limit ? `${Math.min(100, (me.usage / limit) * 100)}%` : '0';

  $('plan-buttons').innerHTML = plans.map((p) => {
    const current = me.plan?.id === p.id && me.active;
    const url = me.checkout[p.id];
    return `<a class="btn ${p.recommended ? '' : 'outline'}" ${url ? `href="${esc(url)}" target="_blank"` : 'href="#" onclick="alert(\'Link de pagamento ainda não configurado\');return false"'}>
      ${current ? '✓ ' : ''}${p.name} — R$ ${fmt(p.price)}/mês${p.recommended ? ' ⭐' : ''}</a>`;
  }).join('');

  if (!me.active) {
    $('alert').innerHTML = me.paidUntil
      ? '<div class="alert bad">Sua assinatura venceu e a IA parou de responder. Renove abaixo para voltar a funcionar.</div>'
      : '<div class="alert warn">Escolha um plano abaixo para ativar sua IA no WhatsApp. Use o mesmo e-mail da sua conta no pagamento.</div>';
  } else if (me.status === 'canceled') {
    $('alert').innerHTML = `<div class="alert warn">Assinatura cancelada. A IA funciona até ${new Date(me.paidUntil).toLocaleDateString('pt-BR')}.</div>`;
  } else if (limit && me.usage >= limit) {
    $('alert').innerHTML = '<div class="alert warn">Você usou todas as respostas do mês. Troque para um plano maior para continuar.</div>';
  } else {
    $('alert').innerHTML = '';
  }

  // Configurações
  const s = me.settings;
  for (const k of ['business_name', 'tone', 'about', 'catalog', 'hours_start', 'hours_end', 'off_hours_message', 'owner_phone']) $(k).value = s[k] || '';
  $('hours_days').value = s.hours_days;
  if (!$('hours_days').value) $('hours_days').value = '1,2,3,4,5,6';
  $('bot_enabled').checked = !!s.bot_enabled;
  $('hours_enabled').checked = !!s.hours_enabled;

  const features = me.planFeatures || {};
  document.querySelectorAll('[data-feature]').forEach((el) => {
    const allowed = !!features[el.dataset.feature];
    el.classList.toggle('locked', !allowed);
    el.querySelectorAll('input,textarea,select').forEach((i) => (i.disabled = !allowed));
    el.querySelectorAll('.locked-tag').forEach((t) => t.classList.toggle('hidden', allowed));
  });

  renderWhatsapp(me.whatsapp);
  if (features.history) loadHistory();

  // Veio do site escolhendo um plano: abre o pagamento
  const wanted = new URLSearchParams(location.search).get('assinar');
  if (wanted && me.checkout[wanted] && !me.active) {
    history.replaceState(null, '', '/painel');
    location.href = me.checkout[wanted];
  }
}

function renderWhatsapp(st) {
  const labels = {
    connected: ['Conectado', 'ok'], qr: ['Aguardando leitura do QR Code', 'wait'], pairing: ['Aguardando o código', 'wait'], connecting: ['Conectando...', 'wait'],
    stopped: ['Pausado', 'off'], closed: ['Reconectando...', 'wait'], disconnected: ['Desconectado', 'off'],
  };
  const [label, cls] = labels[st.state] || ['—', 'off'];
  $('wa-status').textContent = label;
  $('wa-status').className = `status ${cls}`;
  $('wa-number').textContent = st.number ? `(+${st.number})` : '';
  $('qr-box').classList.toggle('hidden', st.state !== 'qr' || !st.qr);
  if (st.qr) $('qr').src = st.qr;
  const code = st.pairingCode && st.pairingCode !== 'gerando' ? st.pairingCode : null;
  $('code-box').classList.toggle('hidden', st.state !== 'pairing');
  $('pair-code').textContent = code ? `${code.slice(0, 4)}-${code.slice(4)}` : 'Gerando...';
  $('wa-options').classList.toggle('hidden', ['connected', 'connecting', 'pairing'].includes(st.state));
  $('wa-connect').classList.toggle('hidden', st.state === 'qr');
  $('wa-connect').disabled = !me.active;
  $('wa-code').disabled = !me.active;
  $('wa-disconnect').classList.toggle('hidden', !['connected', 'stopped'].includes(st.state));

  clearTimeout(pollTimer);
  if (['qr', 'connecting', 'closed', 'pairing'].includes(st.state)) {
    pollTimer = setTimeout(async () => renderWhatsapp(await api('/api/whatsapp/status')), 3000);
  }
}

async function loadHistory() {
  $('history-card').classList.remove('hidden');
  const chats = await api('/api/conversas');
  $('history').innerHTML = chats.length ? chats.map((c) => `
    <details class="chat">
      <summary>${esc(c.contact.split('@')[0])} <span class="hint">(${c.total} mensagens)</span></summary>
      ${c.messages.map((m) => `<div class="msg ${m.role}">${esc(m.content)}</div>`).join('')}
    </details>`).join('') : '<p class="hint">Nenhuma conversa ainda.</p>';
}

$('wa-connect').onclick = async () => {
  $('wa-connect').disabled = true;
  try {
    renderWhatsapp(await api('/api/whatsapp/conectar', {}));
  } catch (e) {
    alert(e.message);
    $('wa-connect').disabled = false;
  }
};

$('wa-code').onclick = async () => {
  const phone = $('wa-phone').value.replace(/\D/g, '');
  if (phone.length < 12) return alert('Digite o número com DDI 55 + DDD, ex.: 5511999999999');
  $('wa-code').disabled = true;
  try {
    renderWhatsapp(await api('/api/whatsapp/conectar', { phone }));
  } catch (e) {
    alert(e.message);
  }
  $('wa-code').disabled = false;
};

$('wa-disconnect').onclick = async () => {
  if (!confirm('Desconectar o WhatsApp? A IA para de responder.')) return;
  await api('/api/whatsapp/desconectar', {});
  renderWhatsapp(await api('/api/whatsapp/status'));
};

$('config').onsubmit = async (e) => {
  e.preventDefault();
  const body = {
    bot_enabled: $('bot_enabled').checked,
    hours_enabled: $('hours_enabled').checked,
    hours_days: $('hours_days').value,
  };
  for (const k of ['business_name', 'tone', 'about', 'catalog', 'hours_start', 'hours_end', 'off_hours_message', 'owner_phone']) body[k] = $(k).value;
  try {
    await api('/api/config', body);
    $('config-msg').style.color = 'var(--green-dark)';
    $('config-msg').textContent = 'Salvo! ✓';
  } catch (err) {
    $('config-msg').style.color = '';
    $('config-msg').textContent = err.message;
  }
};

// ---------- Achadinhos automáticos ----------
let dealsConfig;

function setGroupOptions(groups, selected) {
  const opts = groups.map((g) => `<option value="${esc(g.jid)}">${esc(g.name)}${g.size ? ` (${g.size})` : ''}</option>`);
  if (selected?.jid && !groups.some((g) => g.jid === selected.jid)) {
    opts.unshift(`<option value="${esc(selected.jid)}">${esc(selected.name || selected.jid)}</option>`);
  }
  $('d_group').innerHTML = '<option value="">— escolha o grupo —</option>' + opts.join('');
  $('d_group').value = selected?.jid || '';
}

async function loadDeals() {
  const data = await api('/api/achadinhos');
  dealsConfig = data.config;
  const c = data.config;
  $('d_enabled').checked = !!c.enabled;
  $('d_interval').value = c.interval_min;
  $('d_interval').min = data.minInterval;
  $('d_start').value = c.hours_start;
  $('d_end').value = c.hours_end;
  $('d_repeat').checked = !!c.repeat_queue;
  if (c.group_jid) setGroupOptions([], { jid: c.group_jid, name: c.group_name });

  const pending = data.deals.filter((d) => d.status === 'pending').length;
  $('d_next').textContent = `(${pending} na fila${c.last_sent_at ? ` · último envio ${new Date(c.last_sent_at).toLocaleString('pt-BR')}` : ''})`;
  const labels = { pending: ['Na fila', 'wait'], sent: ['Enviado', 'ok'], error: ['Erro', 'off'] };
  $('deals-list').innerHTML = data.deals.length ? data.deals.map((d) => {
    const [label, cls] = labels[d.status] || ['—', 'off'];
    return `<div class="deal" data-id="${d.id}">
      <div class="deal-head"><b>${esc(d.title)}${d.price ? ` — ${esc(d.price)}` : ''}</b>
        <span class="status ${cls}">${label}${d.sent_count ? ` · ${d.sent_count}x` : ''}</span></div>
      <div class="link">${esc(d.link)}</div>
      ${d.error ? `<div class="error" style="min-height:0">${esc(d.error)}</div>` : ''}
      <textarea class="hidden" maxlength="4000"></textarea>
      <div class="actions">
        <button class="btn small outline" data-act="preview">Ver texto</button>
        <button class="btn small outline hidden" data-act="regen">Gerar outro texto</button>
        <button class="btn small outline hidden" data-act="save">Salvar texto</button>
        <button class="btn small" data-act="send">Enviar agora</button>
        <button class="btn small ghost" data-act="remove">Remover</button>
      </div>
    </div>`;
  }).join('') : '<p class="hint">Nenhum produto ainda. Adicione o primeiro acima 👆</p>';
}

$('d_load_groups').onclick = async () => {
  $('d_load_groups').disabled = true;
  try {
    const groups = await api('/api/achadinhos/grupos');
    setGroupOptions(groups, dealsConfig?.group_jid ? { jid: dealsConfig.group_jid, name: dealsConfig.group_name } : null);
    if (!groups.length) alert('Esse número não está em nenhum grupo.');
  } catch (e) {
    alert(e.message);
  }
  $('d_load_groups').disabled = false;
};

$('deals-config').onsubmit = async (e) => {
  e.preventDefault();
  const sel = $('d_group').selectedOptions[0];
  try {
    if ($('d_enabled').checked && !$('d_group').value) throw new Error('Escolha o grupo');
    await api('/api/achadinhos/config', {
      enabled: $('d_enabled').checked,
      group_jid: $('d_group').value,
      group_name: sel && sel.value ? sel.textContent.replace(/ \(\d+\)$/, '') : '',
      interval_min: $('d_interval').value,
      hours_start: $('d_start').value,
      hours_end: $('d_end').value,
      repeat_queue: $('d_repeat').checked,
    });
    $('d_config_msg').style.color = 'var(--green-dark)';
    $('d_config_msg').textContent = 'Salvo! ✓';
    loadDeals();
  } catch (err) {
    $('d_config_msg').style.color = '';
    $('d_config_msg').textContent = err.message;
  }
};

$('deals-add').onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api('/api/achadinhos/adicionar', {
      link: $('d_link').value, title: $('d_title').value, price: $('d_price').value,
      notes: $('d_notes').value, image_url: $('d_image').value,
    });
    for (const k of ['d_link', 'd_title', 'd_price', 'd_notes', 'd_image']) $(k).value = '';
    $('d_add_msg').textContent = '';
    loadDeals();
  } catch (err) {
    $('d_add_msg').textContent = err.message;
  }
};

$('deals-list').onclick = async (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const box = btn.closest('.deal');
  const id = Number(box.dataset.id);
  const text = box.querySelector('textarea');
  const show = (message) => {
    text.value = message;
    text.classList.remove('hidden');
    box.querySelectorAll('[data-act="regen"],[data-act="save"]').forEach((b) => b.classList.remove('hidden'));
  };
  btn.disabled = true;
  try {
    if (btn.dataset.act === 'preview' || btn.dataset.act === 'regen') {
      btn.textContent = 'A IA está escrevendo...';
      show((await api('/api/achadinhos/previa', { id, novo: btn.dataset.act === 'regen' })).message);
    } else if (btn.dataset.act === 'save') {
      await api('/api/achadinhos/texto', { id, message: text.value });
      btn.textContent = 'Salvo ✓';
      return;
    } else if (btn.dataset.act === 'send') {
      if (!confirm('Enviar este achadinho no grupo agora?')) return;
      if (!text.classList.contains('hidden')) await api('/api/achadinhos/texto', { id, message: text.value });
      btn.textContent = 'Enviando...';
      await api('/api/achadinhos/enviar', { id });
      await loadDeals();
    } else if (btn.dataset.act === 'remove') {
      if (!confirm('Remover este produto da fila?')) return;
      await api('/api/achadinhos/remover', { id });
      await loadDeals();
    }
  } catch (err) {
    alert(err.message);
    loadDeals();
  } finally {
    btn.disabled = false;
    if (btn.dataset.act === 'preview') btn.textContent = 'Ver texto';
    if (btn.dataset.act === 'regen') btn.textContent = 'Gerar outro texto';
  }
};

loadDeals();

$('logout').onclick = async () => {
  await api('/api/sair', {});
  location.href = '/';
};

load();
