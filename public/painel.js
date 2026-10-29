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
    connected: ['Conectado', 'ok'], qr: ['Aguardando leitura do QR Code', 'wait'], connecting: ['Conectando...', 'wait'],
    stopped: ['Pausado', 'off'], closed: ['Reconectando...', 'wait'], disconnected: ['Desconectado', 'off'],
  };
  const [label, cls] = labels[st.state] || ['—', 'off'];
  $('wa-status').textContent = label;
  $('wa-status').className = `status ${cls}`;
  $('wa-number').textContent = st.number ? `(+${st.number})` : '';
  $('qr-box').classList.toggle('hidden', st.state !== 'qr' || !st.qr);
  if (st.qr) $('qr').src = st.qr;
  $('wa-connect').classList.toggle('hidden', ['connected', 'qr', 'connecting'].includes(st.state));
  $('wa-connect').disabled = !me.active;
  $('wa-disconnect').classList.toggle('hidden', !['connected', 'stopped'].includes(st.state));

  clearTimeout(pollTimer);
  if (['qr', 'connecting', 'closed'].includes(st.state)) {
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

$('logout').onclick = async () => {
  await api('/api/sair', {});
  location.href = '/';
};

load();
