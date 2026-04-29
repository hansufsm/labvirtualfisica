const navButtons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.simulation-section');

let forceGraph = null;
let capacitanceGraph = null;

// Sistema de Conquistas
const achievements = [
    {
        id: 'first_steps',
        title: 'Primeiros Passos',
        description: 'Explorei minha primeira simulação',
        icon: '🌟',
        unlocked: false,
        condition: () => true
    },
    {
        id: 'coulomb_master',
        title: 'Mestre de Coulomb',
        description: 'Testei todas as combinações de cargas',
        icon: '⚡',
        unlocked: false,
        condition: () => coulombExplorations >= 10
    },
    {
        id: 'force_hunter',
        title: 'Caçador de Forças',
        description: 'Encontrei uma força maior que 10N',
        icon: '💪',
        unlocked: false,
        condition: () => maxForce >= 10
    },
    {
        id: 'capacitance_expert',
        title: 'Expert em Capacitância',
        description: 'Explorei a simulação de capacitância',
        icon: '🔋',
        unlocked: false,
        condition: () => capacitanceExplorations >= 5
    },
    {
        id: 'graph_lover',
        title: 'Amante de Gráficos',
        description: 'Observou os gráficos por 30 segundos',
        icon: '📈',
        unlocked: false,
        condition: () => graphViewTime >= 30
    },
    {
        id: 'formula_master',
        title: 'Mestre das Fórmulas',
        description: 'Visualizou todas as fórmulas',
        icon: '📐',
        unlocked: false,
        condition: () => formulasViewed >= 5
    },
    {
        id: 'challenge_champion',
        title: 'Campeão de Desafios',
        description: 'Resolva 5 desafios',
        icon: '🏆',
        unlocked: false,
        condition: () => challengesCompleted >= 5
    },
    {
        id: 'distance_explorer',
        title: 'Explorador de Distâncias',
        description: 'Testou todas as distâncias possíveis',
        icon: '📏',
        unlocked: false,
        condition: () => distancesTested >= 8
    }
];

let coulombExplorations = 0;
let capacitanceExplorations = 0;
let maxForce = 0;
let graphViewTime = 0;
let formulasViewed = 0;
let challengesCompleted = 0;
let distancesTested = new Set();
let graphTimer = null;

const challenges = [
    {
        id: 1,
        title: 'Força de Atração',
        description: 'Duas cargas de +5 μC e -3 μC estão separadas por 5m. Calcule a força entre elas.',
        difficulty: 'easy',
        hint: 'Use F = k × |q₁| × |q₂| / r² com k = 8.99 × 10⁹',
        answer: 0.0054,
        tolerance: 0.001,
        unit: 'N'
    },
    {
        id: 2,
        title: 'Distância Crítica',
        description: 'Qual distância duas cargas de +10 μC devem estar para exercer uma força de 1N?',
        difficulty: 'medium',
        hint: 'Isole r na fórmula: r = √(k × q₁ × q₂ / F)',
        answer: 0.948,
        tolerance: 0.05,
        unit: 'm'
    },
    {
        id: 3,
        title: 'Capacitância Calculada',
        description: 'Um capacitor com área de 8 m² e distância de 2mm. Qual a capacitância em pF?',
        difficulty: 'medium',
        hint: 'C = ε₀ × A / d, onde ε₀ = 8.854 × 10⁻¹² F/m',
        answer: 35416,
        tolerance: 100,
        unit: 'pF'
    },
    {
        id: 4,
        title: 'Energia Armazenada',
        description: 'Um capacitor de 100pF carregado a 50V. Qual energia armazenada em μJ?',
        difficulty: 'hard',
        hint: 'U = ½ × C × V²',
        answer: 0.125,
        tolerance: 0.01,
        unit: 'μJ'
    },
    {
        id: 5,
        title: 'Força Repulsiva',
        description: 'Duas cargas iguais de +8 μC se repelem com força de 2N. Qual a distância?',
        difficulty: 'hard',
        hint: 'r = √(k × q² / F)',
        answer: 0.537,
        tolerance: 0.05,
        unit: 'm'
    }
];

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const simulation = btn.dataset.simulation;

        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${simulation}-simulation`) {
                section.classList.add('active');
            }
        });

        if (simulation === 'coulomb') {
            stopGraphTimer();
            initCoulomb();
        } else if (simulation === 'capacitance') {
            stopGraphTimer();
            initCapacitance();
        } else if (simulation === 'achievements') {
            stopGraphTimer();
            renderAchievements();
        } else if (simulation === 'challenges') {
            stopGraphTimer();
            renderChallenges();
        } else if (simulation === 'ohm') {
            stopGraphTimer();
            initOhm();
        } else if (simulation === 'resistivity') {
            stopGraphTimer();
            initResistivity();
        }
    });
});

// ============ LEI DE COULOMB ============
const coulombCanvas = document.getElementById('coulombCanvas');
const coulombCtx = coulombCanvas.getContext('2d');

const charge1Slider = document.getElementById('charge1');
const charge2Slider = document.getElementById('charge2');
const distanceSlider = document.getElementById('distance');

const charge1Value = document.getElementById('charge1Value');
const charge2Value = document.getElementById('charge2Value');
const distanceValue = document.getElementById('distanceValue');

const forceResult = document.getElementById('forceResult');
const forceType = document.getElementById('forceType');
const forceDescription = document.getElementById('forceDescription');
const coulombFormula = document.getElementById('coulombFormula');
const chargeIndicator = document.getElementById('chargeIndicator');

const K = 8.99e9;
let coulombParticles = [];
let coulombAnimationId;

function resizeCoulombCanvas() {
    const rect = coulombCanvas.parentElement.getBoundingClientRect();
    coulombCanvas.width = rect.width - 64;
    coulombCanvas.height = 400;
}

class CoulombParticle {
    constructor(x, y, charge) {
        this.x = x;
        this.y = y;
        this.charge = charge;
        this.radius = 40;
    }

    draw() {
        const gradient = coulombCtx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );

        if (this.charge > 0) {
            gradient.addColorStop(0, 'rgba(0, 217, 255, 1)');
            gradient.addColorStop(0.3, 'rgba(0, 217, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 217, 255, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 0, 110, 1)');
            gradient.addColorStop(0.3, 'rgba(255, 0, 110, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 0, 110, 0)');
        }

        coulombCtx.beginPath();
        coulombCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        coulombCtx.fillStyle = gradient;
        coulombCtx.fill();

        coulombCtx.beginPath();
        coulombCtx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        coulombCtx.fillStyle = this.charge > 0 ? '#00d9ff' : '#ff006e';
        coulombCtx.fill();
        coulombCtx.shadowColor = this.charge > 0 ? '#00d9ff' : '#ff006e';
        coulombCtx.shadowBlur = 30;
        coulombCtx.fill();
        coulombCtx.shadowBlur = 0;

        const sign = this.charge > 0 ? '+' : '-';
        const value = Math.abs(this.charge);
        coulombCtx.fillStyle = '#0f0f1a';
        coulombCtx.font = 'bold 16px Inter';
        coulombCtx.textAlign = 'center';
        coulombCtx.textBaseline = 'middle';
        coulombCtx.fillText(`${sign}${value}`, this.x, this.y);

        this.drawFieldLines();
    }

    drawFieldLines() {
        const numLines = 12;
        const lineLength = 80;

        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const direction = this.charge > 0 ? 1 : -1;

            const startX = this.x + Math.cos(angle) * 25;
            const startY = this.y + Math.sin(angle) * 25;
            const endX = this.x + Math.cos(angle) * (25 + lineLength * direction);
            const endY = this.y + Math.sin(angle) * (25 + lineLength * direction);

            coulombCtx.beginPath();
            coulombCtx.moveTo(startX, startY);
            coulombCtx.lineTo(endX, endY);
            coulombCtx.strokeStyle = this.charge > 0 ? 'rgba(0, 217, 255, 0.4)' : 'rgba(255, 0, 110, 0.4)';
            coulombCtx.lineWidth = 2;
            coulombCtx.stroke();

            if (this.charge > 0) {
                const arrowX = this.x + Math.cos(angle) * 90;
                const arrowY = this.y + Math.sin(angle) * 90;
                this.drawArrow(arrowX, arrowY, angle);
            } else {
                const arrowX = this.x + Math.cos(angle) * 60;
                const arrowY = this.y + Math.sin(angle) * 60;
                this.drawArrow(arrowX, arrowY, angle + Math.PI);
            }
        }
    }

    drawArrow(x, y, angle) {
        const arrowSize = 8;
        coulombCtx.save();
        coulombCtx.translate(x, y);
        coulombCtx.rotate(angle);

        coulombCtx.beginPath();
        coulombCtx.moveTo(-arrowSize, -arrowSize / 2);
        coulombCtx.lineTo(0, 0);
        coulombCtx.lineTo(-arrowSize, arrowSize / 2);
        coulombCtx.fillStyle = this.charge > 0 ? 'rgba(0, 217, 255, 0.6)' : 'rgba(255, 0, 110, 0.6)';
        coulombCtx.fill();

        coulombCtx.restore();
    }
}

function createCoulombParticles() {
    const distance = parseFloat(distanceSlider.value);
    const centerX = coulombCanvas.width / 2;
    const centerY = coulombCanvas.height / 2;
    const spacing = (distance / 10) * 60;

    coulombParticles = [
        new CoulombParticle(centerX - spacing / 2, centerY, parseFloat(charge1Slider.value)),
        new CoulombParticle(centerX + spacing / 2, centerY, parseFloat(charge2Slider.value))
    ];
}

function drawCoulombForceVectors() {
    const q1 = parseFloat(charge1Slider.value);
    const q2 = parseFloat(charge2Slider.value);
    const r = parseFloat(distanceSlider.value);

    const force = Math.abs((K * q1 * q2 * 1e-12) / (r * r));

    if (force > 0.01) {
        const vectorLength = Math.min(force * 15, 150);
        const direction = q1 * q2 > 0 ? -1 : 1;

        coulombParticles.forEach((p, i) => {
            const angle = i === 0 ? 0 : Math.PI;
            const arrowDir = i === 0 ? direction : -direction;

            coulombCtx.beginPath();
            coulombCtx.moveTo(p.x + Math.cos(angle) * 30, p.y);
            coulombCtx.lineTo(
                p.x + Math.cos(angle) * (30 + vectorLength * arrowDir),
                p.y
            );
            coulombCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            coulombCtx.lineWidth = 4;
            coulombCtx.setLineDash([5, 5]);
            coulombCtx.stroke();
            coulombCtx.setLineDash([]);

            const arrowX = p.x + Math.cos(angle) * (30 + vectorLength * arrowDir);
            const arrowY = p.y;
            const arrowSize = 12;

            coulombCtx.save();
            coulombCtx.translate(arrowX, arrowY);
            coulombCtx.rotate(angle * arrowDir);

            coulombCtx.beginPath();
            coulombCtx.moveTo(arrowSize, -arrowSize / 1.5);
            coulombCtx.lineTo(0, 0);
            coulombCtx.lineTo(arrowSize, arrowSize / 1.5);
            coulombCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            coulombCtx.fill();

            coulombCtx.restore();
        });
    }
}

function drawCoulombGrid() {
    coulombCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    coulombCtx.lineWidth = 1;

    const gridSize = 40;
    for (let x = 0; x < coulombCanvas.width; x += gridSize) {
        coulombCtx.beginPath();
        coulombCtx.moveTo(x, 0);
        coulombCtx.lineTo(x, coulombCanvas.height);
        coulombCtx.stroke();
    }

    for (let y = 0; y < coulombCanvas.height; y += gridSize) {
        coulombCtx.beginPath();
        coulombCtx.moveTo(0, y);
        coulombCtx.lineTo(coulombCanvas.width, y);
        coulombCtx.stroke();
    }
}

function drawCoulombDistanceIndicator() {
    const distance = parseFloat(distanceSlider.value);
    const centerY = coulombCanvas.height - 60;
    const spacing = (distance / 10) * 60;
    const startX = coulombCanvas.width / 2 - spacing / 2;
    const endX = coulombCanvas.width / 2 + spacing / 2;

    coulombCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    coulombCtx.lineWidth = 2;
    coulombCtx.beginPath();
    coulombCtx.moveTo(startX, centerY);
    coulombCtx.lineTo(endX, centerY);
    coulombCtx.stroke();

    coulombCtx.beginPath();
    coulombCtx.moveTo(startX, centerY - 10);
    coulombCtx.lineTo(startX, centerY + 10);
    coulombCtx.stroke();

    coulombCtx.beginPath();
    coulombCtx.moveTo(endX, centerY - 10);
    coulombCtx.lineTo(endX, centerY + 10);
    coulombCtx.stroke();

    coulombCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    coulombCtx.font = '14px Inter';
    coulombCtx.textAlign = 'center';
    coulombCtx.fillText(`r = ${distance.toFixed(1)} m`, coulombCanvas.width / 2, centerY + 35);
}

function calculateCoulombForce() {
    const q1 = parseFloat(charge1Slider.value);
    const q2 = parseFloat(charge2Slider.value);
    const r = parseFloat(distanceSlider.value);

    const force = (K * q1 * q2 * 1e-12) / (r * r);
    return force;
}

function updateCoulombFormula() {
    const q1 = parseFloat(charge1Slider.value);
    const q2 = parseFloat(charge2Slider.value);
    const r = parseFloat(distanceSlider.value);
    const force = Math.abs(calculateCoulombForce());

    katex.render(`
        F = k \\frac{|q_1| \\cdot |q_2|}{r^2} = 8.99 \\times 10^9 \\cdot \\frac{|${q1}| \\cdot |${q2}|}{${r}^2} = \\textbf{${force.toFixed(3)}\\,N}
    `, coulombFormula, {
        throwOnError: false,
        displayMode: true
    });
}

function updateForceGraph() {
    const q1 = parseFloat(charge1Slider.value);
    const q2 = parseFloat(charge2Slider.value);
    const currentR = parseFloat(distanceSlider.value);

    const distances = [];
    const forces = [];

    for (let r = 2; r <= 10; r += 0.5) {
        const force = Math.abs((K * q1 * q2 * 1e-12) / (r * r));
        distances.push(r);
        forces.push(force);
    }

    const ctx = document.getElementById('forceGraph').getContext('2d');

    if (forceGraph) {
        forceGraph.destroy();
    }

    startGraphTimer();

    forceGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances.map(d => d + 'm'),
            datasets: [{
                label: 'Força (N)',
                data: forces,
                borderColor: q1 * q2 > 0 ? '#00d9ff' : '#ff006e',
                backgroundColor: q1 * q2 > 0 ? 'rgba(0, 217, 255, 0.1)' : 'rgba(255, 0, 110, 0.1)',
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: q1 * q2 > 0 ? '#00d9ff' : '#ff006e',
                borderWidth: 2
            }]
        },
        plugins: {
            tooltip: {
                callbacks: {
                    afterBody: function(context) {
                        // Tocar som ao passar hover nos pontos
                        if (window.audioSystem) {
                            window.audioSystem.playGraphPointHover(context.parsed.y);
                        }
                        return '';
                    }
                }
            }
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `F = ${context.parsed.y.toFixed(4)} N`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a0a0b0'
                    },
                    title: {
                        display: true,
                        text: 'Distância (m)',
                        color: '#a0a0b0'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a0a0b0'
                    },
                    title: {
                        display: true,
                        text: 'Força (N)',
                        color: '#a0a0b0'
                    }
                }
            }
        }
    });
}

function updateCoulombDisplay() {
    const q1 = parseFloat(charge1Slider.value);
    const q2 = parseFloat(charge2Slider.value);
    const r = parseFloat(distanceSlider.value);

    const force = calculateCoulombForce();

    charge1Value.textContent = `${q1 >= 0 ? '+' : ''}${q1} μC`;
    charge1Value.style.color = q1 >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';

    charge2Value.textContent = `${q2 >= 0 ? '+' : ''}${q2} μC`;
    charge2Value.style.color = q2 >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';

    distanceValue.textContent = `${r.toFixed(1)} m`;

    forceResult.textContent = `${Math.abs(force).toFixed(3)} N`;

    if (q1 * q2 > 0) {
        forceType.textContent = 'Repulsão';
        forceType.style.color = 'var(--positive-color)';
        forceDescription.textContent = 'Cargas de mesmo sinal se repelem';
    } else if (q1 * q2 < 0) {
        forceType.textContent = 'Atração';
        forceType.style.color = 'var(--negative-color)';
        forceDescription.textContent = 'Cargas de sinais opostos se atraem';
    } else {
        forceType.textContent = 'Nenhuma';
        forceType.style.color = 'var(--text-secondary)';
        forceDescription.textContent = 'Uma das cargas é zero';
    }

    updateCoulombFormula();
    updateForceGraph();

    const indicatorText = q1 * q2 > 0 ? '↔️ Repulsão' : q1 * q2 < 0 ? '↔️ Atração' : '⏺️ Neutro';
    const indicatorColor = q1 * q2 > 0 ? 'var(--positive-color)' : q1 * q2 < 0 ? 'var(--negative-color)' : 'var(--text-secondary)';
    chargeIndicator.innerHTML = `<span style="color: ${indicatorColor}">${indicatorText}</span>`;

    // Audio emocional
    if (window.audioSystem) {
        window.audioSystem.playChargeInteraction(q1, q2, r, force);
    }

    trackCoulombExploration();
    trackMaxForce(force);
    trackDistance(r);
}

function animateCoulomb() {
    coulombCtx.clearRect(0, 0, coulombCanvas.width, coulombCanvas.height);

    drawCoulombGrid();
    coulombParticles.forEach(particle => particle.draw());
    drawCoulombForceVectors();
    drawCoulombDistanceIndicator();

    coulombAnimationId = requestAnimationFrame(animateCoulomb);
}

function initCoulomb() {
    resizeCoulombCanvas();
    createCoulombParticles();
    updateCoulombDisplay();
    animateCoulomb();
}

// ============ CAPACITÂNCIA ============
const capacitanceCanvas = document.getElementById('capacitanceCanvas');
const capacitanceCtx = capacitanceCanvas.getContext('2d');

const plateAreaSlider = document.getElementById('plateArea');
const plateDistanceSlider = document.getElementById('plateDistance');
const voltageSlider = document.getElementById('voltage');

const plateAreaValue = document.getElementById('plateAreaValue');
const plateDistanceValue = document.getElementById('plateDistanceValue');
const voltageValue = document.getElementById('voltageValue');

const capacitanceResult = document.getElementById('capacitanceResult');
const chargeStored = document.getElementById('chargeStored');
const energyStored = document.getElementById('energyStored');
const capacitanceFormula = document.getElementById('capacitanceFormula');
const capacitanceIndicator = document.getElementById('capacitanceIndicator');

const EPSILON_0 = 8.854e-12;
let capacitanceAnimationId;
let fieldParticles = [];

function resizeCapacitanceCanvas() {
    const rect = capacitanceCanvas.parentElement.getBoundingClientRect();
    capacitanceCanvas.width = rect.width - 64;
    capacitanceCanvas.height = 400;
}

class FieldParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 2 + Math.random() * 2;
        this.alpha = 0.3 + Math.random() * 0.4;
    }

    update(plateDistance) {
        this.y += this.speed * (plateDistance / 3);
        if (this.y > capacitanceCanvas.height - 100) {
            this.y = 100;
        }
    }

    draw() {
        capacitanceCtx.beginPath();
        capacitanceCtx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        capacitanceCtx.fillStyle = `rgba(79, 172, 254, ${this.alpha})`;
        capacitanceCtx.fill();
    }
}

function createFieldParticles() {
    fieldParticles = [];
    const numParticles = 30;
    for (let i = 0; i < numParticles; i++) {
        const x = capacitanceCanvas.width / 2 - 100 + Math.random() * 200;
        const y = 100 + Math.random() * 200;
        fieldParticles.push(new FieldParticle(x, y));
    }
}

function drawCapacitorPlates(area, distance) {
    const centerX = capacitanceCanvas.width / 2;
    const plateWidth = 60 + area * 8;
    const plateHeight = 12;
    const plateGap = 30 + distance * 8;

    const topPlateY = capacitanceCanvas.height / 2 - plateGap / 2;
    const bottomPlateY = capacitanceCanvas.height / 2 + plateGap / 2;

    const topGradient = capacitanceCtx.createLinearGradient(
        centerX - plateWidth / 2, topPlateY,
        centerX + plateWidth / 2, topPlateY
    );
    topGradient.addColorStop(0, '#4facfe');
    topGradient.addColorStop(1, '#00f2fe');

    capacitanceCtx.fillStyle = topGradient;
    capacitanceCtx.shadowColor = '#4facfe';
    capacitanceCtx.shadowBlur = 20;
    capacitanceCtx.fillRect(centerX - plateWidth / 2, topPlateY, plateWidth, plateHeight);
    capacitanceCtx.shadowBlur = 0;

    const bottomGradient = capacitanceCtx.createLinearGradient(
        centerX - plateWidth / 2, bottomPlateY,
        centerX + plateWidth / 2, bottomPlateY
    );
    bottomGradient.addColorStop(0, '#f093fb');
    bottomGradient.addColorStop(1, '#f5576c');

    capacitanceCtx.fillStyle = bottomGradient;
    capacitanceCtx.shadowColor = '#f093fb';
    capacitanceCtx.shadowBlur = 20;
    capacitanceCtx.fillRect(centerX - plateWidth / 2, bottomPlateY, plateWidth, plateHeight);
    capacitanceCtx.shadowBlur = 0;

    capacitanceCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    capacitanceCtx.font = 'bold 14px Inter';
    capacitanceCtx.textAlign = 'center';
    capacitanceCtx.fillText('+', centerX - plateWidth / 2 - 20, topPlateY + plateHeight / 2);
    capacitanceCtx.fillText('-', centerX - plateWidth / 2 - 20, bottomPlateY + plateHeight / 2);

    capacitanceCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    capacitanceCtx.font = '12px Inter';
    capacitanceCtx.textAlign = 'center';
    capacitanceCtx.fillText('Placa Positiva', centerX, topPlateY - 15);
    capacitanceCtx.fillText('Placa Negativa', centerX, bottomPlateY + plateHeight + 15);

    return { topPlateY, bottomPlateY, plateWidth, plateGap };
}

function drawElectricFieldLines(plateWidth, plateGap, topPlateY, bottomPlateY) {
    const numLines = 8;
    const spacing = plateWidth / (numLines + 1);

    for (let i = 1; i <= numLines; i++) {
        const x = capacitanceCanvas.width / 2 - plateWidth / 2 + spacing * i;

        capacitanceCtx.beginPath();
        capacitanceCtx.moveTo(x, topPlateY + plateHeight);
        capacitanceCtx.lineTo(x, bottomPlateY);
        capacitanceCtx.strokeStyle = 'rgba(79, 172, 254, 0.3)';
        capacitanceCtx.lineWidth = 2;
        capacitanceCtx.setLineDash([5, 5]);
        capacitanceCtx.stroke();
        capacitanceCtx.setLineDash([]);

        const arrowY = (topPlateY + bottomPlateY) / 2;
        drawFieldArrow(x, arrowY);
    }
}

function drawFieldArrow(x, y) {
    const arrowSize = 8;
    capacitanceCtx.save();
    capacitanceCtx.translate(x, y);

    capacitanceCtx.beginPath();
    capacitanceCtx.moveTo(-arrowSize / 2, -arrowSize);
    capacitanceCtx.lineTo(0, 0);
    capacitanceCtx.lineTo(arrowSize / 2, -arrowSize);
    capacitanceCtx.fillStyle = 'rgba(79, 172, 254, 0.6)';
    capacitanceCtx.fill();

    capacitanceCtx.restore();
}

function drawCapacitorLabels(area, distance, plateWidth, plateGap) {
    const centerX = capacitanceCanvas.width / 2;

    capacitanceCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    capacitanceCtx.lineWidth = 1;

    const labelY = capacitanceCanvas.height - 70;
    capacitanceCtx.beginPath();
    capacitanceCtx.moveTo(centerX - plateWidth / 2 - 30, capacitanceCanvas.height / 2 - plateGap / 2);
    capacitanceCtx.lineTo(centerX - plateWidth / 2 - 30, capacitanceCanvas.height / 2 + plateGap / 2);
    capacitanceCtx.stroke();

    capacitanceCtx.beginPath();
    capacitanceCtx.moveTo(centerX - plateWidth / 2 - 35, capacitanceCanvas.height / 2 - plateGap / 2);
    capacitanceCtx.lineTo(centerX - plateWidth / 2 - 25, capacitanceCanvas.height / 2 - plateGap / 2);
    capacitanceCtx.stroke();

    capacitanceCtx.beginPath();
    capacitanceCtx.moveTo(centerX - plateWidth / 2 - 35, capacitanceCanvas.height / 2 + plateGap / 2);
    capacitanceCtx.lineTo(centerX - plateWidth / 2 - 25, capacitanceCanvas.height / 2 + plateGap / 2);
    capacitanceCtx.stroke();

    capacitanceCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    capacitanceCtx.font = '13px Inter';
    capacitanceCtx.textAlign = 'center';
    capacitanceCtx.fillText(`d = ${distance.toFixed(1)} mm`, centerX - plateWidth / 2 - 50, labelY);

    const widthLabelY = capacitanceCanvas.height / 2 + plateGap / 2 + 40;
    capacitanceCtx.beginPath();
    capacitanceCtx.moveTo(centerX - plateWidth / 2, widthLabelY - 10);
    capacitanceCtx.lineTo(centerX + plateWidth / 2, widthLabelY - 10);
    capacitanceCtx.stroke();

    capacitanceCtx.beginPath();
    capacitanceCtx.moveTo(centerX - plateWidth / 2, widthLabelY - 5);
    capacitanceCtx.lineTo(centerX - plateWidth / 2, widthLabelY - 15);
    capacitanceCtx.stroke();

    capacitanceCtx.beginPath();
    capacitanceCtx.moveTo(centerX + plateWidth / 2, widthLabelY - 5);
    capacitanceCtx.lineTo(centerX + plateWidth / 2, widthLabelY - 15);
    capacitanceCtx.stroke();

    capacitanceCtx.fillText(`A = ${area.toFixed(1)} m²`, centerX, widthLabelY + 15);
}

function calculateCapacitance() {
    const area = parseFloat(plateAreaSlider.value);
    const distance = parseFloat(plateDistanceSlider.value) * 1e-3;
    const voltage = parseFloat(voltageSlider.value);

    const capacitance = (EPSILON_0 * area) / distance;
    const charge = capacitance * voltage;
    const energy = 0.5 * capacitance * voltage * voltage;

    return { capacitance, charge, energy };
}

function updateCapacitanceFormula() {
    const area = parseFloat(plateAreaSlider.value);
    const distance = parseFloat(plateDistanceSlider.value) * 1e-3;
    const voltage = parseFloat(voltageSlider.value);
    const { capacitance, charge, energy } = calculateCapacitance();

    katex.render(`
        C = \\varepsilon_0 \\frac{A}{d} = 8.854 \\times 10^{-12} \\cdot \\frac{${area}}{${(distance * 1000).toFixed(1)} \\times 10^{-3}} = \\textbf{${(capacitance * 1e12).toFixed(2)}\\,pF}
        
        Q = C \\cdot V = ${(capacitance * 1e12).toFixed(2)} \\times 10^{-12} \\cdot ${voltage} = \\textbf{${(charge * 1e9).toFixed(2)}\\,nC}
        
        U = \\frac{1}{2}CV^2 = \\textbf{${(energy * 1e6).toFixed(2)}\\,\\mu J}
    `, capacitanceFormula, {
        throwOnError: false,
        displayMode: true
    });
}

function updateCapacitanceGraph() {
    const area = parseFloat(plateAreaSlider.value);
    const currentD = parseFloat(plateDistanceSlider.value);

    const distances = [];
    const capacitances = [];

    for (let d = 1; d <= 8; d += 0.5) {
        const distanceM = d * 1e-3;
        const c = (EPSILON_0 * area) / distanceM;
        distances.push(d);
        capacitances.push(c * 1e12);
    }

    const ctx = document.getElementById('capacitanceGraph').getContext('2d');

    if (capacitanceGraph) {
        capacitanceGraph.destroy();
    }

    startGraphTimer();

    capacitanceGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances.map(d => d + 'mm'),
            datasets: [{
                label: 'Capacitância (pF)',
                data: capacitances,
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#4facfe',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `C = ${context.parsed.y.toFixed(2)} pF`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a0a0b0'
                    },
                    title: {
                        display: true,
                        text: 'Distância (mm)',
                        color: '#a0a0b0'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a0a0b0'
                    },
                    title: {
                        display: true,
                        text: 'Capacitância (pF)',
                        color: '#a0a0b0'
                    }
                }
            }
        }
    });
}

function updateCapacitanceDisplay() {
    const area = parseFloat(plateAreaSlider.value);
    const distance = parseFloat(plateDistanceSlider.value);
    const voltage = parseFloat(voltageSlider.value);

    plateAreaValue.textContent = `${area.toFixed(1)} m²`;
    plateDistanceValue.textContent = `${distance.toFixed(1)} mm`;
    voltageValue.textContent = `${voltage} V`;

    const { capacitance, charge, energy } = calculateCapacitance();

    if (capacitance < 1e-12) {
        capacitanceResult.textContent = `${(capacitance * 1e12).toFixed(2)} pF`;
    } else if (capacitance < 1e-9) {
        capacitanceResult.textContent = `${(capacitance * 1e12).toFixed(2)} pF`;
    } else {
        capacitanceResult.textContent = `${(capacitance * 1e9).toFixed(2)} nF`;
    }

    if (charge < 1e-9) {
        chargeStored.textContent = `${(charge * 1e12).toFixed(2)} pC`;
    } else {
        chargeStored.textContent = `${(charge * 1e9).toFixed(2)} nC`;
    }

    if (energy < 1e-6) {
        energyStored.textContent = `${(energy * 1e9).toFixed(2)} nJ`;
    } else {
        energyStored.textContent = `${(energy * 1e6).toFixed(2)} μJ`;
    }

    updateCapacitanceFormula();
    updateCapacitanceGraph();

    const indicatorText = `⚡ V = ${voltage}V | C = ${(capacitance * 1e12).toFixed(2)} pF`;
    capacitanceIndicator.innerHTML = `<span style="color: var(--accent-color)">${indicatorText}</span>`;

    // Audio emocional
    if (window.audioSystem) {
        window.audioSystem.playCapacitanceChange(capacitance, voltage, energy);
    }

    trackCapacitanceExploration();
}

function animateCapacitance() {
    capacitanceCtx.clearRect(0, 0, capacitanceCanvas.width, capacitanceCanvas.height);

    const area = parseFloat(plateAreaSlider.value);
    const distance = parseFloat(plateDistanceSlider.value);

    capacitanceCtx.fillStyle = 'rgba(79, 172, 254, 0.05)';
    capacitanceCtx.fillRect(0, 0, capacitanceCanvas.width, capacitanceCanvas.height);

    const { topPlateY, bottomPlateY, plateWidth, plateGap } = drawCapacitorPlates(area, distance);

    drawElectricFieldLines(plateWidth, plateGap, topPlateY, bottomPlateY);

    fieldParticles.forEach(particle => {
        particle.update(distance);
        particle.draw();
    });

    drawCapacitorLabels(area, distance, plateWidth, plateGap);

    capacitanceAnimationId = requestAnimationFrame(animateCapacitance);
}

function initCapacitance() {
    resizeCapacitanceCanvas();
    createFieldParticles();
    updateCapacitanceDisplay();
    animateCapacitance();
}

// Event Listeners
charge1Slider.addEventListener('input', () => {
    createCoulombParticles();
    updateCoulombDisplay();
});

charge2Slider.addEventListener('input', () => {
    createCoulombParticles();
    updateCoulombDisplay();
});

distanceSlider.addEventListener('input', () => {
    createCoulombParticles();
    updateCoulombDisplay();
});

plateAreaSlider.addEventListener('input', () => {
    updateCapacitanceDisplay();
});

plateDistanceSlider.addEventListener('input', () => {
    updateCapacitanceDisplay();
});

voltageSlider.addEventListener('input', () => {
    updateCapacitanceDisplay();
});

window.addEventListener('resize', () => {
    resizeCoulombCanvas();
    resizeCapacitanceCanvas();
    createCoulombParticles();
    createFieldParticles();
    updateForceGraph();
    updateCapacitanceGraph();
});

window.addEventListener('load', () => {
    initCoulomb();
    initAchievements();
    initChallenges();
    checkAchievements();
});

// ============ SISTEMA DE CONQUISTAS ============
function initAchievements() {
    renderAchievements();
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = '';

    achievements.forEach(achievement => {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <span class="achievement-icon">${achievement.icon}</span>
            <h4 class="achievement-title">${achievement.title}</h4>
            <p class="achievement-description">${achievement.description}</p>
            <div class="achievement-progress">
                <span>${achievement.unlocked ? '✅ Desbloqueado!' : '🔒 Bloqueado'}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function checkAchievements() {
    let changed = false;

    achievements.forEach(achievement => {
        if (!achievement.unlocked && achievement.condition()) {
            achievement.unlocked = true;
            changed = true;
            showAchievementNotification(achievement);
            createParticleEffect();
        }
    });

    if (changed) {
        renderAchievements();
        saveProgress();
    }
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <span class="achievement-icon">${achievement.icon}</span>
        <div>
            <strong>🏆 Conquista Desbloqueada!</strong>
            <p>${achievement.title}</p>
        </div>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
        padding: 1.5rem 2rem;
        border-radius: 15px;
        display: flex;
        gap: 1rem;
        align-items: center;
        z-index: 10000;
        animation: slideIn 0.5s ease;
        box-shadow: 0 10px 40px rgba(246, 211, 101, 0.4);
    `;

    document.body.appendChild(notification);

    // Tocar som de conquista
    if (window.audioSystem) {
        window.audioSystem.playAchievementUnlocked(achievement);
    }

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease forwards';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function createParticleEffect() {
    const colors = ['#f6d365', '#fda085', '#667eea', '#764ba2'];
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle-effect';
        particle.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            left: ${Math.random() * 100}vw;
            top: ${Math.random() * 100}vh;
            z-index: 9999;
        `;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

function saveProgress() {
    localStorage.setItem('physicsLabProgress', JSON.stringify({
        achievements: achievements.map(a => a.id).filter(id => 
            achievements.find(a => a.id === id).unlocked
        ),
        challengesCompleted
    }));
}

function loadProgress() {
    const saved = localStorage.getItem('physicsLabProgress');
    if (saved) {
        const data = JSON.parse(saved);
        data.achievements.forEach(id => {
            const achievement = achievements.find(a => a.id === id);
            if (achievement) achievement.unlocked = true;
        });
        challengesCompleted = data.challengesCompleted || 0;
    }
}

// ============ SISTEMA DE DESAFIOS ============
function initChallenges() {
    renderChallenges();
}

function renderChallenges() {
    const container = document.getElementById('challengesContainer');
    container.innerHTML = '';

    challenges.forEach(challenge => {
        const card = document.createElement('div');
        card.className = 'challenge-card';
        card.innerHTML = `
            <div class="challenge-header">
                <h3 class="challenge-title">${challenge.title}</h3>
                <span class="challenge-difficulty ${challenge.difficulty}">${getDifficultyLabel(challenge.difficulty)}</span>
            </div>
            <p class="challenge-description">${challenge.description}</p>
            <div class="challenge-hint">💡 Dica: ${challenge.hint}</div>
            <div class="challenge-input">
                <input type="number" step="any" placeholder="Sua resposta..." id="challenge-${challenge.id}-input">
                <span class="challenge-unit">${challenge.unit}</span>
                <button class="challenge-btn" onclick="checkChallenge(${challenge.id})">Verificar</button>
            </div>
            <div class="challenge-feedback" id="challenge-${challenge.id}-feedback"></div>
        `;
        container.appendChild(card);
    });
}

function getDifficultyLabel(difficulty) {
    const labels = {
        easy: '🟢 Fácil',
        medium: '🟡 Médio',
        hard: '🔴 Difícil'
    };
    return labels[difficulty];
}

function checkChallenge(challengeId) {
    const challenge = challenges.find(c => c.id === challengeId);
    const input = document.getElementById(`challenge-${challengeId}-input`);
    const feedback = document.getElementById(`challenge-${challengeId}-feedback`);
    const userAnswer = parseFloat(input.value);

    if (isNaN(userAnswer)) {
        feedback.className = 'challenge-feedback incorrect';
        feedback.textContent = '⚠️ Por favor, insira um valor numérico.';
        if (window.audioSystem) {
            window.audioSystem.playChallengeIncorrect();
        }
        return;
    }

    const isCorrect = Math.abs(userAnswer - challenge.answer) <= challenge.tolerance;

    if (isCorrect) {
        feedback.className = 'challenge-feedback correct';
        feedback.textContent = '🎉 Correto! Muito bem!';
        challengesCompleted++;
        checkAchievements();
        createParticleEffect();
        if (window.audioSystem) {
            window.audioSystem.playChallengeCorrect();
        }
    } else {
        feedback.className = 'challenge-feedback incorrect';
        feedback.textContent = `❌ Incorreto. Dica: revise os cálculos e tente novamente!`;
        if (window.audioSystem) {
            window.audioSystem.playChallengeIncorrect();
        }
    }
}

// ============ TRACKING DE ATIVIDADES ============
function trackCoulombExploration() {
    coulombExplorations++;
    checkAchievements();
}

function trackCapacitanceExploration() {
    capacitanceExplorations++;
    checkAchievements();
}

function trackMaxForce(force) {
    if (Math.abs(force) > maxForce) {
        maxForce = Math.abs(force);
        checkAchievements();
    }
}

function trackDistance(distance) {
    distancesTested.add(Math.round(distance * 10) / 10);
    if (distancesTested.size >= 8) {
        checkAchievements();
    }
}

function trackFormulaView() {
    formulasViewed++;
    checkAchievements();
}

function startGraphTimer() {
    if (!graphTimer) {
        graphTimer = setInterval(() => {
            graphViewTime++;
            checkAchievements();
        }, 1000);
    }
}

function stopGraphTimer() {
    if (graphTimer) {
        clearInterval(graphTimer);
        graphTimer = null;
    }
}

// Adicionar CSS para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    .achievement-notification {
        font-family: 'Inter', sans-serif;
        color: #0f0f1a;
    }
    .achievement-notification strong {
        display: block;
        font-size: 1.1rem;
        margin-bottom: 0.25rem;
    }
    .achievement-notification p {
        margin: 0;
        font-size: 0.95rem;
    }
    .challenge-unit {
        color: var(--text-secondary);
        font-weight: 600;
    }
`;
document.head.appendChild(style);

loadProgress();

// Tutorial Modal para primeiros usuários
function showTutorialModal() {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    
    if (!hasSeenTutorial) {
        const modal = document.createElement('div');
        modal.className = 'tutorial-overlay active';
        modal.id = 'tutorialModal';
        modal.innerHTML = `
            <div class="tutorial-modal">
                <h3>🎓 Bem-vindo ao Laboratório Virtual!</h3>
                <p>
                    Explore simulações interativas de física, desbloqueie conquistas e resolva desafios!
                    <br><br>
                    ⚡ <strong>Lei de Coulomb</strong> - Força entre cargas elétricas<br>
                    🔋 <strong>Capacitância</strong> - Capacitores de placas paralelas<br>
                    🏆 <strong>Conquistas</strong> - Desbloqueie achievements<br>
                    🎯 <strong>Desafios</strong> - Teste seu conhecimento
                </p>
                <div class="tutorial-buttons">
                    <button class="tutorial-btn secondary" onclick="closeTutorial()">Ver depois</button>
                    <button class="tutorial-btn primary" onclick="startExploring()">Começar a explorar!</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function closeTutorial() {
    localStorage.setItem('hasSeenTutorial', 'true');
    const modal = document.getElementById('tutorialModal');
    if (modal) modal.remove();
}

function startExploring() {
    localStorage.setItem('hasSeenTutorial', 'true');
    const modal = document.getElementById('tutorialModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

window.closeTutorial = closeTutorial;
window.startExploring = startExploring;

setTimeout(showTutorialModal, 500);

// ============ LEI DE OHM ============
let ohmGraph = null;

const voltageOhmSlider = document.getElementById('voltageOhm');
const resistanceOhmSlider = document.getElementById('resistanceOhm');
const voltageOhmValue = document.getElementById('voltageOhmValue');
const resistanceOhmValue = document.getElementById('resistanceOhmValue');
const currentResult = document.getElementById('currentResult');
const ohmFormula = document.getElementById('ohmFormula');
const ohmCanvas = document.getElementById('ohmCanvas');
const ohmCtx = ohmCanvas ? ohmCanvas.getContext('2d') : null;

function resizeOhmCanvas() {
    if (!ohmCanvas) return;
    const rect = ohmCanvas.parentElement.getBoundingClientRect();
    ohmCanvas.width = rect.width - 64;
    ohmCanvas.height = 400;
}

function drawOhmCircuit() {
    if (!ohmCtx) return;
    ohmCtx.clearRect(0, 0, ohmCanvas.width, ohmCanvas.height);

    const cx = ohmCanvas.width / 2;
    const cy = ohmCanvas.height / 2;
    const V = parseFloat(voltageOhmSlider.value);
    const R = parseFloat(resistanceOhmSlider.value);
    const I = V / R;

    ohmCtx.fillStyle = 'rgba(246, 211, 101, 0.05)';
    ohmCtx.fillRect(0, 0, ohmCanvas.width, ohmCanvas.height);

    ohmCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ohmCtx.lineWidth = 3;
    ohmCtx.beginPath();
    ohmCtx.moveTo(cx - 120, cy);
    ohmCtx.lineTo(cx - 40, cy);
    ohmCtx.stroke();

    ohmCtx.fillStyle = 'rgba(246, 211, 101, 0.8)';
    ohmCtx.fillRect(cx - 40, cy - 25, 80, 50);
    ohmCtx.strokeStyle = '#f6d365';
    ohmCtx.strokeRect(cx - 40, cy - 25, 80, 50);
    ohmCtx.fillStyle = '#0f0f1a';
    ohmCtx.font = 'bold 14px Inter';
    ohmCtx.textAlign = 'center';
    ohmCtx.textBaseline = 'middle';
    ohmCtx.fillText('R', cx, cy);

    ohmCtx.beginPath();
    ohmCtx.moveTo(cx + 40, cy);
    ohmCtx.lineTo(cx + 120, cy);
    ohmCtx.stroke();

    ohmCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ohmCtx.font = 'bold 16px Inter';
    ohmCtx.fillText(`V = ${V}V`, cx, cy - 50);
    ohmCtx.fillText(`I = ${I.toFixed(3)}A`, cx, cy + 50);

    const arrowSize = 8;
    ohmCtx.save();
    ohmCtx.translate(cx + 80, cy);
    ohmCtx.beginPath();
    ohmCtx.moveTo(0, -arrowSize);
    ohmCtx.lineTo(arrowSize * 2, 0);
    ohmCtx.lineTo(0, arrowSize);
    ohmCtx.fillStyle = 'rgba(67, 233, 123, 0.8)';
    ohmCtx.fill();
    ohmCtx.restore();

    ohmCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ohmCtx.font = '12px Inter';
    ohmCtx.fillText('Corrente (I)', cx + 80, cy + 20);
}

function updateOhmFormula() {
    if (!ohmFormula) return;
    const V = parseFloat(voltageOhmSlider.value);
    const R = parseFloat(resistanceOhmSlider.value);
    const I = V / R;
    katex.render(`
        V = R \\cdot I = ${R} \\cdot ${I.toFixed(3)} = \\textbf{${V.toFixed(1)}\\,V}
        \\quad \\Rightarrow \\quad
        I = \\frac{V}{R} = \\frac{${V}}{${R}} = \\textbf{${I.toFixed(3)}\\,A}
    `, ohmFormula, { throwOnError: false, displayMode: true });
}

function updateOhmGraph() {
    if (!document.getElementById('ohmGraph')) return;
    const R = parseFloat(resistanceOhmSlider.value);
    const voltages = [];
    const currents = [];
    for (let v = 0; v <= 100; v += 5) {
        voltages.push(v);
        currents.push(v / R);
    }
    const ctx = document.getElementById('ohmGraph').getContext('2d');
    if (ohmGraph) ohmGraph.destroy();
    startGraphTimer();
    ohmGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: voltages.map(v => v + 'V'),
            datasets: [{
                label: 'Corrente (A)',
                data: currents,
                borderColor: '#f6d365',
                backgroundColor: 'rgba(246, 211, 101, 0.1)',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: '#f6d365',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `I = ${context.parsed.y.toFixed(3)} A`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#a0a0b0' },
                    title: { display: true, text: 'Tensão (V)', color: '#a0a0b0' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#a0a0b0' },
                    title: { display: true, text: 'Corrente (A)', color: '#a0a0b0' }
                }
            }
        }
    });
}

function updateOhmDisplay() {
    if (!voltageOhmValue || !resistanceOhmValue || !currentResult) return;
    const V = parseFloat(voltageOhmSlider.value);
    const R = parseFloat(resistanceOhmSlider.value);
    const I = V / R;
    voltageOhmValue.textContent = `${V} V`;
    resistanceOhmValue.textContent = `${R} Ω`;
    currentResult.textContent = `${I.toFixed(3)} A`;
    updateOhmFormula();
    updateOhmGraph();
    drawOhmCircuit();
}

function initOhm() {
    resizeOhmCanvas();
    updateOhmDisplay();
    if (ohmCanvas) {
        const animateOhm = () => {
            drawOhmCircuit();
            requestAnimationFrame(animateOhm);
        };
        animateOhm();
    }
}

voltageOhmSlider.addEventListener('input', updateOhmDisplay);
resistanceOhmSlider.addEventListener('input', updateOhmDisplay);

// ============ RESISTIVIDADE ============
let resistivityGraph = null;

const rhoNiCr = 1.10e-6;
const rhoFe = 9.71e-8;

let wires = [
    { name: 'Ni-Cr Ø 0.36mm', material: 'Ni-Cr', diameter: 0.36e-3, rho: rhoNiCr },
    { name: 'Ni-Cr Ø 0.52mm', material: 'Ni-Cr', diameter: 0.52e-3, rho: rhoNiCr },
    { name: 'Ni-Cr Ø 0.72mm', material: 'Ni-Cr', diameter: 0.72e-3, rho: rhoNiCr },
    { name: 'Fe Ø 0.56mm',    material: 'Fe',   diameter: 0.56e-3, rho: rhoFe }
];

const voltageResistivitySlider = document.getElementById('voltageResistivity');
const voltageResistivityValue = document.getElementById('voltageResistivityValue');
const diameterSlider = document.getElementById('diameterSlider');
const diameterValue = document.getElementById('diameterValue');
const maxLengthSlider = document.getElementById('maxLengthSlider');
const maxLengthValue = document.getElementById('maxLengthValue');

function getSelectedMaterial() {
    const mat = document.querySelector('input[name="material"]:checked');
    return mat && mat.value === 'Fe' ? 'Fe' : 'Ni-Cr';
}

function getEditWireIndex() {
    const el = document.querySelector('input[name="editWire"]:checked');
    return el ? parseInt(el.value) : 0;
}

function calcResistance(wire, length) {
    const A = Math.PI * (wire.diameter / 2) ** 2;
    return wire.rho * length / A;
}

function getLengths() {
    const Lmax = parseFloat(maxLengthSlider.value);
    return [Lmax * 0.2, Lmax * 0.4, Lmax * 0.6, Lmax * 0.8, Lmax];
}

function generateTable() {
    const tableDiv = document.getElementById('resistivityTable');
    if (!tableDiv) return;
    const V = parseFloat(voltageResistivitySlider.value);
    const lengths = getLengths();
    let html = '<table><thead><tr><th>Comprimento (m)</th>';
    wires.forEach(w => { html += `<th>${w.name}<br>R (Ω) / I (A)</th>`; });
    html += '</tr></thead><tbody>';
    lengths.forEach(l => {
        html += `<tr><td>${l.toFixed(2)} m</td>`;
        wires.forEach(w => {
            const R = calcResistance(w, l);
            const I = V / R;
            html += `<td>${R.toFixed(2)} Ω<br>${I.toFixed(4)} A</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    tableDiv.innerHTML = html;
}

function updateResistivityGraph() {
    if (!document.getElementById('resistivityGraph')) return;
    const ctx = document.getElementById('resistivityGraph').getContext('2d');
    if (resistivityGraph) resistivityGraph.destroy();
    startGraphTimer();

    const Lmax = parseFloat(maxLengthSlider.value);
    const graphLengths = [];
    for (let l = Lmax * 0.1; l <= Lmax; l += Lmax * 0.1) {
        graphLengths.push(l);
    }
    if (graphLengths[graphLengths.length - 1] < Lmax) graphLengths.push(Lmax);

    const colors = ['#f6d365', '#f093fb', '#00d9ff', '#43e97b'];

    resistivityGraph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: graphLengths.map(l => l.toFixed(2) + 'm'),
            datasets: wires.map((w, i) => ({
                label: w.name,
                data: graphLengths.map(l => calcResistance(w, l)),
                borderColor: colors[i],
                backgroundColor: colors[i] + '20',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: colors[i],
                borderWidth: 2
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#a0a0b0' }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: R = ${context.parsed.y.toFixed(2)} Ω`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#a0a0b0' },
                    title: { display: true, text: 'Comprimento (m)', color: '#a0a0b0' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#a0a0b0' },
                    title: { display: true, text: 'Resistência (Ω)', color: '#a0a0b0' }
                }
            }
        }
    });
}

function updateExpertAnalysis() {
    const el = document.getElementById('expertAnalysis');
    if (!el) return;
    const V = parseFloat(voltageResistivitySlider.value);
    const Lmax = parseFloat(maxLengthSlider.value);
    const mat = getSelectedMaterial();
    const rho = mat === 'Fe' ? rhoFe : rhoNiCr;
    el.innerHTML = `
        <p>A resistência de um fio é dada por <strong>R = ρ·L/A</strong>, onde ρ é a resistividade do material, L o comprimento e A = π·(d/2)² a área da seção transversal.</p>
        <p>Fios iniciais: Ni-Cr (ρ ≈ 1,10×10⁻⁶ Ω·m) com 0,36mm, 0,52mm e 0,72mm; Fe (ρ ≈ 9,71×10⁻⁸ Ω·m) com 0,56mm.</p>
        <p><strong>Por que as inclinações das retas mudam?</strong></p>
        <p>• <strong>Material:</strong> O Ni-Cr tem resistividade ≈ 11× maior que o Ferro. Com o mesmo diâmetro, o fio de Ni-Cr apresenta inclinação ≈ 11× maior.</p>
        <p>• <strong>Espessura:</strong> A área A cresce com o quadrado do diâmetro. O fio de Ni-Cr 0,36mm tem inclinação ≈ 2,1× maior que o de 0,52mm, e ≈ 4× maior que o de 0,72mm.</p>
        <p>• No gráfico R×L, a inclinação é exatamente ρ/A. Use o seletor "Fio para editar" e ajuste o material/diâmetro para ver como a reta selecionada muda no gráfico.</p>
    `;
}

function updateResistivityDisplay() {
    if (voltageResistivityValue) voltageResistivityValue.textContent = `${parseFloat(voltageResistivitySlider.value).toFixed(1)} V`;
    if (diameterValue) diameterValue.textContent = `${parseFloat(diameterSlider.value).toFixed(2)} mm`;
    if (maxLengthValue) maxLengthValue.textContent = `${parseFloat(maxLengthSlider.value).toFixed(2)} m`;

    const mat = getSelectedMaterial();
    const rho = mat === 'Fe' ? rhoFe : rhoNiCr;
    const d = parseFloat(diameterSlider.value) * 1e-3;
    const idx = getEditWireIndex();
    wires[idx] = {
        name: `${mat} Ø ${(d*1000).toFixed(2)}mm`,
        material: mat,
        diameter: d,
        rho: rho
    };

    generateTable();
    updateResistivityGraph();
    updateExpertAnalysis();
}

function initResistivity() {
    updateResistivityDisplay();
}

if (voltageResistivitySlider) voltageResistivitySlider.addEventListener('input', updateResistivityDisplay);
if (diameterSlider) diameterSlider.addEventListener('input', updateResistivityDisplay);
if (maxLengthSlider) maxLengthSlider.addEventListener('input', updateResistivityDisplay);

document.querySelectorAll('input[name="material"]').forEach(input => {
    input.addEventListener('change', updateResistivityDisplay);
});

document.querySelectorAll('input[name="editWire"]').forEach(input => {
    input.addEventListener('change', updateResistivityDisplay);
});

window.addEventListener('resize', () => {
    resizeOhmCanvas();
    if (ohmCanvas) drawOhmCircuit();
    updateOhmGraph();
    updateResistivityGraph();
});
