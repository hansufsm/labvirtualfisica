/* ============================================
   APP.JS – Boot / Inicialização
   ============================================ */

function init() {
  /* Inicializar controles com valores do estado */
  const matSelect = document.getElementById('materialSelect');
  const dSlider   = document.getElementById('diameterSlider');
  const vSlider   = document.getElementById('voltageSlider');

  if (matSelect) matSelect.value = APP.material;
  if (dSlider)   dSlider.value   = APP.diametro;
  if (vSlider)   vSlider.value   = APP.voltagem;

  document.getElementById('diameterValue').textContent = APP.diametro.toFixed(2);
  document.getElementById('voltageValue').textContent  = APP.voltagem.toFixed(1);

  /* Atualizar simulação inicial */
  _atualizarUI();
  Charts.inicializarGraficoTt();
  _verificarMissoes();
  _verificarConquistas();
  Sim.atualizarAplicacoes();

  /* Marcar chip inicial ativo */
  document.querySelectorAll('.chip:not(.chip--voltage)').forEach(b => {
    b.classList.toggle('active', Math.abs(parseFloat(b.textContent) - APP.diametro) < 0.01);
  });
  document.querySelectorAll('.chip--voltage').forEach(b => {
    b.classList.toggle('active', Math.abs(parseFloat(b.textContent) - APP.voltagem) < 0.15);
  });

  /* Mostrar seção inicial */
  UI.navigateTo('experiment');

  /* Suporte a tecla Enter em app-cards */
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('app-card')) {
      e.target.click();
    }
  });

  console.log('🚀 Lab Virtual de Resistividade v10 Mobile pronto!');
}

document.addEventListener('DOMContentLoaded', init);
