/* ==========================================================================
   STARRY NIGHT LUXURY WEDDING INVITATION - JAVASCRIPT ENGINE
   ========================================================================== */

'use strict';

// ==========================================================================
// 1. STARFIELD CANVAS ENGINE
// ==========================================================================

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d', { alpha: true });

/* Dedicated foreground canvas — petals always render above all page content */
const petalCanvas = document.getElementById('petal-canvas');
const petalCtx    = petalCanvas.getContext('2d', { alpha: true });

/* GPU-layer hints — promotes canvases to their own compositor layer */
canvas.style.willChange      = 'transform';
petalCanvas.style.willChange = 'transform';

let stars = [];
let shootingStars = [];
let confettiParticles = [];
let petals = [];
let animFrameId;
let parallaxOffsetY = 0;
let lastScrollY = 0;

function resizeCanvas() {
    canvas.width      = window.innerWidth;
    canvas.height     = window.innerHeight;
    petalCanvas.width  = window.innerWidth;
    petalCanvas.height = window.innerHeight;
    initStars();
}

function initStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 4000);
    for (let i = 0; i < count; i++) {
        stars.push(createStar());
    }
}

// Pink-theme star hue pools
const STAR_HUES = [
    `194, 82, 122`,   // deep rose
    `240, 160, 190`,  // light pink
    `255, 182, 210`,  // blush pink
    `220, 120, 160`,  // mid rose
    `255, 220, 235`,  // pale blush
];

function createStar() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.6 + 0.3,
        opacity: Math.random() * 0.55 + 0.12,
        twinkleSpeed: Math.random() * 0.012 + 0.002,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
        hue: STAR_HUES[Math.floor(Math.random() * STAR_HUES.length)]
    };
}

function createShootingStar() {
    const startX = Math.random() * canvas.width * 0.8;
    const startY = Math.random() * canvas.height * 0.4;
    const angle = (Math.random() * 30 + 20) * Math.PI / 180;
    return {
        x: startX,
        y: startY,
        len: Math.random() * 120 + 80,
        speed: Math.random() * 10 + 8,
        opacity: 1,
        angle,
        dx: Math.cos(angle) * (Math.random() * 10 + 8),
        dy: Math.sin(angle) * (Math.random() * 10 + 8),
        life: 0,
        maxLife: Math.random() * 40 + 25,
    };
}

function spawnShootingStarPeriodically() {
    shootingStars.push(createShootingStar());
    const next = Math.random() * 5000 + 3000;
    setTimeout(spawnShootingStarPeriodically, next);
}

function drawStars() {
    for (let s of stars) {
        // Twinkle
        s.opacity += s.twinkleSpeed * s.twinkleDir;
        if (s.opacity >= 1) { s.opacity = 1; s.twinkleDir = -1; }
        if (s.opacity <= 0.1) { s.opacity = 0.1; s.twinkleDir = 1; }

        const y = s.y + parallaxOffsetY * 0.15;
        ctx.beginPath();
        ctx.arc(s.x, y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.hue}, ${s.opacity})`;
        ctx.fill();

        // Glow for brighter stars
        if (s.size > 1.2 && s.opacity > 0.6) {
            ctx.beginPath();
            ctx.arc(s.x, y, s.size * 3, 0, Math.PI * 2);
            const grd = ctx.createRadialGradient(s.x, y, 0, s.x, y, s.size * 3);
            grd.addColorStop(0, `rgba(${s.hue}, ${s.opacity * 0.3})`);
            grd.addColorStop(1, `rgba(${s.hue}, 0)`);
            ctx.fillStyle = grd;
            ctx.fill();
        }
    }
}

function drawShootingStars() {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.dx;
        s.y += s.dy;
        s.life++;
        s.opacity = 1 - (s.life / s.maxLife);

        if (s.life >= s.maxLife) {
            shootingStars.splice(i, 1);
            continue;
        }

        const tailX = s.x - Math.cos(s.angle) * s.len * (1 - s.life / s.maxLife);
        const tailY = s.y - Math.sin(s.angle) * s.len * (1 - s.life / s.maxLife);

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0,   `rgba(240, 160, 190, 0)`);
        grad.addColorStop(0.5, `rgba(255, 220, 235, ${s.opacity * 0.6})`);
        grad.addColorStop(1,   `rgba(255, 255, 255, ${s.opacity})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Head glow (rose-tinted)
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 220, ${s.opacity})`;
        ctx.fill();
    }
}

// ==========================================================================
// 2. CONFETTI ENGINE
// ==========================================================================

// Pink & white confetti palette
const CONFETTI_COLORS = [
    '#FF85A1', '#FFB6C1', '#FF69B4', '#F48FB1',
    '#FFFFFF', '#FADADD', '#FF92B4', '#FFD6E0',
    '#E91E8C', '#FCE4EC', '#F06292', '#FF4081'
];

function createConfettiParticle() {
    return {
        x: Math.random() * canvas.width,
        y: -20,
        size: Math.random() * 8 + 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        speedX: (Math.random() - 0.5) * 4,
        speedY: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 120 + 80,
    };
}

function triggerConfetti() {
    for (let i = 0; i < 120; i++) {
        setTimeout(() => {
            confettiParticles.push(createConfettiParticle());
        }, i * 15);
    }
}

function drawConfetti() {
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.06; // Gravity
        p.speedX *= 0.99;
        p.rotation += p.rotSpeed;
        p.life++;
        p.opacity = 1 - (p.life / p.maxLife);

        if (p.life >= p.maxLife || p.y > canvas.height + 20) {
            confettiParticles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;

        if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ==========================================================================
// 2b. FALLING PINK PETALS ENGINE
// ==========================================================================

const PETAL_COLORS = [
    '#FFB6C1', '#FF85A1', '#FADADD', '#FF69B4',
    '#F48FB1', '#FCE4EC', '#FF92B4', '#FFD6E0',
    '#FFC0CB', '#F8BBD9', '#E91E8C',
];

function createPetal() {
    const size = Math.random() * 9 + 6; // 6–15 px half-height
    return {
        x:          Math.random() * (petalCanvas.width + 60) - 30, // spawn across full width
        y:          -size * 3 - Math.random() * 80,           // start just above viewport
        size,
        speedY:     Math.random() * 1.0 + 0.55,   // gentle downward drift 0.55–1.55
        speedX:     (Math.random() - 0.5) * 0.35, // very slight horizontal bias
        sway:       Math.random() * 1.4 + 0.4,    // side-to-side amplitude
        swaySpeed:  Math.random() * 0.018 + 0.007,
        swayOffset: Math.random() * Math.PI * 2,
        rotation:   Math.random() * Math.PI * 2,
        rotSpeed:   (Math.random() - 0.5) * 0.055,
        opacity:    Math.random() * 0.40 + 0.30,  // 0.30–0.70
        color:      PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
        life:       0,
        fadeIn:     Math.random() * 40 + 20,      // frames to fade fully in
    };
}

/* Draw one organic petal shape on the dedicated petal canvas */
function renderPetalShape(size, color, alpha) {
    petalCtx.globalAlpha = alpha;
    petalCtx.fillStyle   = color;
    petalCtx.strokeStyle = 'rgba(180, 60, 100, 0.12)';
    petalCtx.lineWidth   = 0.6;

    petalCtx.beginPath();
    petalCtx.moveTo(0, 0);
    // Left lobe
    petalCtx.bezierCurveTo(
        -size * 0.85, -size * 0.55,
        -size * 0.65, -size * 1.55,
         0,           -size * 2.0
    );
    // Right lobe
    petalCtx.bezierCurveTo(
         size * 0.65, -size * 1.55,
         size * 0.85, -size * 0.55,
         0,            0
    );
    petalCtx.closePath();
    petalCtx.fill();
    petalCtx.stroke();

    /* Soft centre vein */
    petalCtx.globalAlpha = alpha * 0.25;
    petalCtx.strokeStyle = 'rgba(255,255,255,0.9)';
    petalCtx.lineWidth   = 0.8;
    petalCtx.beginPath();
    petalCtx.moveTo(0, 0);
    petalCtx.lineTo(0, -size * 1.8);
    petalCtx.stroke();

    petalCtx.globalAlpha = 1;
}

function drawPetals() {
    for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];

        /* Physics update */
        p.life++;
        p.y        += p.speedY;
        p.x        += p.speedX + Math.sin(p.life * p.swaySpeed + p.swayOffset) * p.sway;
        p.rotation += p.rotSpeed;

        /* Fade-in on birth, fade-out near bottom */
        const fadeInAlpha  = Math.min(p.life / p.fadeIn, 1);
        const fadeOutAlpha = p.y > petalCanvas.height - 120
            ? Math.max(0, (petalCanvas.height - p.y) / 120)
            : 1;
        const alpha = p.opacity * fadeInAlpha * fadeOutAlpha;

        /* Cull when off-screen */
        if (p.y > petalCanvas.height + p.size * 3 || alpha <= 0.005) {
            petals.splice(i, 1);
            continue;
        }

        petalCtx.save();
        petalCtx.translate(p.x, p.y);
        petalCtx.rotate(p.rotation);
        renderPetalShape(p.size, p.color, alpha);
        petalCtx.restore();
    }
}

/* Dedicated rAF loop — runs independently from the star canvas */
function animatePetals() {
    petalCtx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);
    drawPetals();
    requestAnimationFrame(animatePetals);
}

/* Maximum concurrent petals — keeps GPU draw calls bounded */
const MAX_PETALS = 50;

/* Trickle petals continuously — with a hard cap to prevent accumulation */
function spawnPetalPeriodically() {
    if (petals.length < MAX_PETALS) {
        petals.push(createPetal());
        if (Math.random() > 0.55 && petals.length < MAX_PETALS) petals.push(createPetal());
        if (Math.random() > 0.82 && petals.length < MAX_PETALS) petals.push(createPetal());
    }
    setTimeout(spawnPetalPeriodically, Math.random() * 250 + 200); // every 200–450ms
}

/* Pre-seed 30 petals distributed across the full viewport on load */
function seedInitialPetals() {
    for (let i = 0; i < 30; i++) {
        const p = createPetal();
        p.y    = Math.random() * (petalCanvas.height + 100) - 50; // scatter vertically
        p.life = Math.floor(p.fadeIn);  // skip fade-in so they're fully visible instantly
        petals.push(p);
    }
}

// --- Main Starfield Canvas Loop (stars + shooting stars + confetti) ---
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();
    drawShootingStars();
    drawConfetti();
    animFrameId = requestAnimationFrame(animate);
}

// ==========================================================================
// 3. PARALLAX SCROLL EFFECT
// ==========================================================================

function handleParallax() {
    const scrollY = window.scrollY;
    parallaxOffsetY = scrollY;
    lastScrollY = scrollY;
}

// ==========================================================================
// 4. COUNTDOWN TIMER
// ==========================================================================

// July 31, 2026, 10:00 AM Sri Lanka (IST +05:30)
const weddingDate = new Date('2026-07-31T10:00:00+05:30');

function pad(n) { return String(n).padStart(2, '0'); }

function updateCountdown() {
    const now = new Date();
    const diff = weddingDate - now;

    if (diff <= 0) {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    animateCountNum('days', pad(days));
    animateCountNum('hours', pad(hours));
    animateCountNum('minutes', pad(minutes));
    animateCountNum('seconds', pad(seconds));
}

function animateCountNum(id, newVal) {
    const el = document.getElementById(id);
    if (el.textContent !== newVal) {
        el.textContent = newVal;
        /* Use requestAnimationFrame to restart the CSS animation cleanly
           without forcing a synchronous reflow (avoids scroll jank) */
        el.classList.remove('count-flip');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => el.classList.add('count-flip'));
        });
    }
}

// Inject count-flip animation dynamically
const flipStyle = document.createElement('style');
flipStyle.textContent = `
    @keyframes countFlip {
        0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .count-flip {
        animation: countFlip 0.35s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
    }
`;
document.head.appendChild(flipStyle);

// ==========================================================================
// 5. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
// ==========================================================================

function initScrollReveal() {
    const revealItems = document.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.transitionDelay = `${i * 0.06}s`;
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealItems.forEach(item => observer.observe(item));
}

// ==========================================================================
// 6. BACKGROUND MUSIC — Calm Harp-Piano Ambient Engine  (v2)
//    Style   : Flowing Canon-like arpeggios in E major
//    Feel    : Serene, cinematic, wedding ceremony
//    Key     : E major  •  I – V – vi – IV  (E, B, C#m, A)
//    Tempo   : ~36 BPM (very slow, meditative)
//    Texture : sustained bass drone + ascending arpeggio + soft melody cap
// ==========================================================================

const musicBtn = document.getElementById('music-toggle');

class CalmHarpEngine {
    constructor() {
        this.ctx        = null;
        this.masterGain = null;
        this.reverb     = null;
        this.delay      = null;
        this.loopTimer  = null;
        this.playing    = false;
    }

    /* ── Boot the AudioContext on first user gesture ── */
    async _boot() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        /* Master gain — stays at 0 until fade-in */
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0;
        this.masterGain.connect(this.ctx.destination);

        /* Algorithmic reverb – long, hall-like tail */
        this.reverb = this.ctx.createConvolver();
        const sr  = this.ctx.sampleRate;
        const len = Math.floor(sr * 4.2);
        const ir  = this.ctx.createBuffer(2, len, sr);
        for (let ch = 0; ch < 2; ch++) {
            const d = ir.getChannelData(ch);
            for (let i = 0; i < len; i++) {
                // Stereo spread + exponential decay
                const t = i / sr;
                d[i] = (Math.random() * 2 - 1) *
                        Math.exp(-t * 1.8) *
                        (0.8 + 0.2 * Math.sin(i * 0.0007 * (ch + 1)));
            }
        }
        this.reverb.buffer = ir;

        /* Soft delay (echo) for shimmer */
        this.delay          = this.ctx.createDelay(1.5);
        this.delay.delayTime.value = 0.72;
        const delayFB       = this.ctx.createGain();
        delayFB.gain.value  = 0.22;
        const delayOut      = this.ctx.createGain();
        delayOut.gain.value = 0.18;

        this.delay.connect(delayFB);
        delayFB.connect(this.delay);
        this.delay.connect(delayOut);
        delayOut.connect(this.masterGain);

        /* Reverb → wet gain → master */
        const reverbGain       = this.ctx.createGain();
        reverbGain.gain.value  = 0.55;
        this.reverb.connect(reverbGain);
        reverbGain.connect(this.masterGain);
    }

    /* ── Full equal-temperament table covering E major + C#m ── */
    _hz(name) {
        const table = {
            /* Octave 2 */
            'E2' : 82.41,  'F#2': 92.50,  'G#2': 103.83,
            'A2' : 110.00, 'B2' : 123.47,
            'C#3': 138.59, 'D#3': 155.56,
            /* Octave 3 */
            'E3' : 164.81, 'F#3': 185.00, 'G#3': 207.65,
            'A3' : 220.00, 'B3' : 246.94,
            'C#4': 277.18, 'D#4': 311.13,
            /* Octave 4 */
            'E4' : 329.63, 'F#4': 369.99, 'G#4': 415.30,
            'A4' : 440.00, 'B4' : 493.88,
            'C#5': 554.37,
            /* Octave 5 */
            'D#5': 622.25, 'E5' : 659.25, 'F#5': 739.99, 'G#5': 830.61, 'A5' : 880.00, 'B5': 987.77,
        };
        return table[name] || 329.63;
    }

    /* ── Render a note: Acoustic Harp / Music Box ── */
    _note(freq, t, dur, vol, useMelody) {
        vol       = vol      || 0.08;
        useMelody = useMelody || false;

        const shapes = useMelody
            ? [
                { type: 'sine',     mult: 1, volScale: 1.0 },
                { type: 'sine',     mult: 2, volScale: 0.5 }, // Bell-like sparkle
                { type: 'triangle', mult: 3, volScale: 0.2 },
              ]
            : [
                { type: 'sine',     mult: 1, volScale: 1.0 },
                { type: 'triangle', mult: 2, volScale: 0.3 },
              ];

        shapes.forEach(({ type, mult, volScale }) => {
            const osc   = this.ctx.createOscillator();
            const gn    = this.ctx.createGain();

            osc.type = type;
            osc.frequency.value = freq * mult;

            const v = vol * volScale;
            /* ADSR — Classic Acoustic Harp/Bell: sharp pluck, steady natural decay */
            gn.gain.setValueAtTime(0, t);
            gn.gain.linearRampToValueAtTime(v, t + 0.02);             // very sharp pluck
            gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);    // steady decay

            osc.connect(gn);
            gn.connect(this.masterGain);
            gn.connect(this.reverb);
            gn.connect(this.delay);

            osc.start(t);
            osc.stop(t + dur + 0.15);
        });
    }

    /* ── Sustained bass drone — one long note per chord ── */
    _bass(freq, t, dur) {
        const osc  = this.ctx.createOscillator();
        const gn   = this.ctx.createGain();
        const filt = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;

        filt.type = 'lowpass';
        filt.frequency.value = 320;
        filt.Q.value = 0.8;

        gn.gain.setValueAtTime(0, t);
        gn.gain.linearRampToValueAtTime(0.18, t + 2.5);
        gn.gain.setValueAtTime(0.18, t + dur - 2.5);
        gn.gain.linearRampToValueAtTime(0.0001, t + dur);

        osc.connect(filt);
        filt.connect(gn);
        gn.connect(this.masterGain);
        gn.connect(this.reverb);

        osc.start(t);
        osc.stop(t + dur + 0.2);
    }

    /* ── Schedule one full loop (Classic Harp Wedding Vibe) ── */
    _scheduleLoop(startAt) {
        const BEAT      = 0.9;        // Flowing harp tempo
        const CHORD_DUR = BEAT * 8;   // 8 beats per chord

        /*
         * Modern Calm Wedding Progression (A Thousand Years style)
         * I - V - vi - IV
         */
        const chords = [
            { bass: 'E2',  arp: ['E3','G#3','B3','E4','G#4','B4','G#4','E4'],   melody: 'B4'  },
            { bass: 'B2',  arp: ['B3','D#4','F#4','B4','D#5','F#5','D#5','B4'], melody: 'D#5' },
            { bass: 'C#3', arp: ['C#3','E3','G#3','C#4','E4','G#4','E4','C#4'], melody: 'E5'  },
            { bass: 'A2',  arp: ['A3','C#4','E4','A4','C#5','E5','C#5','A4'],   melody: 'C#5' },
        ];

        let t = startAt;

        chords.forEach(({ bass, arp, melody }) => {

            /* 1. Bass drone — whole chord duration */
            this._bass(this._hz(bass), t, CHORD_DUR);

            /* 2. Flowing harp arpeggio (up and down) */
            arp.forEach((n, i) => {
                const on  = t + i * BEAT;
                const dur = BEAT * 3.5;
                const vol = 0.08 + Math.random() * 0.02;
                this._note(this._hz(n), on, dur, vol, false);
            });

            /* 3. Soft high melody note — enters mid-chord */
            const melodyOn = t + BEAT * 3.5;
            this._note(this._hz(melody), melodyOn, BEAT * 4.0, 0.06, true);

            t += CHORD_DUR;
        });

        return chords.length * CHORD_DUR;
    }

    /* ── Keep looping seamlessly ── */
    _loop() {
        if (!this.playing) return;
        const loopSec  = this._scheduleLoop(this.ctx.currentTime);
        this.loopTimer = setTimeout(() => this._loop(), (loopSec - 0.3) * 1000);
    }

    /* ── Public API ── */
    async play() {
        await this._boot();
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        if (this.playing) return;
        this.playing = true;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0, now);
        this.masterGain.gain.linearRampToValueAtTime(0.80, now + 4.0); // gentle 4s fade-in
        this._loop();
        musicBtn.classList.remove('paused');
    }

    pause() {
        if (!this.playing) return;
        this.playing = false;
        clearTimeout(this.loopTimer);
        if (this.masterGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.linearRampToValueAtTime(0, now + 2.2);
        }
        musicBtn.classList.add('paused');
    }

    toggle() {
        this.playing ? this.pause() : this.play();
    }
}

const piano = new CalmHarpEngine();
const customAudio = document.getElementById('custom-audio');
let usingCustomAudio = false;

async function toggleMusic() {
    if (usingCustomAudio) {
        if (customAudio.paused) {
            await customAudio.play().catch(() => piano.toggle());
            musicBtn.classList.remove('paused');
        } else {
            customAudio.pause();
            musicBtn.classList.add('paused');
        }
    } else {
        piano.toggle();
    }
}

musicBtn.addEventListener('click', toggleMusic);

/* Called when user taps "Enter Invitation" */
function startMusicOnEnter() {
    if (customAudio) {
        customAudio.volume = 0.6;
        customAudio.play().then(() => {
            usingCustomAudio = true;
            musicBtn.classList.remove('paused');
        }).catch((e) => {
            // Fallback to procedural harp if music.mp3 is missing or blocked
            console.log("Custom audio not found/blocked. Falling back to procedural music.");
            usingCustomAudio = false;
            piano.play();
        });
    } else {
        piano.play();
    }
}

// ==========================================================================
// 7. SPLASH SCREEN & APP INIT
// ==========================================================================

const splashScreen = document.getElementById('splash-screen');
const appContainer = document.getElementById('app-container');
const enterBtn = document.getElementById('enter-btn');

enterBtn.addEventListener('click', () => {
    splashScreen.style.opacity = '0';
    splashScreen.style.visibility = 'hidden';
    splashScreen.style.pointerEvents = 'none';

    setTimeout(() => {
        splashScreen.style.display = 'none';
        appContainer.classList.remove('hidden');
        appContainer.style.display = 'block';
        // Trigger load animations
        setTimeout(() => {
            initScrollReveal();
        }, 100);
    }, 900);

    // Try to start music on user gesture
    startMusicOnEnter();
});

// ==========================================================================
// 8. RSVP - WhatsApp Integration & Confetti
// ==========================================================================

const rsvpBrideBtn = document.getElementById('rsvp-bride');
const rsvpGroomBtn = document.getElementById('rsvp-groom');

function buildWhatsAppMessage() {
    const name = document.getElementById('rsvp-name').value.trim() || 'A Guest';
    const companions = document.getElementById('rsvp-companions').value.trim();
    const status = document.querySelector('input[name="rsvp-status"]:checked').value;
    const attending = status === 'attending';

    let guestText = "";
    if (companions) {
        guestText = ` alongside *${companions}*`;
    }

    const message = attending
        ? `💫 RSVP Confirmation 💍\n\nDear Sachini & Kasun,\n\nI'm *${name}* and I will be joining your beautiful celebration${guestText}! 🎉\n\nCan't wait to celebrate with you both on July 31, 2026 at Amaya Green Hotel! 🌙✨\n\n#SachiniAndKasun`
        : `💫 RSVP Update 💍\n\nDear Sachini & Kasun,\n\nI'm *${name}* and I regretfully won't be able to attend your special day. I will be sending all my love and blessings your way! 💛\n\n#SachiniAndKasun`;

    return encodeURIComponent(message);
}

rsvpBrideBtn.addEventListener('click', () => {
    triggerConfetti();
    const msg = buildWhatsAppMessage();
    setTimeout(() => {
        window.open(`https://wa.me/94776478413?text=${msg}`, '_blank');
    }, 700);
});

rsvpGroomBtn.addEventListener('click', () => {
    triggerConfetti();
    const msg = buildWhatsAppMessage();
    setTimeout(() => {
        window.open(`https://wa.me/817023682511?text=${msg}`, '_blank');
    }, 700);
});

// ==========================================================================
// 9. WISHES WALL
// ==========================================================================

const WISHES_KEY = 'wedding_wishes_sachini_kasun_2026';

function getWishes() {
    try {
        return JSON.parse(localStorage.getItem(WISHES_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveWishes(wishes) {
    localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
}

function formatTimestamp(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function buildWishCard(wish) {
    const card = document.createElement('div');
    card.className = 'wish-card';
    card.innerHTML = `
        <div class="wish-header">
            <span class="wish-author gold-text font-serif">${escapeHTML(wish.name)}</span>
            <span class="wish-time font-sans">${formatTimestamp(wish.timestamp)}</span>
        </div>
        <p class="wish-text font-sans">${escapeHTML(wish.message)}</p>
    `;
    return card;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderWishes() {
    const feed = document.getElementById('wishes-feed');
    feed.innerHTML = '';
    const wishes = getWishes();

    if (wishes.length === 0) {
        feed.innerHTML = `
            <p class="font-sans text-center" style="color: var(--text-muted); font-size: 0.88rem; padding: 1.5rem 0;">
                Be the first to send your blessings! ✨
            </p>
        `;
        return;
    }

    // Render most recent first
    [...wishes].reverse().forEach(wish => {
        feed.appendChild(buildWishCard(wish));
    });
}

// Wishes Form Submit
const wishesForm = document.getElementById('wishes-form');
wishesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl = document.getElementById('wish-name');
    const msgEl = document.getElementById('wish-message');
    const name = nameEl.value.trim();
    const message = msgEl.value.trim();

    if (!name || !message) return;

    const wishes = getWishes();
    wishes.push({ name, message, timestamp: Date.now() });
    saveWishes(wishes);

    nameEl.value = '';
    msgEl.value = '';

    renderWishes();

    // Scroll wishes feed to top
    const feedContainer = document.querySelector('.wishes-feed-container');
    feedContainer.scrollTop = 0;

    // Mini gold sparkle to confirm submitted
    const btn = wishesForm.querySelector('.submit-btn');
    btn.textContent = '✨ Blessing Sent!';
    btn.style.background = 'rgba(255, 215, 0, 0.2)';
    setTimeout(() => {
        btn.innerHTML = '<span>Send Blessing</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="send-icon"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>';
        btn.style.background = '';
    }, 2500);
});

// ==========================================================================
// 10. STARTUP & WINDOW EVENTS
// ==========================================================================

// Init on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    seedInitialPetals();
    animate();         // starfield canvas loop
    animatePetals();   // foreground petal canvas loop (independent)
    spawnShootingStarPeriodically();
    spawnPetalPeriodically();

    // Start countdown
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Load saved wishes
    renderWishes();

    // Parallax on scroll
    window.addEventListener('scroll', handleParallax, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Show music button only after app is entered
    musicBtn.style.display = 'none';
    enterBtn.addEventListener('click', () => {
        setTimeout(() => {
            musicBtn.style.display = 'flex';
        }, 1200);
    }, { once: true });
});

// ==========================================================================
// 10b. VENUE QR CODE TOGGLE
// ==========================================================================

function toggleQR() {
    const panel  = document.getElementById('qr-panel');
    const btn    = document.getElementById('qr-toggle-btn');
    const isOpen = panel.style.display !== 'none';

    if (isOpen) {
        panel.style.display = 'none';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3 3h7v7H3zm1 1v5h5V4zm1 1h3v3H5zM14 3h7v7h-7zm1 1v5h5V4zm1 1h3v3h-3zM3 14h7v7H3zm1 1v5h5v-5zm1 1h3v3H5zM14 14h3v3h-3zm4 0h3v3h-3zm-4 4h3v3h-3zm4 0h3v3h-3z"/>
            </svg>
            SHOW QR CODE`;
    } else {
        panel.style.display = 'flex';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            HIDE QR CODE`;
    }
}

// ==========================================================================
// 11. THEME TOGGLE  —  Light (Pink) ↔ Dark (Navy/Gold)
// ==========================================================================

const themeToggleBtn = document.getElementById('theme-toggle');

/* Colour palettes for each theme */
const STAR_HUES_LIGHT = [
    `194, 82, 122`,   // deep rose
    `240, 160, 190`,  // light pink
    `255, 182, 210`,  // blush pink
    `220, 120, 160`,  // mid rose
    `255, 220, 235`,  // pale blush
];
const STAR_HUES_DARK = [
    `255, 215, 0`,    // gold
    `255, 240, 150`,  // light gold
    `255, 255, 255`,  // white
    `200, 210, 255`,  // blue-white
    `255, 200, 100`,  // warm amber
];

const PETAL_COLORS_LIGHT = [
    '#FFB6C1', '#FF85A1', '#FADADD', '#FF69B4',
    '#F48FB1', '#FCE4EC', '#FF92B4', '#FFD6E0',
    '#FFC0CB', '#F8BBD9', '#E91E8C',
];
const PETAL_COLORS_DARK = [
    '#FFD700', '#FFF099', '#FFE566', '#F3E5AB',
    '#FFFFFF', '#C0A843', '#FFD080', '#FFCD00',
    '#FFF5B8', '#B8860B', '#FFE533',
];

function applyTheme(theme) {
    /* 1. Set CSS attribute — all [data-theme="dark"] rules kick in */
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wedding-theme', theme);

    /* 2. Swap star hue palette and refresh the starfield */
    const newStarHues = theme === 'dark' ? STAR_HUES_DARK : STAR_HUES_LIGHT;
    STAR_HUES.length = 0;
    STAR_HUES.push(...newStarHues);
    initStars(); // regenerate with new colours

    /* 3. Swap petal colour palette, clear + reseed */
    const newPetalColors = theme === 'dark' ? PETAL_COLORS_DARK : PETAL_COLORS_LIGHT;
    PETAL_COLORS.length = 0;
    PETAL_COLORS.push(...newPetalColors);
    petals.length = 0;    // discard old petals
    seedInitialPetals();  // immediately fill with new-colour petals

    /* 4. Update button aria-label */
    themeToggleBtn.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

/* Toggle on click */
themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* Restore saved preference on load (default: light) */
applyTheme(localStorage.getItem('wedding-theme') || 'light');
