# 🧪 Lab Virtual de Resistividade

Simulação interativa de **Resistividade (ρ)**, **Lei de Ohm** e **Efeito Joule** — otimizada para **celular** (mobile-first).

## 🌐 Acesso Online (GitHub Pages)

**URL:** `https://hansufsm.github.io/labvirtualfisica/`

> Basta abrir essa URL no navegador do celular ou computador — sem instalação!

---

## 📱 Funcionalidades

- **Simulação completa** de um fio condutor com controles de:
  - Material (Ni-Cr, Fe, Cu, Al)
  - Diâmetro (slider + botões +/− + chips de preset)
  - Tensão (slider + botões +/− + chips de preset)
- **Resultados em tempo real**: resistência, corrente, potência, resistividade
- **Termômetro animado** com alertas de segurança
- **Gráficos** (Chart.js): R×L e temperatura × tempo
- **Simulação de aquecimento** com equilíbrio térmico e alarmes
- **Comparação** de múltiplos materiais e diâmetros
- **Missões** e **conquistas** gamificadas
- **Diário de bordo** para registrar hipóteses e observações
- **Calculadora** de dimensionamento de fio
- **Exportar PDF** e **CSV** dos dados
- **Compartilhar** (WhatsApp, Twitter/X, LinkedIn)
- **Modo escuro**

---

## 📂 Estrutura do Projeto

```
labvirtualfisica/
├── index.html          ← Página principal (SPA mobile-first)
├── manifest.json       ← PWA manifest
├── assets/
│   ├── css/
│   │   └── app.css     ← Estilos mobile-first
│   └── js/
│       ├── sim.js      ← Cálculos físicos + estado + exportações
│       ├── charts.js   ← Gráficos Chart.js
│       ├── ui.js       ← Navegação, sheets, toast, accordion
│       └── app.js      ← Boot / init
└── deepseek_html_20260428_036752-V9.html  ← Versão legado V9
```

---

## 🚀 Como rodar localmente

Basta abrir `index.html` em qualquer navegador moderno:

```bash
# Com Python (qualquer versão)
python -m http.server 8080
# Acesse: http://localhost:8080
```

Ou use a extensão **Live Server** no VS Code.

---

## 📐 Design Mobile-First

- **Bottom Navigation** (5 itens) + item "Mais" que abre bottom sheet
- **FAB** (⚡) para ações: exportar PDF/CSV, copiar link, compartilhar
- Controles com **áreas de toque ≥ 44px**
- **Chips** horizontalmente roláveis para presets
- Botões **+/−** para ajuste fino sem perder o slider
- Tabelas em **scroll horizontal** e gráficos responsivos
- Conteúdo extra em **accordions** (leitura não essencial)
- Suporte a **safe-area** (notch/home indicator do iPhone)

---

## ⚙️ GitHub Pages

Para ativar o GitHub Pages:
1. Vá em **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** | Folder: **/ (root)**
4. Salve — após 1–3 min o site estará em `https://hansufsm.github.io/labvirtualfisica/`
