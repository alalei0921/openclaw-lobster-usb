function pad2(n){return String(n).padStart(2,'0')}
function makeOrderId(){
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  const rand = Math.random().toString(16).slice(2,6).toUpperCase();
  return `OCU-${stamp}-${rand}`;
}

function escapeLine(s){
  return String(s ?? '').replace(/\s+/g,' ').trim();
}

function getFormData(form){
  const fd = new FormData(form);
  return {
    phone: escapeLine(fd.get('phone')),
    name: escapeLine(fd.get('name')),
    address: String(fd.get('address') ?? '').trim(),
    os: escapeLine(fd.get('os')),
    note: escapeLine(fd.get('note')),
    agree: fd.get('agree') === 'on'
  };
}

function buildSummary(orderId, data){
  const lines = [
    `订单号：${orderId}`,
    `产品：OpenClaw 龙虾 U 盘（${data.os} 版）`,
    `定金：¥20（不退不换）`,
    `交付：收到定金起 10 个工作日内发货`,
    '',
    `收件人：${data.name}`,
    `手机号：${data.phone}`,
    `地址：${data.address}`,
  ];
  if (data.note) lines.push(`备注：${data.note}`);
  lines.push('', '支付提醒：请扫码支付定金，并在备注填写订单号。');
  return lines.join('\n');
}

(function init(){
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const form = document.getElementById('orderForm');
  const result = document.getElementById('result');
  const resultText = document.getElementById('resultText');
  const copyBtn = document.getElementById('copyBtn');
  const mailtoBtn = document.getElementById('mailtoBtn');
  const clearBtn = document.getElementById('clearBtn');
  const orderIdBadge = document.getElementById('orderIdBadge');

  if (!form) return;

  clearBtn?.addEventListener('click', () => {
    form.reset();
    result.hidden = true;
    resultText.textContent = '';
    orderIdBadge.textContent = '订单号：—';
  });

  copyBtn?.addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(resultText.textContent || '');
      copyBtn.textContent = '已复制';
      setTimeout(()=> copyBtn.textContent = '复制摘要', 1200);
    }catch(e){
      alert('复制失败：你的浏览器可能不允许剪贴板操作。你可以手动复制下方文本。');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = getFormData(form);

    // 简单校验（HTML required 已经做了，这里再兜底）
    if (!data.phone || !data.name || !data.address || !data.os || !data.agree){
      alert('请把必填项都填完整，并勾选同意条款。');
      return;
    }

    const orderId = makeOrderId();
    const summary = buildSummary(orderId, data);

    orderIdBadge.textContent = `订单号：${orderId}`;
    resultText.textContent = summary;
    result.hidden = false;

    // 本地保存（演示用）：方便刷新后不丢
    try{
      localStorage.setItem('oc_lobster_last_order', JSON.stringify({orderId, data, summary, ts: Date.now()}));
    }catch(_){/* ignore */}

    // 生成 mailto（演示用）：把摘要发给自己/卖家
    const subject = encodeURIComponent(`OpenClaw 龙虾 U 盘定金信息｜${orderId}`);
    const body = encodeURIComponent(summary);
    mailtoBtn.href = `mailto:?subject=${subject}&body=${body}`;

    // 滚动到结果
    result.scrollIntoView({behavior:'smooth', block:'start'});
  });

  // 尝试恢复上一次
  try{
    const raw = localStorage.getItem('oc_lobster_last_order');
    if (raw){
      const obj = JSON.parse(raw);
      if (obj?.summary && obj?.orderId){
        orderIdBadge.textContent = `订单号：${obj.orderId}`;
        resultText.textContent = obj.summary;
        result.hidden = false;
        const subject = encodeURIComponent(`OpenClaw 龙虾 U 盘定金信息｜${obj.orderId}`);
        const body = encodeURIComponent(obj.summary);
        mailtoBtn.href = `mailto:?subject=${subject}&body=${body}`;
      }
    }
  }catch(_){/* ignore */}
})();
