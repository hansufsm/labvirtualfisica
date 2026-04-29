/* ============================================
   CHARTS.JS – Setup e renderização dos gráficos
   ============================================ */

const Charts = (() => {
  let chartRL   = null;
  let chartTt   = null;
  let chartComp = null;
  let dadosAquecimento = [];

  /* ---- R × L ---- */
  function atualizarGraficoRL(dados) {
    const el = document.getElementById('chartRL');
    if (!el) return;
    const ctx = el.getContext('2d');
    if (chartRL) chartRL.destroy();

    const dg  = dados.filter(d => d.comprimento > 0);
    const inc = dg.length > 0 ? dg[dg.length - 1].resistencia / dg[dg.length - 1].comprimento : 0;
    const mat = MATERIAIS[APP.material];

    chartRL = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${mat.nome} Ø${APP.diametro.toFixed(2)}mm V=${APP.voltagem.toFixed(1)}V`,
          data: dg.map(d => ({ x: d.comprimento, y: d.resistencia })),
          backgroundColor: mat.cor,
          borderColor: mat.cor,
          showLine: true,
          tension: 0,
          pointRadius: 5,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 200 },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `R×L | Inclinação = ${inc.toFixed(4)} Ω/m  (= ρ/A)`,
            font: { size: 13 }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'L (m)' },
            min: 0, max: 1.1
          },
          y: {
            title: { display: true, text: 'R (Ω)' },
            min: 0
          }
        }
      }
    });

    const info = document.getElementById('chartRLInfo');
    if (info) info.innerHTML = `📐 R/L = <strong>${inc.toFixed(4)} Ω/m</strong>`;
  }

  /* ---- T × t ---- */
  function inicializarGraficoTt() {
    const el = document.getElementById('chartTt');
    if (!el) return;
    const ctx = el.getContext('2d');
    if (chartTt) chartTt.destroy();
    dadosAquecimento = [{ t: 0, T: T0 }];

    chartTt = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['0'],
        datasets: [{
          label: 'T (°C)',
          data: [T0],
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231,76,60,0.10)',
          fill: true,
          tension: 0.3,
          pointRadius: 1,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'T × t  (L=1m)', font: { size: 13 } }
        },
        scales: {
          x: {
            title: { display: true, text: 'Tempo (s)' },
            min: 0, max: 300
          },
          y: {
            title: { display: true, text: 'T (°C)' },
            min: 20, max: 450
          }
        }
      }
    });
  }

  function atualizarGraficoTt(t, T) {
    if (!chartTt) return;
    dadosAquecimento.push({ t, T });
    if (dadosAquecimento.length > 300) dadosAquecimento.shift();
    chartTt.data.labels = dadosAquecimento.map(d => d.t.toFixed(0));
    chartTt.data.datasets[0].data = dadosAquecimento.map(d => d.T);
    chartTt.options.scales.y.max = Math.min(500, Math.max(...dadosAquecimento.map(d => d.T), 100) + 30);
    chartTt.options.scales.x.max = Math.max(60, t + 30);
    chartTt.update('none');
  }

  /* ---- Comparativo ---- */
  function atualizarGraficoComparativo() {
    const el = document.getElementById('comparisonChart');
    if (!el) return;
    const ctx  = el.getContext('2d');
    if (chartComp) chartComp.destroy();

    const refs = gerarRefs(APP.voltagem);
    const datasets = Object.keys(REFS).map(k => ({
      label: REFS[k].nome,
      data: refs[k].filter(d => d.comprimento > 0).map(d => ({ x: d.comprimento, y: d.resistencia })),
      borderColor: REFS[k].cor,
      backgroundColor: REFS[k].cor,
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 3,
      showLine: true,
      tension: 0
    }));

    const da = gerarDados(APP.material, APP.diametro, APP.voltagem);
    datasets.push({
      label: `${MATERIAIS[APP.material].nome} Ø${APP.diametro.toFixed(2)}mm (V=${APP.voltagem.toFixed(1)}V)`,
      data: da.filter(d => d.comprimento > 0).map(d => ({ x: d.comprimento, y: d.resistencia })),
      borderColor: '#000',
      backgroundColor: '#000',
      borderWidth: 3,
      pointRadius: 5,
      showLine: true,
      tension: 0
    });

    chartComp = new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, padding: 12, font: { size: 11 } }
          },
          title: {
            display: true,
            text: `Comparação R×L  (V=${APP.voltagem.toFixed(1)}V)`,
            font: { size: 13 }
          }
        },
        scales: {
          x: { title: { display: true, text: 'L (m)' }, min: 0, max: 1.1 },
          y: { title: { display: true, text: 'R (Ω)' }, min: 0 }
        }
      }
    });

    const legend = document.getElementById('comparisonLegend');
    if (legend) {
      legend.innerHTML = Object.keys(REFS).map(k => {
        const inc = refs[k][5].resistencia / 0.9999;
        return `<div class="legend-item">
          <div class="legend-color" style="background:${REFS[k].cor};"></div>
          ${REFS[k].nome}: ${inc.toFixed(4)} Ω/m
        </div>`;
      }).join('');
    }

    const cvEl = document.getElementById('compVoltage');
    if (cvEl) cvEl.textContent = APP.voltagem.toFixed(1);

    const tbody = document.getElementById('comparisonTableBody');
    if (tbody) {
      tbody.innerHTML = COMPRIMENTOS.map((L, i) => `
        <tr>
          <td>${L.toFixed(1)}</td>
          ${Object.keys(REFS).map(k => `<td>${refs[k][i].resistencia.toFixed(4)}</td>`).join('')}
          <td style="font-weight:bold;background:#f0f0f0;">${da[i].resistencia.toFixed(4)}</td>
        </tr>`).join('');
    }
  }

  return { atualizarGraficoRL, inicializarGraficoTt, atualizarGraficoTt, atualizarGraficoComparativo };
})();
