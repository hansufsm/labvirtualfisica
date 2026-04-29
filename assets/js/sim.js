/* ============================================
   SIM.JS – Cálculos físicos, estado e exportações
   ============================================ */

/* ---- Constantes físicas ---- */
const COMPRIMENTOS = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
const T0 = 25;   // temperatura ambiente (°C)
const H  = 15;   // coef. convecção (W/m²·K)

/* Limites de alerta */
const ALERT_CURRENT_WARNING  = 3;   // A – corrente elevada
const ALERT_CURRENT_DANGER   = 5;   // A – corrente perigosa
const INFINITE_CURRENT_PROXY = 999; // valor proxy para "corrente infinita" em alertas

/* Verificação de proporcionalidade R×L: R(1m)/R(0.6m) ≈ 1.67 */
const EXPECTED_R_RATIO = 1.67;
const R_RATIO_TOLERANCE = 0.5;

const MATERIAIS = {
  nicr: {
    nome: 'Níquel-Cromo', formula: 'Ni-Cr',
    resistividade: 1.10e-6, alpha: 0.0004,
    densidade: 8400, calorEsp: 450, emissividade: 0.8,
    cor: '#FF6384', corClara: '#ffd700', corEscura: '#b8860b',
    descricao: 'Liga resistiva para aquecimento',
    aplicacoes: ['Chuveiros elétricos', 'Fornos industriais', 'Secadores de cabelo']
  },
  fe: {
    nome: 'Ferro', formula: 'Fe',
    resistividade: 9.71e-8, alpha: 0.005,
    densidade: 7874, calorEsp: 449, emissividade: 0.6,
    cor: '#4BC0C0', corClara: '#c0c0c0', corEscura: '#808080',
    descricao: 'Metal ferromagnético, pouco condutor',
    aplicacoes: ['Estruturas metálicas', 'Transformadores', 'Ferramentas']
  },
  cu: {
    nome: 'Cobre', formula: 'Cu',
    resistividade: 1.68e-8, alpha: 0.0039,
    densidade: 8960, calorEsp: 385, emissividade: 0.05,
    cor: '#FFCE56', corClara: '#ff8c00', corEscura: '#8b4513',
    descricao: 'Excelente condutor elétrico',
    aplicacoes: ['Fiação residencial', 'Cabos elétricos', 'Eletrônicos']
  },
  al: {
    nome: 'Alumínio', formula: 'Al',
    resistividade: 2.65e-8, alpha: 0.004,
    densidade: 2700, calorEsp: 900, emissividade: 0.1,
    cor: '#9966FF', corClara: '#e0e0e0', corEscura: '#a0a0a0',
    descricao: 'Leve e bom condutor',
    aplicacoes: ['Linhas de transmissão', 'Aeronáutica', 'Embalagens']
  }
};

const REFS = {
  nicr05: { material: 'nicr', diametro: 0.5,  nome: 'Ni-Cr 0.5mm', cor: '#FF6384' },
  nicr10: { material: 'nicr', diametro: 1.0,  nome: 'Ni-Cr 1.0mm', cor: '#36A2EB' },
  nicr15: { material: 'nicr', diametro: 1.5,  nome: 'Ni-Cr 1.5mm', cor: '#FFCE56' },
  fe15:   { material: 'fe',   diametro: 1.5,  nome: 'Fe 1.5mm',    cor: '#4BC0C0' }
};

/* ---- Estado global ---- */
const APP = {
  material: 'nicr',
  diametro: 1.0,
  voltagem: 5.0,
  experimentos: 0,
  materiaisTestados:  new Set(),
  diametrosTestados:  new Set(),
  conquistas:         new Set(),
  missoesCompletadas: new Set(),
  entradasDiario: [],
  aquecendo: false,
  tempoSimulado: 0,
  tempAtual: T0,
  animFrame: null,
  darkMode: false,
  usouCalculadora: false,
  explorouTermica: false,
  _debounceTimer: null
};

/* ---- Áudio ---- */
let audioCtx = null;
let alarmInterval = null;

function _initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function _playBeep(freq, duration) {
  _initAudio();
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.10, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

function _startAlarm(freq, interval) {
  _stopAlarm();
  alarmInterval = setInterval(() => _playBeep(freq, 0.3), interval);
}

function _stopAlarm() {
  if (alarmInterval) clearInterval(alarmInterval);
  alarmInterval = null;
}

/* ---- Funções físicas ---- */
function areaSecao(dMM) {
  const r = (dMM / 1000) / 2;
  return Math.PI * r * r;
}

function areaSuperficial(dMM, L) {
  return Math.PI * (dMM / 1000) * L;
}

function resistencia(rho, L, dMM) {
  return L === 0 ? 0 : (rho * L) / areaSecao(dMM);
}

function corrente(R) {
  return R === 0 ? Infinity : APP.voltagem / R;
}

function potencia(R) {
  return R === 0 ? Infinity : (APP.voltagem * APP.voltagem) / R;
}

function temperaturaEquilibrio(P, dMM, L) {
  if (L === 0 || P === Infinity || P === 0) return T0;
  return T0 + P / (H * areaSuperficial(dMM, L));
}

function constanteTempo(dMM, L) {
  const mat  = MATERIAIS[APP.material];
  const massa = mat.densidade * areaSecao(dMM) * L;
  return (massa * mat.calorEsp) / (H * areaSuperficial(dMM, L));
}

function gerarDados(mat, dMM, V) {
  const rho = MATERIAIS[mat].resistividade;
  return COMPRIMENTOS.map(L => {
    const R = resistencia(rho, L, dMM);
    return {
      comprimento: L,
      resistencia: parseFloat(R.toFixed(4)),
      corrente:    R === 0 ? Infinity : parseFloat((V / R).toFixed(4)),
      tensao: V
    };
  });
}

function gerarRefs(V) {
  const r = {};
  Object.keys(REFS).forEach(k => {
    r[k] = gerarDados(REFS[k].material, REFS[k].diametro, V);
  });
  return r;
}

/* ---- Termômetro ---- */
function _atualizarTermometro(T) {
  const pct = Math.min(100, Math.max(3, ((T - 25) / 375) * 100));
  document.getElementById('thermometerFill').style.height = pct + '%';
  const disp  = document.getElementById('tempDisplay');
  const label = document.getElementById('tempLabel');
  disp.textContent = T.toFixed(1) + '°C';
  if (T < 45) {
    disp.style.color = '#27ae60';
    label.textContent = '✅ Seguro ao toque';
  } else if (T < 60) {
    disp.style.color = '#f39c12';
    label.textContent = '⚠️ Morno – Cuidado';
  } else {
    disp.style.color = '#e74c3c';
    label.textContent = '🔥 PERIGO: Queimadura!';
  }
}

/* ---- Alertas ---- */
function _atualizarAlertas(d1m) {
  const I = d1m.corrente === Infinity ? INFINITE_CURRENT_PROXY : d1m.corrente;
  const alertT = document.getElementById('alertTemperature');
  const alertC = document.getElementById('alertCurrent');
  _stopAlarm();
  document.body.classList.remove('danger-mode');
  alertT.classList.remove('visible');
  alertC.classList.remove('visible');

  if (APP.tempAtual > 60) {
    alertT.textContent = '🌡️ TEMPERATURA PERIGOSA! Risco de queimadura grave!';
    alertT.classList.add('visible');
    document.body.classList.add('danger-mode');
    _startAlarm(880, 500);
  } else if (APP.tempAtual > 45) {
    alertT.textContent = '🌡️ Temperatura elevada! Cuidado ao toque.';
    alertT.classList.add('visible');
    _startAlarm(440, 2000);
  }

  if (I > ALERT_CURRENT_DANGER) {
    alertC.textContent = `⚡ CORRENTE PERIGOSA (${I.toFixed(1)}A)! Risco de choque e incêndio!`;
    alertC.classList.add('visible');
    document.body.classList.add('danger-mode');
    _startAlarm(220, 300);
  } else if (I > ALERT_CURRENT_WARNING) {
    alertC.textContent = `⚡ Corrente elevada (${I.toFixed(1)}A). Atenção!`;
    alertC.classList.add('visible');
  }
}

/* ---- Seção transversal ---- */
function _desenharSecao(dMM) {
  const canvas = document.getElementById('crossSectionCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const s = canvas.width;
  const cx = s / 2, cy = s / 2;
  ctx.clearRect(0, 0, s, s);

  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  for (let r = 30; r <= 120; r += 30) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  const raio = 18 + (Math.pow(dMM / 3.6, 0.7) * 100);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, 2 * Math.PI);
  const mat = MATERIAIS[APP.material];
  const g = ctx.createRadialGradient(cx - raio * 0.3, cy - raio * 0.3, raio * 0.05, cx, cy, raio);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.3, mat.corClara);
  g.addColorStop(0.7, mat.corEscura);
  g.addColorStop(1, '#333');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([5, 3]);
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - raio, cy);
  ctx.lineTo(cx + raio, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#333';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Ø ${dMM.toFixed(2)} mm`, cx, cy - raio - 16);
  ctx.font = '10px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText(`Área: ${areaSecao(dMM).toExponential(2)} m²`, cx, cy + raio + 22);
}

/* ---- Atualização principal ---- */
function _atualizarUI() {
  const dados = gerarDados(APP.material, APP.diametro, APP.voltagem);
  const d1m   = dados[dados.length - 1];
  const mat   = MATERIAIS[APP.material];

  /* Tabela */
  document.getElementById('tableBody').innerHTML = dados.map(d => {
    const iColor = d.corrente === Infinity ? '#e74c3c'
                 : d.corrente > 5 ? '#e74c3c'
                 : d.corrente > 3 ? '#f39c12'
                 : '#27ae60';
    return `<tr>
      <td><strong>${d.comprimento.toFixed(1)}</strong></td>
      <td>${d.resistencia.toFixed(4)}</td>
      <td style="color:${iColor};font-weight:bold;">${d.corrente === Infinity ? '∞' : d.corrente.toFixed(4)}</td>
      <td>${d.tensao.toFixed(1)}</td>
    </tr>`;
  }).join('');

  /* Gráfico R×L — só renderiza se visível */
  if (document.getElementById('section-experiment') && !document.getElementById('section-experiment').hidden) {
    Charts.atualizarGraficoRL(dados);
  }

  /* Métricas */
  document.getElementById('infoVoltage').textContent    = APP.voltagem.toFixed(1) + ' V';
  document.getElementById('infoResistance').textContent = d1m.resistencia.toFixed(4) + ' Ω';
  document.getElementById('infoCurrentBig').textContent =
    d1m.corrente === Infinity ? '∞' : d1m.corrente.toFixed(4) + ' A';
  document.getElementById('infoCurrent').textContent    =
    d1m.corrente === Infinity ? '∞' : d1m.corrente.toFixed(4);
  document.getElementById('infoPower').textContent      =
    d1m.resistencia === 0 ? '∞' : potencia(d1m.resistencia).toFixed(2);
  document.getElementById('infoRho').textContent        = mat.resistividade.toExponential(2) + ' Ω·m';
  document.getElementById('resistivityInfo').innerHTML  =
    `ρ = <strong>${mat.resistividade.toExponential(2)}</strong> Ω·m`;
  document.getElementById('rhoDisplay').innerHTML       =
    `ρ = <strong>${mat.resistividade.toExponential(2)} Ω·m</strong>`;

  /* Temperatura */
  if (!APP.aquecendo) {
    APP.tempAtual = T0;
    _atualizarTermometro(T0);
  }
  _atualizarAlertas(d1m);
  _desenharSecao(APP.diametro);

  /* Tau / Teq */
  const P   = d1m.resistencia === 0 ? 0 : potencia(d1m.resistencia);
  const Teq = temperaturaEquilibrio(P, APP.diametro, 1.0);
  const tau = constanteTempo(APP.diametro, 1.0);
  document.getElementById('tauValue').textContent = tau.toFixed(1);
  document.getElementById('teqValue').textContent = Teq.toFixed(1);

  /* Análise */
  document.getElementById('analysisContent').innerHTML = `
    <p><strong>${mat.nome}</strong> | Ø ${APP.diametro.toFixed(2)}mm | V = ${APP.voltagem.toFixed(1)}V</p>
    <p style="margin-top:6px;">L=1m: <strong>R = ${d1m.resistencia.toFixed(4)} Ω</strong> |
       I = ${d1m.corrente === Infinity ? '∞' : d1m.corrente.toFixed(4)} A</p>
    <div class="highlight-box">🔬 <strong>RESISTIVIDADE CONSTANTE:</strong> ρ = ${mat.resistividade.toExponential(2)} Ω·m
      — <em>NÃO muda com as dimensões!</em></div>
    <p style="margin-top:6px;">💡 Varie a <strong>tensão</strong> para observar a Lei de Ohm (I=V/R) e o aquecimento (P=V×I).</p>`;

  /* Comparação — só atualiza se visível */
  if (document.getElementById('section-comparison') && !document.getElementById('section-comparison').hidden) {
    Charts.atualizarGraficoComparativo();
  }

  /* Contadores */
  APP.experimentos++;
  APP.materiaisTestados.add(APP.material);
  APP.diametrosTestados.add(APP.diametro);
  document.getElementById('experimentCount').textContent = APP.experimentos;
  _verificarMissoes();
  _verificarConquistas();
}

/* Debounced version para eventos de slider */
function _debouncedUIUpdate() {
  clearTimeout(APP._debounceTimer);
  APP._debounceTimer = setTimeout(_atualizarUI, 80);
}

/* ---- Handlers de controles ---- */
const Sim = {
  onMaterialChange() {
    APP.material = document.getElementById('materialSelect').value;
    Sim.resetarAquecimento();
    _atualizarUI();
  },

  onDiameterInput() {
    APP.diametro = parseFloat(document.getElementById('diameterSlider').value);
    document.getElementById('diameterValue').textContent = APP.diametro.toFixed(2);
    /* Atualizar chips */
    document.querySelectorAll('.chip:not(.chip--voltage)').forEach(b => {
      const v = parseFloat(b.textContent);
      b.classList.toggle('active', Math.abs(v - APP.diametro) < 0.01);
    });
    _debouncedUIUpdate();
  },

  onVoltageInput() {
    APP.voltagem = parseFloat(document.getElementById('voltageSlider').value);
    document.getElementById('voltageValue').textContent = APP.voltagem.toFixed(1);
    /* Atualizar chips */
    document.querySelectorAll('.chip--voltage').forEach(b => {
      const v = parseFloat(b.textContent);
      b.classList.toggle('active', Math.abs(v - APP.voltagem) < 0.15);
    });
    _debouncedUIUpdate();
  },

  setDiameter(v) {
    document.getElementById('diameterSlider').value = v;
    Sim.onDiameterInput();
    clearTimeout(APP._debounceTimer);
    _atualizarUI();
  },

  setVoltage(v) {
    document.getElementById('voltageSlider').value = v;
    Sim.onVoltageInput();
    clearTimeout(APP._debounceTimer);
    _atualizarUI();
  },

  stepDiameter(delta) {
    const el = document.getElementById('diameterSlider');
    let v = parseFloat(el.value) + delta;
    v = Math.min(parseFloat(el.max), Math.max(parseFloat(el.min), parseFloat(v.toFixed(2))));
    el.value = v;
    Sim.onDiameterInput();
    clearTimeout(APP._debounceTimer);
    _atualizarUI();
  },

  stepVoltage(delta) {
    const el = document.getElementById('voltageSlider');
    let v = parseFloat(el.value) + delta;
    v = Math.min(parseFloat(el.max), Math.max(parseFloat(el.min), parseFloat(v.toFixed(1))));
    el.value = v;
    Sim.onVoltageInput();
    clearTimeout(APP._debounceTimer);
    _atualizarUI();
  },

  /* ---- Aquecimento ---- */
  iniciarAquecimento() {
    if (APP.aquecendo) return;
    APP.aquecendo = true;
    APP.tempoSimulado = 0;
    APP.tempAtual = T0;
    Charts.inicializarGraficoTt();
    document.getElementById('aquecimentoInfo').textContent = '🔄 Aquecendo…';
    _animarAquecimento();
  },

  resetarAquecimento() {
    APP.aquecendo = false;
    if (APP.animFrame) cancelAnimationFrame(APP.animFrame);
    APP.tempoSimulado = 0;
    APP.tempAtual = T0;
    Charts.inicializarGraficoTt();
    _atualizarTermometro(T0);
    _stopAlarm();
    document.body.classList.remove('danger-mode');
    document.querySelectorAll('.alert-box').forEach(a => a.classList.remove('visible'));
    document.getElementById('aquecimentoInfo').textContent =
      'Clique em "Iniciar" para ver a evolução da temperatura.';
    document.getElementById('tempTime').textContent = 'Tempo simulado: 0s';
  },

  /* ---- Diário ---- */
  adicionarEntradaDiario() {
    const hp = document.getElementById('hypothesis').value.trim();
    const ob = document.getElementById('observations').value.trim();
    if (!hp && !ob) { UI.showToast('⚠️ Escreva algo primeiro!'); return; }
    APP.entradasDiario.push({
      data: new Date().toLocaleString('pt-BR'),
      material: APP.material, diametro: APP.diametro, voltagem: APP.voltagem,
      hipotese: hp, observacoes: ob
    });
    document.getElementById('hypothesis').value = '';
    document.getElementById('observations').value = '';
    document.getElementById('journalEntries').innerHTML =
      APP.entradasDiario.map((e) => `
        <div class="journal-entry">
          <strong>📅 ${e.data}</strong> | ${MATERIAIS[e.material].nome} Ø${e.diametro.toFixed(2)}mm V=${e.voltagem.toFixed(1)}V<br>
          <strong>Hip:</strong> ${e.hipotese || '—'}<br>
          <strong>Obs:</strong> ${e.observacoes || '—'}
        </div>`).join('');
    _verificarConquistas();
    UI.showToast('✅ Registrado no diário!');
  },

  exportarDiario() {
    if (!APP.entradasDiario.length) { UI.showToast('⚠️ Diário vazio!'); return; }
    let t = 'DIÁRIO DE BORDO\n' + '='.repeat(40) + '\n\n';
    APP.entradasDiario.forEach((e, i) => {
      t += `#${i + 1} ${e.data}\nMaterial: ${MATERIAIS[e.material].nome} Ø${e.diametro.toFixed(2)}mm V=${e.voltagem.toFixed(1)}V\n`;
      t += `Hip: ${e.hipotese || '—'}\nObs: ${e.observacoes || '—'}\n${'-'.repeat(30)}\n\n`;
    });
    _downloadBlob(t, 'text/plain', 'diario_bordo.txt');
    UI.showToast('✅ Diário exportado!');
  },

  /* ---- Calculadora ---- */
  calcularDiametro() {
    const R  = parseFloat(document.getElementById('calcResistance').value);
    const L  = parseFloat(document.getElementById('calcLength').value);
    const mk = document.getElementById('calcMaterial').value;
    if (isNaN(R) || isNaN(L) || R <= 0 || L <= 0) { UI.showToast('⚠️ Valores inválidos!'); return; }
    const rho = MATERIAIS[mk].resistividade;
    const d   = 2 * Math.sqrt((rho * L) / (R * Math.PI)) * 1000;
    document.getElementById('calcResultContent').innerHTML =
      `<p>R = ${R} Ω | L = ${L} m | ${MATERIAIS[mk].nome}</p>
       <p style="margin-top:6px;">Diâmetro calculado: <strong style="font-size:18px;">${d.toFixed(3)} mm</strong></p>`;
    document.getElementById('calcResult').style.display = 'block';
    APP.usouCalculadora = true;
    _verificarConquistas();
    UI.showToast('✅ Resultado calculado!');
  },

  /* ---- Aplicações ---- */
  atualizarAplicacoes() {
    document.getElementById('applicationsContainer').innerHTML =
      Object.entries(MATERIAIS).map(([k, m]) => `
        <div class="app-card" onclick="Sim.selecionarMaterial('${k}')" role="button" tabindex="0"
             aria-label="Testar ${m.nome}">
          <h4 style="color:${m.cor};">🔬 ${m.nome}</h4>
          <p>${m.descricao}</p>
          <ul>${m.aplicacoes.map(a => `<li>${a}</li>`).join('')}</ul>
          <small style="color:${m.cor};">Toque para testar →</small>
        </div>`).join('');
  },

  selecionarMaterial(k) {
    document.getElementById('materialSelect').value = k;
    APP.material = k;
    UI.navigateTo('experiment');
    _atualizarUI();
  },

  /* ---- Exportações ---- */
  async exportarPDF() {
    if (typeof html2pdf === 'undefined') { UI.showToast('❌ Biblioteca PDF não carregada.'); return; }
    UI.showToast('📄 Gerando PDF… Aguarde.');
    const allSections = document.querySelectorAll('.tab-section');
    const wasHidden = [];
    allSections.forEach(s => { wasHidden.push(s.hidden); s.hidden = false; });
    try {
      await html2pdf().set({
        margin: [8, 8, 8, 8],
        filename: `relatorio_resistividade_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, logging: false, useCORS: true, windowWidth: 1400 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }).from(document.getElementById('mainContent')).save();
      UI.showToast('✅ PDF exportado!');
    } catch (e) {
      console.error('Erro PDF:', e);
      UI.showToast('❌ Erro ao gerar PDF.');
    } finally {
      allSections.forEach((s, i) => { s.hidden = wasHidden[i]; });
    }
  },

  exportarCSV() {
    const d = gerarDados(APP.material, APP.diametro, APP.voltagem);
    let c = 'L(m),R(Ω),I(A),V(V)\n';
    d.forEach(x => {
      c += `${x.comprimento},${x.resistencia},${x.corrente === Infinity ? '∞' : x.corrente},${x.tensao}\n`;
    });
    _downloadBlob('\ufeff' + c, 'text/csv', 'dados_resistividade.csv');
    UI.showToast('✅ CSV exportado!');
  },

  compartilhar(rede) {
    const u = encodeURIComponent(window.location.href);
    const t = encodeURIComponent('Lab Virtual de Resistividade – Experimento Interativo');
    const urls = {
      whatsapp: `https://wa.me/?text=${t}%20${u}`,
      twitter:  `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`
    };
    if (urls[rede]) window.open(urls[rede], '_blank', 'width=600,height=400');
  },

  async copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      UI.showToast('✅ Link copiado!');
    } catch {
      UI.showToast('❌ Erro ao copiar link.');
    }
  }
};

/* ---- Animação de aquecimento ---- */
function _animarAquecimento() {
  if (!APP.aquecendo) return;
  const d   = gerarDados(APP.material, APP.diametro, APP.voltagem);
  const d1m = d[d.length - 1];
  const P   = d1m.resistencia === 0 ? 0 : potencia(d1m.resistencia);
  const Teq = temperaturaEquilibrio(P, APP.diametro, 1.0);
  const tau = constanteTempo(APP.diametro, 1.0);
  document.getElementById('tauValue').textContent = tau.toFixed(1);
  document.getElementById('teqValue').textContent = Teq.toFixed(1);

  const dtSim = 0.1 * 30;
  APP.tempoSimulado += dtSim;
  APP.tempAtual = T0 + (Teq - T0) * (1 - Math.exp(-APP.tempoSimulado / tau));

  Charts.atualizarGraficoTt(APP.tempoSimulado, APP.tempAtual);
  _atualizarTermometro(APP.tempAtual);
  _atualizarAlertas(d1m);
  document.getElementById('tempTime').textContent =
    `Tempo simulado: ${Math.floor(APP.tempoSimulado / 60)}min ${Math.floor(APP.tempoSimulado % 60)}s`;

  if (APP.tempAtual >= Teq * 0.99 && APP.tempoSimulado > 10) {
    APP.aquecendo = false;
    document.getElementById('aquecimentoInfo').textContent =
      `✅ Equilíbrio atingido: ${APP.tempAtual.toFixed(1)}°C`;
    _stopAlarm();
    document.body.classList.remove('danger-mode');
    return;
  }
  APP.animFrame = requestAnimationFrame(_animarAquecimento);
}

/* ---- Missões ---- */
function _verificarMissoes() {
  const d = gerarDados(APP.material, APP.diametro, APP.voltagem);
  /* Missão 1: verificar proporcionalidade R∝L → R(1m)/R(0.6m) ≈ 1.67 */
  if (d[5].resistencia > 0 && Math.abs(d[5].resistencia / (d[3].resistencia || 1) - EXPECTED_R_RATIO) < R_RATIO_TOLERANCE)
    APP.missoesCompletadas.add(1);
  if (APP.material === 'nicr' && APP.diametrosTestados.has(0.5) && APP.diametrosTestados.has(1.5))
    APP.missoesCompletadas.add(2);
  if (APP.diametro === 1.5 && APP.materiaisTestados.has('nicr') && APP.materiaisTestados.has('fe'))
    APP.missoesCompletadas.add(3);
  if (APP.voltagem !== 5.0 && APP.aquecendo)
    APP.missoesCompletadas.add(4);

  document.getElementById('missionCount').textContent = `${APP.missoesCompletadas.size}/4`;
  const defs = [
    { id: 1, t: '🔍 R∝L',     d: 'Verifique a proporcionalidade entre R e L' },
    { id: 2, t: '📏 Diâmetros', d: 'Teste Ni-Cr em diâmetros diferentes (0.5mm e 1.5mm)' },
    { id: 3, t: '🧪 Materiais', d: 'Compare Ni-Cr e Ferro no mesmo diâmetro (1.5mm)' },
    { id: 4, t: '⚡ Tensão',   d: 'Varie a tensão e observe a corrente mudar' }
  ];
  document.getElementById('missionsContainer').innerHTML = defs.map(m => {
    const c = APP.missoesCompletadas.has(m.id);
    return `<div class="mission-card ${c ? 'completed' : ''}">
      <span style="font-size:22px;">${c ? '✅' : '⬜'}</span>
      <div><strong>${m.t}</strong><br><small>${m.d}</small></div>
    </div>`;
  }).join('');
}

/* ---- Conquistas ---- */
function _verificarConquistas() {
  const cs = {
    'primeiro':    APP.experimentos >= 1,
    'diametros':   APP.diametrosTestados.size >= 5,
    'materiais':   APP.materiaisTestados.size >= 4,
    'missoes':     APP.missoesCompletadas.size >= 4,
    'diario':      APP.entradasDiario.length >= 3,
    'calculadora': APP.usouCalculadora,
    'termologista':APP.explorouTermica,
    'completo':    APP.experimentos >= 20
  };
  Object.entries(cs).forEach(([k, v]) => { if (v) APP.conquistas.add(k); });

  const defs = {
    'primeiro':    { icon: '🔬', label: 'Primeiro Exp.' },
    'diametros':   { icon: '📏', label: '5 Diâmetros' },
    'materiais':   { icon: '🧪', label: '4 Materiais' },
    'missoes':     { icon: '⚡', label: 'Todas Missões' },
    'diario':      { icon: '📝', label: '3 Entradas' },
    'calculadora': { icon: '🧮', label: 'Calculadora' },
    'termologista':{ icon: '🌡️', label: 'Termologista' },
    'completo':    { icon: '🌟', label: '20 Experimentos' }
  };

  document.getElementById('achievementsContainer').innerHTML =
    Object.entries(defs).map(([k, def]) => {
      const unlocked = APP.conquistas.has(k);
      return `<div class="achievement-item ${unlocked ? 'unlocked' : ''}">
        <div style="font-size:28px;">${unlocked ? def.icon : '🔒'}</div>
        <small style="font-size:11px;font-weight:600;">${def.label}</small>
      </div>`;
    }).join('');

  document.getElementById('achievementCount').textContent = `${APP.conquistas.size}/8`;
  const badge = document.getElementById('achievementBadge');
  if (badge) badge.textContent = `${APP.conquistas.size}/8`;
}

/* ---- Utilitário ---- */
function _downloadBlob(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
