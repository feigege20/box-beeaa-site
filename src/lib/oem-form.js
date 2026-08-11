/**
 * OEM 多步骤询盘表单 (B2B Conversion Optimized)
 * 5 步: 选产品 → 选配置 → 输数量 → 联系方式 → 确认提交
 * 客户端纯 JS, 最终生成 mailto 链接 (零后端, 零成本, 零数据合规风险)
 */

const tpl = {
  zh: {
    pageTitle: "OEM/ODM 询盘 - 5 步定制报价 | 客信新材料",
    pageDesc: "5 步提交您的定制需求, 12 小时内获取工厂报价。源头工厂、OEM/ODM 定制、MOQ 50 件起、30 天交付。",
    h1: "OEM/ODM 询盘 - 5 步定制报价",
    h1Sub: "12 小时回复 · 源头工厂 · 30 天交付 · MOQ 50 件起",
    stepN: (n, total) => `第 ${n} / ${total} 步`,
    step1: { title: "选择产品线", desc: "请选择您要定制的产品类别（可多选）" },
    step2: { title: "规格配置", desc: "提供规格细节以便我们精确报价" },
    step3: { title: "数量与交付", desc: "数量越多, 单价越优" },
    step4: { title: "联系方式", desc: "我们将通过邮件/WhatsApp 发送报价单" },
    step5: { title: "确认提交", desc: "检查信息后提交, 我们将在 12 小时内回复" },
    fields: {
      productLine: "产品线",
      size: "尺寸 (长×宽×高 cm)",
      material: "材质",
      ipRating: "防护等级",
      color: "颜色",
      foamInsert: "是否需要内衬泡棉",
      logoPrint: "是否需要 logo 印刷",
      quantity: "数量 (件)",
      targetPrice: "目标单价 (USD, 可选)",
      leadTime: "期望交期",
      certification: "所需认证",
      usage: "主要用途",
      name: "您的姓名",
      company: "公司名称",
      email: "邮箱",
      phone: "电话 / WhatsApp",
      country: "国家 / 地区",
      message: "补充说明 (可选)"
    },
    options: {
      materials: ["PP 聚丙烯", "ABS 工程塑料", "PC 聚碳酸酯", "铝合金", "玻纤复合"],
      ipRatings: ["IP54 防尘防溅", "IP65 防尘防冲水", "IP67 短时浸水 1m", "IP68 持续浸水", "无防水要求"],
      colors: ["黑色 (标准)", "军绿 / 橄榄绿", "橙色 (高可见)", "灰色", "黄色", "蓝色", "定制 (RAL/Pantone)"],
      foamOptions: ["是 - 预切泡棉 (Pick & Pluck)", "是 - 定制 CNC 开模泡棉", "否 - 不需要泡棉"],
      logoOptions: ["是 - 丝印 logo", "是 - 激光雕刻", "否 - 不印 logo"],
      leadTimes: ["15 天 (加急)", "30 天 (标准)", "45 天 (经济)", "60 天 (大货/海运)"],
      certifications: ["CE (欧盟)", "FCC (美国)", "RoHS (环保)", "REACH (化学品)", "UN38.3 (锂电池)", "IP67/IP68 (防水)", "MIL-STD-810 (军规)", "无特殊认证"],
      usageScenarios: ["户外摄影/摄像", "无人机/航拍", "军警/战术", "医疗设备", "仪器仪表", "工具收纳", "工业设备", "其他"]
    },
    btns: {
      next: "下一步 →",
      prev: "← 上一步",
      submit: "📧 提交询盘",
      copy: "复制询盘内容",
      copied: "已复制!",
      sendEmail: "通过邮件发送",
      sendWhatsApp: "通过 WhatsApp 发送"
    },
    summary: "询盘摘要",
    success: {
      title: "询盘已生成!",
      desc: "请通过以下方式发送给我们, 我们将在 12 小时内回复:",
      copyHint: "或复制下方内容, 粘贴到任意沟通渠道"
    },
    progress: "完成度",
    products: {
      "military-tactical-case": "军警战术防护箱",
      "drone-case": "无人机防护箱",
      "instrument-case": "仪器仪表箱",
      "waterproof-case": "防水保护箱",
      "medical-case": "医疗器械箱",
      "engineering-plastic-case": "工程塑料箱",
      "tool-box": "工具收纳箱",
      "camera-stage-case": "摄影器材箱",
      "trolley-case": "拉杆防护箱"
    }
  },
  en: {
    pageTitle: "OEM/ODM Inquiry - 5-Step Custom Quote | KeXinMaterials",
    pageDesc: "Submit your custom requirements in 5 steps, get factory quote within 12 hours. Source factory, OEM/ODM, MOQ 50 pcs, 30-day delivery.",
    h1: "OEM/ODM Inquiry - 5-Step Custom Quote",
    h1Sub: "12-Hour Reply · Source Factory · 30-Day Delivery · MOQ 50 pcs",
    stepN: (n, total) => `Step ${n} of ${total}`,
    step1: { title: "Select Product Line", desc: "Choose the product category you need (multi-select)" },
    step2: { title: "Specifications", desc: "Provide details for accurate quote" },
    step3: { title: "Quantity & Delivery", desc: "More quantity = better unit price" },
    step4: { title: "Contact Info", desc: "We'll send the quote via email / WhatsApp" },
    step5: { title: "Confirm & Submit", desc: "Review and submit, we'll reply within 12 hours" },
    fields: {
      productLine: "Product Line",
      size: "Size (L×W×H cm)",
      material: "Material",
      ipRating: "IP Rating",
      color: "Color",
      foamInsert: "Foam Insert",
      logoPrint: "Logo Printing",
      quantity: "Quantity (pcs)",
      targetPrice: "Target Unit Price (USD, optional)",
      leadTime: "Expected Lead Time",
      certification: "Required Certifications",
      usage: "Main Usage",
      name: "Your Name",
      company: "Company",
      email: "Email",
      phone: "Phone / WhatsApp",
      country: "Country / Region",
      message: "Additional Notes (optional)"
    },
    options: {
      materials: ["PP Polypropylene", "ABS Engineering Plastic", "PC Polycarbonate", "Aluminum Alloy", "Glass Fiber Composite"],
      ipRatings: ["IP54 Dust & Splash", "IP65 Dust & Water Jet", "IP67 Submersion 1m", "IP68 Continuous Submersion", "No waterproof required"],
      colors: ["Black (Standard)", "Military Green / Olive", "Orange (Hi-Vis)", "Gray", "Yellow", "Blue", "Custom (RAL/Pantone)"],
      foamOptions: ["Yes - Pick & Pluck Foam", "Yes - Custom CNC Foam", "No - Without Foam"],
      logoOptions: ["Yes - Silk Screen", "Yes - Laser Engraving", "No - No Logo"],
      leadTimes: ["15 days (Rush)", "30 days (Standard)", "45 days (Economy)", "60 days (Bulk / Sea)"],
      certifications: ["CE (EU)", "FCC (USA)", "RoHS (Environmental)", "REACH (Chemicals)", "UN38.3 (Lithium)", "IP67/IP68 (Waterproof)", "MIL-STD-810 (Military)", "No specific cert"],
      usageScenarios: ["Outdoor Photography / Videography", "Drone / Aerial", "Military / Tactical", "Medical Equipment", "Instruments & Meters", "Tool Storage", "Industrial Equipment", "Other"]
    },
    btns: {
      next: "Next →",
      prev: "← Previous",
      submit: "📧 Submit Inquiry",
      copy: "Copy Inquiry",
      copied: "Copied!",
      sendEmail: "Send via Email",
      sendWhatsApp: "Send via WhatsApp"
    },
    summary: "Inquiry Summary",
    success: {
      title: "Inquiry Generated!",
      desc: "Please send to us via one of the channels below, we'll reply within 12 hours:",
      copyHint: "Or copy the content below and paste to any channel"
    },
    progress: "Progress",
    products: {
      "military-tactical-case": "Military / Tactical Case",
      "drone-case": "Drone Case",
      "instrument-case": "Instrument Case",
      "waterproof-case": "Waterproof Case",
      "medical-case": "Medical Device Case",
      "engineering-plastic-case": "Engineering Plastic Case",
      "tool-box": "Tool Box",
      "camera-stage-case": "Camera / Stage Case",
      "trolley-case": "Trolley Case"
    }
  }
};

function escHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderProductChips(p, lang) {
  const T = tpl[lang];
  return Object.entries(T.products).map(([slug, name]) =>
    `<label class="oem-chip">
      <input type="checkbox" name="productLine" value="${slug}" />
      <span>${escHtml(name)}</span>
    </label>`
  ).join("");
}

function renderOptions(name, options) {
  return options.map((opt, i) => `<option value="${escHtml(opt)}">${escHtml(opt)}</option>`).join("");
}

function renderStep1(p, lang) {
  const T = tpl[lang];
  return `<div class="oem-step active" data-step="1">
    <h2>${T.step1.title}</h2>
    <p class="oem-step-desc">${T.step1.desc}</p>
    <div class="oem-chips" data-field="productLine">
      ${renderProductChips(p, lang)}
    </div>
    <div class="oem-actions">
      <button type="button" class="btn btn-lg cta-blue oem-next">${T.btns.next}</button>
    </div>
  </div>`;
}

function renderStep2(p, lang) {
  const T = tpl[lang];
  return `<div class="oem-step" data-step="2">
    <h2>${T.step2.title}</h2>
    <p class="oem-step-desc">${T.step2.desc}</p>
    <div class="oem-form-grid">
      <label class="oem-field">
        <span>${T.fields.size}</span>
        <input type="text" name="size" placeholder="e.g. 50×35×20" />
      </label>
      <label class="oem-field">
        <span>${T.fields.material}</span>
        <select name="material">
          <option value="">--</option>
          ${renderOptions("material", T.options.materials)}
        </select>
      </label>
      <label class="oem-field">
        <span>${T.fields.ipRating}</span>
        <select name="ipRating">
          <option value="">--</option>
          ${renderOptions("ipRating", T.options.ipRatings)}
        </select>
      </label>
      <label class="oem-field">
        <span>${T.fields.color}</span>
        <select name="color">
          <option value="">--</option>
          ${renderOptions("color", T.options.colors)}
        </select>
      </label>
      <label class="oem-field">
        <span>${T.fields.foamInsert}</span>
        <select name="foamInsert">
          <option value="">--</option>
          ${renderOptions("foamInsert", T.options.foamOptions)}
        </select>
      </label>
      <label class="oem-field">
        <span>${T.fields.logoPrint}</span>
        <select name="logoPrint">
          <option value="">--</option>
          ${renderOptions("logoPrint", T.options.logoOptions)}
        </select>
      </label>
    </div>
    <div class="oem-actions">
      <button type="button" class="btn oem-prev">${T.btns.prev}</button>
      <button type="button" class="btn btn-lg cta-blue oem-next">${T.btns.next}</button>
    </div>
  </div>`;
}

function renderStep3(p, lang) {
  const T = tpl[lang];
  return `<div class="oem-step" data-step="3">
    <h2>${T.step3.title}</h2>
    <p class="oem-step-desc">${T.step3.desc}</p>
    <div class="oem-form-grid">
      <label class="oem-field">
        <span>${T.fields.quantity} *</span>
        <input type="number" name="quantity" min="1" placeholder="e.g. 500" required />
      </label>
      <label class="oem-field">
        <span>${T.fields.targetPrice}</span>
        <input type="number" name="targetPrice" step="0.01" min="0" placeholder="e.g. 25" />
      </label>
      <label class="oem-field">
        <span>${T.fields.leadTime}</span>
        <select name="leadTime">
          <option value="">--</option>
          ${renderOptions("leadTime", T.options.leadTimes)}
        </select>
      </label>
      <label class="oem-field">
        <span>${T.fields.certification}</span>
        <select name="certification">
          <option value="">--</option>
          ${renderOptions("certification", T.options.certifications)}
        </select>
      </label>
      <label class="oem-field oem-field-full">
        <span>${T.fields.usage}</span>
        <select name="usage">
          <option value="">--</option>
          ${renderOptions("usage", T.options.usageScenarios)}
        </select>
      </label>
    </div>
    <div class="oem-actions">
      <button type="button" class="btn oem-prev">${T.btns.prev}</button>
      <button type="button" class="btn btn-lg cta-blue oem-next">${T.btns.next}</button>
    </div>
  </div>`;
}

function renderStep4(p, lang) {
  const T = tpl[lang];
  return `<div class="oem-step" data-step="4">
    <h2>${T.step4.title}</h2>
    <p class="oem-step-desc">${T.step4.desc}</p>
    <div class="oem-form-grid">
      <label class="oem-field">
        <span>${T.fields.name} *</span>
        <input type="text" name="name" required />
      </label>
      <label class="oem-field">
        <span>${T.fields.company}</span>
        <input type="text" name="company" />
      </label>
      <label class="oem-field">
        <span>${T.fields.email} *</span>
        <input type="email" name="email" required />
      </label>
      <label class="oem-field">
        <span>${T.fields.phone} *</span>
        <input type="tel" name="phone" required placeholder="+86 ..." />
      </label>
      <label class="oem-field oem-field-full">
        <span>${T.fields.country} *</span>
        <input type="text" name="country" required />
      </label>
      <label class="oem-field oem-field-full">
        <span>${T.fields.message}</span>
        <textarea name="message" rows="3"></textarea>
      </label>
    </div>
    <div class="oem-actions">
      <button type="button" class="btn oem-prev">${T.btns.prev}</button>
      <button type="button" class="btn btn-lg cta-blue oem-next">${T.btns.next}</button>
    </div>
  </div>`;
}

function renderStep5(p, lang, summaryHtml) {
  const T = tpl[lang];
  return `<div class="oem-step" data-step="5">
    <h2>${T.step5.title}</h2>
    <p class="oem-step-desc">${T.step5.desc}</p>
    <div class="oem-summary" data-field="summary">${summaryHtml}</div>
    <div class="oem-actions">
      <button type="button" class="btn oem-prev">${T.btns.prev}</button>
      <button type="button" class="btn btn-lg cta-blue oem-submit">${T.btns.submit}</button>
    </div>
  </div>`;
}

function renderSuccess(lang, summaryText, mailtoUrl, whatsappUrl) {
  const T = tpl[lang];
  return `<div class="oem-step oem-success" data-step="success">
    <h2>✅ ${T.success.title}</h2>
    <p>${T.success.desc}</p>
    <div class="oem-success-actions">
      <a href="${mailtoUrl}" class="btn btn-lg cta-orange">${T.btns.sendEmail}</a>
      <a href="${whatsappUrl}" target="_blank" rel="noopener" class="btn btn-lg cta-green">${T.btns.sendWhatsApp}</a>
      <button type="button" class="btn btn-lg oem-copy">${T.btns.copy}</button>
    </div>
    <p style="margin-top:1.5rem;font-size:0.9em;color:var(--color-text-muted);">${T.success.copyHint}</p>
    <pre class="oem-summary-text" data-field="summaryText">${escHtml(summaryText)}</pre>
  </div>`;
}

function renderProgress(currentStep, totalSteps, lang) {
  const pct = Math.round((currentStep / totalSteps) * 100);
  return `<div class="oem-progress">
    <div class="oem-progress-bar" style="width:${pct}%"></div>
    <div class="oem-progress-label">${tpl[lang].stepN(currentStep, totalSteps)} · ${pct}%</div>
  </div>`;
}

const FORM_CLIENT_JS = `
(function() {
  var step = 1;
  var total = 5;
  var form = document.getElementById('oemForm');
  if (!form) return;
  var data = {};

  function collect() {
    data = {};
    // checkboxes (multi)
    var checked = form.querySelectorAll('input[type=checkbox][name=productLine]:checked');
    data.productLine = Array.from(checked).map(c => c.value);
    // text/select/textarea
    form.querySelectorAll('input:not([type=checkbox]):not([type=radio]), select, textarea').forEach(el => {
      if (el.name) data[el.name] = el.value;
    });
  }

  function apply() {
    Object.keys(data).forEach(k => {
      var els = form.querySelectorAll('[name="' + k + '"]');
      if (!els.length) return;
      if (els[0].type === 'checkbox') {
        els.forEach(e => { e.checked = data[k].includes(e.value); });
      } else {
        els[0].value = data[k] || '';
      }
    });
  }

  function showStep(n) {
    form.querySelectorAll('.oem-step').forEach(s => s.classList.remove('active'));
    var target = form.querySelector('[data-step="' + n + '"]');
    if (target) target.classList.add('active');
    var prog = form.querySelector('.oem-progress');
    if (prog && n >= 1 && n <= total) {
      prog.outerHTML = renderProgressJS(n, total);
    }
    step = n;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderProgressJS(c, t) {
    var pct = Math.round((c / t) * 100);
    var label = form.getAttribute('data-step-label-template') || ('Step ' + c + ' of ' + t);
    label = label.replace('{c}', c).replace('{t}', t).replace('{pct}', pct);
    return '<div class="oem-progress"><div class="oem-progress-bar" style="width:' + pct + '%"></div><div class="oem-progress-label">' + label + ' · ' + pct + '%</div></div>';
  }

  function buildSummary() {
    var lines = [];
    var labels = JSON.parse(form.getAttribute('data-field-labels') || '{}');
    var products = JSON.parse(form.getAttribute('data-product-names') || '{}');
    Object.keys(data).forEach(k => {
      var val = data[k];
      if (Array.isArray(val)) val = val.map(v => products[v] || v).join(', ');
      if (val) lines.push({ k: labels[k] || k, v: val });
    });
    return lines;
  }

  function buildSummaryText() {
    var lines = buildSummary();
    var text = form.getAttribute('data-email-greeting') || 'Hello,';
    text += '\\n\\n';
    lines.forEach(l => { text += l.k + ': ' + l.v + '\\n'; });
    text += '\\n' + (form.getAttribute('data-email-signature') || 'Best regards');
    return text;
  }

  function buildMailto() {
    var subject = (form.getAttribute('data-mailto-subject') || 'OEM Inquiry') + ' - ' + (data.name || '') + ' - ' + (data.country || '');
    return 'mailto:kexin@beeaa.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(buildSummaryText());
  }

  function buildWhatsapp() {
    var text = (form.getAttribute('data-whatsapp-prefix') || 'OEM Inquiry: ') + '%0A%0A' + buildSummaryText();
    return 'https://wa.me/8613590555309?text=' + encodeURIComponent(buildSummaryText());
  }

  // Step navigation
  form.addEventListener('click', function(e) {
    var t = e.target;
    if (t.classList.contains('oem-next')) {
      collect();
      if (step === 1 && (!data.productLine || data.productLine.length === 0)) {
        alert(form.getAttribute('data-alert-product') || 'Please select at least one product line');
        return;
      }
      if (step === 3 && !data.quantity) {
        alert(form.getAttribute('data-alert-quantity') || 'Please enter quantity');
        return;
      }
      if (step === 4) {
        if (!data.name || !data.email || !data.phone || !data.country) {
          alert(form.getAttribute('data-alert-contact') || 'Please fill in name, email, phone, country');
          return;
        }
        if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(data.email)) {
          alert(form.getAttribute('data-alert-email') || 'Please enter a valid email');
          return;
        }
        // Build summary for step 5
        var lines = buildSummary();
        var html = lines.map(l => '<div class="oem-sum-row"><strong>' + l.k + ':</strong> <span>' + (l.v + '').replace(/</g, '&lt;') + '</span></div>').join('');
        form.querySelector('[data-field="summary"]').innerHTML = html;
      }
      if (step < total) showStep(step + 1);
    }
    if (t.classList.contains('oem-prev')) {
      if (step > 1) showStep(step - 1);
    }
    if (t.classList.contains('oem-submit')) {
      collect();
      // 禁用按钮防重复提交
      t.disabled = true;
      var origText = t.textContent;
      t.textContent = (form.getAttribute('data-submitting-label') || 'Submitting...');
      // 优先调 API
      fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function(r) { return r.json().then(function(j) { return { ok: r.ok, j: j }; }); })
        .then(function(resp) {
          t.disabled = false;
          t.textContent = origText;
          var summaryText = buildSummaryText();
          var mailto = buildMailto();
          var whatsapp = buildWhatsapp();
          var method = (resp.j && resp.j.method) || (resp.j && resp.j.success ? 'email_sending' : 'mailto_fallback');
          var badge = method === 'email_sending' ? '<div class="oem-success-badge">✅ ' + (form.getAttribute('data-sent-via-email') || 'Email sent!') + '</div>' : '';
          form.querySelectorAll('.oem-step').forEach(s => s.classList.remove('active'));
          var successEl = document.createElement('div');
          successEl.innerHTML = buildSuccessJS(summaryText, mailto, whatsapp, badge);
          form.appendChild(successEl.firstElementChild);
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(function(err) {
          t.disabled = false;
          t.textContent = origText;
          // 失败时降级 mailto:
          var summaryText = buildSummaryText();
          var mailto = buildMailto();
          var whatsapp = buildWhatsapp();
          form.querySelectorAll('.oem-step').forEach(s => s.classList.remove('active'));
          var successEl = document.createElement('div');
          successEl.innerHTML = buildSuccessJS(summaryText, mailto, whatsapp, '');
          form.appendChild(successEl.firstElementChild);
        });
    }
    if (t.classList.contains('oem-copy')) {
      var text = form.querySelector('[data-field="summaryText"]').textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          var orig = t.textContent;
          t.textContent = form.getAttribute('data-copied-label') || 'Copied!';
          setTimeout(function() { t.textContent = orig; }, 2000);
        });
      }
    }
  });

  function buildSuccessJS(text, mailto, whatsapp, badge) {
    var title = form.getAttribute('data-success-title') || 'Inquiry Generated!';
    var desc = form.getAttribute('data-success-desc') || 'Please send via:';
    var btnEmail = form.getAttribute('data-btn-email') || '📧 Email';
    var btnWa = form.getAttribute('data-btn-wa') || '💬 WhatsApp';
    var btnCopy = form.getAttribute('data-btn-copy') || 'Copy';
    return '<div class="oem-step oem-success active" data-step="success">' +
      '<h2>✅ ' + title + '</h2>' +
      (badge || '') +
      '<p>' + desc + '</p>' +
      '<div class="oem-success-actions">' +
        '<a href="' + mailto + '" class="btn btn-lg cta-orange">' + btnEmail + '</a>' +
        '<a href="' + whatsapp + '" target="_blank" rel="noopener" class="btn btn-lg cta-green">' + btnWa + '</a>' +
        '<button type="button" class="btn btn-lg oem-copy">' + btnCopy + '</button>' +
      '</div>' +
      '<pre class="oem-summary-text" data-field="summaryText">' + text.replace(/</g, '&lt;') + '</pre>' +
    '</div>';
  }
})();
`;

const FORM_CSS = `
.oem-form-wrapper { max-width: 720px; margin: 0 auto; padding: var(--space-4) 0; }
.oem-progress { position: relative; height: 8px; background: var(--color-bg-soft); border-radius: 4px; margin-bottom: var(--space-6); overflow: hidden; }
.oem-progress-bar { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, var(--color-accent), #F59E0B); transition: width 0.4s ease; border-radius: 4px; }
.oem-progress-label { position: absolute; top: 14px; right: 0; font-size: 0.875rem; color: var(--color-text-muted); font-weight: 500; }
.oem-step { display: none; animation: fadeInUp 0.3s ease; }
.oem-step.active { display: block; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.oem-step h2 { font-size: var(--fs-2xl); font-weight: 700; margin-bottom: var(--space-2); }
.oem-step-desc { color: var(--color-text-muted); margin-bottom: var(--space-6); }
.oem-chips { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-6); }
.oem-chip { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4); border: 2px solid var(--color-border); border-radius: var(--radius); cursor: pointer; transition: all 0.2s ease; user-select: none; }
.oem-chip:hover { border-color: var(--color-accent); background: var(--color-accent-soft); }
.oem-chip input { width: 18px; height: 18px; cursor: pointer; flex-shrink: 0; }
.oem-chip input:checked + span { color: var(--color-accent); font-weight: 600; }
.oem-chip:has(input:checked) { border-color: var(--color-accent); background: var(--color-accent-soft); }
.oem-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
@media (max-width: 640px) { .oem-form-grid { grid-template-columns: 1fr; } }
.oem-field { display: flex; flex-direction: column; gap: var(--space-2); }
.oem-field-full { grid-column: 1 / -1; }
.oem-field span { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
.oem-field input, .oem-field select, .oem-field textarea { padding: var(--space-3) var(--space-4); border: 1.5px solid var(--color-border); border-radius: var(--radius); background: var(--color-bg); color: var(--color-text); font-size: 1rem; font-family: inherit; transition: border-color 0.2s ease; }
.oem-field input:focus, .oem-field select:focus, .oem-field textarea:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-soft); }
.oem-actions { display: flex; gap: var(--space-3); justify-content: space-between; margin-top: var(--space-6); }
.oem-actions .btn-lg { padding: var(--space-4) var(--space-6); }
.oem-summary { background: var(--color-bg-soft); border: 1px solid var(--color-border); border-radius: var(--radius); padding: var(--space-5); margin-bottom: var(--space-6); }
.oem-sum-row { display: grid; grid-template-columns: 140px 1fr; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); font-size: 0.95rem; }
.oem-sum-row:last-child { border-bottom: none; }
.oem-sum-row strong { color: var(--color-text-secondary); }
.oem-success { text-align: center; }
.oem-success h2 { color: #10B981; }
.oem-success-actions { display: flex; gap: var(--space-3); justify-content: center; margin: var(--space-6) 0; flex-wrap: wrap; }
.oem-summary-text { background: var(--color-bg-soft); border: 1px solid var(--color-border); border-radius: var(--radius); padding: var(--space-4); text-align: left; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.875rem; white-space: pre-wrap; word-wrap: break-word; max-height: 360px; overflow-y: auto; margin-top: var(--space-4); }
.oem-success-badge { display: inline-block; background: #10B981; color: #fff; padding: var(--space-2) var(--space-4); border-radius: var(--radius); font-weight: 600; margin: var(--space-3) 0; }
`;

export function renderOEMFormPage({ lang = "en" } = {}) {
  const T = tpl[lang];
  const labels = T.fields;
  const productNames = T.products;
  const labelsJson = JSON.stringify(labels).replace(/'/g, "&#39;");
  const productNamesJson = JSON.stringify(productNames).replace(/'/g, "&#39;");

  const initialSummary = '<p style="color:var(--color-text-muted);">Fill all steps to see your inquiry summary here.</p>';

  return `<section class="oem-form-wrapper" id="oemForm"
    data-field-labels='${labelsJson}'
    data-product-names='${productNamesJson}'
    data-step-label-template='${escHtml(T.stepN("{c}", "{t}"))}'
    data-alert-product='${escHtml(lang === "zh" ? "请至少选择一个产品线" : "Please select at least one product line")}'
    data-alert-quantity='${escHtml(lang === "zh" ? "请输入数量" : "Please enter quantity")}'
    data-alert-contact='${escHtml(lang === "zh" ? "请填写姓名、邮箱、电话、国家" : "Please fill in name, email, phone, country")}'
    data-alert-email='${escHtml(lang === "zh" ? "请输入有效邮箱" : "Please enter a valid email")}'
    data-copied-label='${escHtml(T.btns.copied)}'
    data-mailto-subject='${escHtml(lang === "zh" ? "OEM 询盘" : "OEM Inquiry")}'
    data-whatsapp-prefix='${escHtml(lang === "zh" ? "OEM 询盘：" : "OEM Inquiry: ")}'
    data-success-title='${escHtml(T.success.title)}'
    data-success-desc='${escHtml(T.success.desc)}'
    data-btn-email='${escHtml(T.btns.sendEmail)}'
    data-btn-wa='${escHtml(T.btns.sendWhatsApp)}'
    data-btn-copy='${escHtml(T.btns.copy)}'
    data-submitting-label='${escHtml(lang === "zh" ? "提交中..." : "Submitting...")}'
    data-sent-via-email='${escHtml(lang === "zh" ? "邮件已发送至 kexin@beeaa.com，12 小时内回复" : "Email sent to kexin@beeaa.com — reply within 12 hours")}'
    data-email-greeting='${escHtml(lang === "zh" ? "您好，" : "Hello,")}'
    data-email-signature='${escHtml(lang === "zh" ? "此致" : "Best regards")}'
  >
    ${renderProgress(1, 5, lang)}
    ${renderStep1({}, lang)}
    ${renderStep2({}, lang)}
    ${renderStep3({}, lang)}
    ${renderStep4({}, lang)}
    ${renderStep5({}, lang, initialSummary)}
  </section>
  <style>${FORM_CSS}</style>
  <script>${FORM_CLIENT_JS}</script>`;
}

export { FORM_CSS, FORM_CLIENT_JS };
