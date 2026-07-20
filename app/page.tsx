"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Genome = {
  symmetry: number;
  frequency: number;
  amplitude: number;
  phase: number;
  noise: number;
  pulse: number;
  complexity: number;
  orbit: number;
  trail: number;
  hue: number;
};

type MathMode = "circle" | "ellipse" | "triangle" | "square" | "pentagon" | "hexagon" | "star" | "sine" | "cosine" | "rose" | "spiral" | "superformula" | "cardioid" | "lemniscate" | "lissajous" | "hypotrochoid" | "epitrochoid" | "fourier" | "fibonacci" | "mobius" | "gaussian" | "butterfly" | "mandelbrot";
type SequenceMode = "fibonacci" | "primes" | "pascal" | "collatz" | "harmonic";
type Training = { vitality: number; power: number; defense: number; speed: number };
type UpgradeMap = Record<string, number>;

type Specimen = {
  id: string;
  name: string;
  genome: Genome;
  discoveredAt: number;
  bond?: number;
  mathMode?: MathMode;
  training?: Training;
  generation?: number;
  ascension?: number;
  aura?: string;
  sequence?: SequenceMode;
  upgrades?: UpgradeMap;
};

type Tool = "observe" | "nutrient" | "light" | "gravity" | "chaos";
type Stimulus = { x: number; y: number; type: Tool; life: number };
type Contract = {
  id: string;
  title: string;
  brief: string;
  reward: number;
  requirements: string[];
  score: (g: Genome) => number;
};
type FighterStats = { hp: number; power: number; defense: number; speed: number; rating: number; luck: number; charge: number };
type BattleState = {
  player: Specimen;
  enemy: Specimen;
  playerHp: number;
  enemyHp: number;
  playerGuard: boolean;
  enemyGuard: boolean;
  playerAbilityUsed: boolean;
  enemyAbilityUsed: boolean;
  turn: number;
  status: "fighting" | "won" | "lost";
  log: string[];
};
type BattleRecord = { wins: number; losses: number; streak: number; bestStreak: number };
type PassReward = { tier: number; points: number; label: string; energy?: number; xp?: number; aura?: string };

const GENES: Array<{ key: keyof Genome; label: string; min: number; max: number; step: number; unit?: string; math: string; effect: string }> = [
  { key: "symmetry", label: "Radial symmetry", min: 3, max: 13, step: 1, math: "Sets k, the number of repeated angular sectors around 2π radians.", effect: "Adds lobes, limbs, petals, nerve branches, and usually a higher combat charge." },
  { key: "frequency", label: "Wave frequency", min: 1, max: 8, step: 0.1, math: "Controls how many oscillations occur per cycle in sin(ωt) and related harmonics.", effect: "Creates tighter ripples and faster membrane activity; golden resonance can improve rarity." },
  { key: "amplitude", label: "Body amplitude", min: 28, max: 84, step: 1, math: "Multiplies the curve radius—the A in A·f(θ).", effect: "Makes the organism physically larger and contributes strongly to vitality and raw power." },
  { key: "phase", label: "Phase offset", min: 0, max: 6.28, step: 0.01, math: "Shifts a periodic function horizontally by φ radians, from 0 to roughly 2π.", effect: "Rotates or offsets lobes and changes the creature’s deterministic Math Luck signature." },
  { key: "noise", label: "Instability", min: 0, max: 1, step: 0.01, math: "Adds a bounded perturbation η to otherwise exact curve samples.", effect: "Makes edges organic and unpredictable, unlocks chaos traits, and increases visual volatility." },
  { key: "pulse", label: "Pulse rate", min: 0.2, max: 2.4, step: 0.05, math: "Scales time in the animation term sin(ωt), changing temporal frequency.", effect: "Controls breathing speed, energy, and high-rate traits such as Double Nucleus." },
  { key: "complexity", label: "Membrane detail", min: 48, max: 160, step: 1, math: "Sets the sampling resolution used to approximate the continuous curve.", effect: "Higher values produce smoother, more detailed outlines and add genome charge." },
  { key: "orbit", label: "Drift pattern", min: 0, max: 1, step: 0.01, math: "Weights the angular velocity and vector-field force used for orbital motion.", effect: "Makes the organism roam more widely and can classify it as Orbital or Drifter." },
  { key: "trail", label: "Temporal trail", min: 4, max: 32, step: 1, math: "Stores the previous n positions as a discrete time series.", effect: "Leaves a longer afterimage, reveals movement history, and can unlock Temporal Echo." },
  { key: "hue", label: "Spectral hue", min: 0, max: 359, step: 1, unit: "°", math: "Maps an angle on the 360° HSL color wheel to the rendered spectrum.", effect: "Changes membrane, glow, particles, and nucleus color; some ranges influence classification." },
];

const INITIAL: Genome = {
  symmetry: 7,
  frequency: 3.6,
  amplitude: 58,
  phase: 1.42,
  noise: 0.18,
  pulse: 0.82,
  complexity: 112,
  orbit: 0.38,
  trail: 18,
  hue: 178,
};

const OBJECTIVES = [
  { id: "prime", label: "Prime geometry", hint: "Create a prime-number symmetry" },
  { id: "stable", label: "Perfectly stable", hint: "Reduce instability below 0.05" },
  { id: "chaos", label: "Edge of chaos", hint: "Raise instability above 0.90" },
  { id: "families", label: "Field survey", hint: "Save three different families" },
  { id: "rare", label: "Rare signal", hint: "Discover a Rare specimen or better" },
  { id: "archive", label: "Living archive", hint: "Preserve five specimens" },
  { id: "hybrid", label: "First synthesis", hint: "Breed a new hybrid" },
  { id: "contract", label: "Commissioned science", hint: "Complete a research contract" },
  { id: "codex", label: "Taxonomic breakthrough", hint: "Document four creature families" },
  { id: "lock", label: "Directed evolution", hint: "Lock three genes at once" },
  { id: "arena", label: "First contact", hint: "Win a Genome Arena battle" },
  { id: "champion", label: "Arena specialist", hint: "Win three battles" },
  { id: "bond", label: "Trusted companion", hint: "Raise a creature's bond to 60" },
  { id: "polymath", label: "Beyond sine", hint: "Explore every mathematical function" },
  { id: "pass", label: "Reward protocol", hint: "Claim a Genome Pass reward" },
  { id: "sequence", label: "Sequence encoded", hint: "Activate every sequence reactor" },
  { id: "theorem", label: "Applied mathematics", hint: "Install a level-three theorem upgrade" },
  { id: "atlas", label: "Equation atlas", hint: "Explore eighteen mathematical morphologies" },
  { id: "ascend", label: "Ascension achieved", hint: "Complete the Ascension Protocol" },
];

const FAMILIES = ["Harmonic", "Orbital", "Radiant", "Pulsar", "Drifter", "Fractail", "Glitchling", "Voidborn"];
const ANOMALIES = ["Mirror fracture", "Temporal echo", "Prime crown", "Golden resonance", "Double nucleus", "Perfect lattice"];
const MATH_MODES: Array<{ id: MathMode; label: string; symbol: string; category: string; description: string }> = [
  { id: "circle", label: "Circle", symbol: "x²+y²=r²", category: "BASIC", description: "Equal radius in every direction" },
  { id: "ellipse", label: "Ellipse", symbol: "x²/a²+y²/b²=1", category: "BASIC", description: "A stretched circular orbit" },
  { id: "triangle", label: "Triangle", symbol: "P₃", category: "BASIC", description: "Three straight radial faces" },
  { id: "square", label: "Square", symbol: "P₄", category: "BASIC", description: "Four equal sides and right angles" },
  { id: "pentagon", label: "Pentagon", symbol: "P₅", category: "BASIC", description: "Five-fold regular polygon" },
  { id: "hexagon", label: "Hexagon", symbol: "P₆", category: "BASIC", description: "Six-fold lattice cell" },
  { id: "star", label: "Star Polygon", symbol: "{5/2}", category: "BASIC", description: "Alternating outer and inner radii" },
  { id: "sine", label: "Sine Wave", symbol: "sin", category: "TRIG", description: "Smooth periodic oscillation" },
  { id: "cosine", label: "Cosine Wave", symbol: "cos", category: "TRIG", description: "Phase-shifted harmonic lobes" },
  { id: "rose", label: "Rose Curve", symbol: "r=cos(kθ)", category: "POLAR", description: "Rhodonea petal geometry" },
  { id: "spiral", label: "Archimedean", symbol: "r=a+bθ", category: "POLAR", description: "Constant radial growth" },
  { id: "superformula", label: "Superformula", symbol: "G(m,n)", category: "GEOMETRY", description: "Gielis biological shell" },
  { id: "cardioid", label: "Cardioid", symbol: "1−cosθ", category: "POLAR", description: "Heart-shaped epicycloid" },
  { id: "lemniscate", label: "Lemniscate", symbol: "√cos2θ", category: "POLAR", description: "Bernoulli infinity curve" },
  { id: "lissajous", label: "Lissajous", symbol: "x=sin(at)", category: "PARAMETRIC", description: "Coupled harmonic motion" },
  { id: "hypotrochoid", label: "Hypotrochoid", symbol: "H(R,r,d)", category: "ROULETTE", description: "A circle rolling within a circle" },
  { id: "epitrochoid", label: "Epitrochoid", symbol: "E(R,r,d)", category: "ROULETTE", description: "A circle rolling outside a circle" },
  { id: "fourier", label: "Fourier Bloom", symbol: "Σaₙsin(nθ)", category: "ANALYSIS", description: "Layered harmonic synthesis" },
  { id: "fibonacci", label: "Golden Phyllotaxis", symbol: "φ=(1+√5)/2", category: "SEQUENCE", description: "Golden-ratio growth pattern" },
  { id: "mobius", label: "Möbius Membrane", symbol: "½-twist", category: "TOPOLOGY", description: "One-sided twisted surface" },
  { id: "gaussian", label: "Gaussian Colony", symbol: "e^(−x²)", category: "STATISTICS", description: "Bell-curve radial clusters" },
  { id: "butterfly", label: "Butterfly Curve", symbol: "e^cosθ", category: "TRANSCENDENTAL", description: "Temple Fay butterfly function" },
  { id: "mandelbrot", label: "Mandelbrot Edge", symbol: "z↦z²+c", category: "FRACTAL", description: "Recursive boundary organism" },
];

const SHAPE_INSIGHTS: Record<MathMode, { explanation: string; creature: string; fact: string }> = {
  circle: { explanation: "Every angle uses the same radius, so the plotted point stays exactly r units from the center.", creature: "Its membrane is balanced in every direction. Frequency and noise add a faint living ripple without replacing the circular skeleton.", fact: "A circle has infinitely many lines of symmetry and encloses the greatest area for a fixed perimeter." },
  ellipse: { explanation: "An ellipse scales cosine and sine by different semi-axes a and b, stretching a circle along one direction.", creature: "The unequal axes give the organism a wide swimming body. Amplitude controls overall size while phase gently changes its orientation.", fact: "For every point on an ellipse, the sum of distances to its two foci is constant." },
  triangle: { explanation: "A regular polygon can be drawn in polar form by changing radius between equally spaced corner directions.", creature: "Three angular sectors create three hard corners. Organic noise and pulse soften the exact polygon into a living triangular membrane.", fact: "A triangle is the only rigid polygon: its shape cannot shear without changing a side length." },
  square: { explanation: "Four equal angular sectors produce four vertices separated by π/2 radians and four straight faces.", creature: "Its fourfold scaffold produces a blocky cell. The membrane still breathes, so its mathematically straight edges flex slightly.", fact: "A square is simultaneously a regular polygon, rectangle, rhombus, and cyclic quadrilateral." },
  pentagon: { explanation: "Five equal sectors place vertices every 72°, producing a regular five-sided polygon.", creature: "The fivefold body echoes natural symmetry found in flowers and marine life. Its internal nerves meet each vertex.", fact: "A regular pentagon contains the golden ratio repeatedly in its diagonals and side lengths." },
  hexagon: { explanation: "Six points separated by 60° form a regular hexagon whose side length equals its circumradius.", creature: "The sixfold lattice makes a stable, cell-like shell; small waves make it resemble a living crystal.", fact: "Regular hexagons tile a plane with no gaps, which is why they appear in honeycombs." },
  star: { explanation: "A star polygon alternates between outer and inner radii while advancing through five angular directions.", creature: "Alternating radii create five long limbs and five narrow valleys. Symmetry and noise make each point feel biological.", fact: "The classic pentagram is the star polygon {5/2}, and its segments contain the golden ratio." },
  sine: { explanation: "A sinusoid periodically adds and subtracts radius as θ travels around the center.", creature: "Each oscillation becomes a soft lobe. Radial symmetry controls repetition while pulse moves the wave through time.", fact: "Sine is the y-coordinate of a point traveling around the unit circle." },
  cosine: { explanation: "Cosine is the same harmonic motion as sine, shifted by π/2 radians.", creature: "The phase shift moves every crest to a new angular position, giving the same genes a visibly different stance.", fact: "cos(θ)=sin(θ+π/2), so the functions differ only by phase." },
  rose: { explanation: "The polar equation r=cos(kθ) repeatedly grows and reverses radius to form petals.", creature: "The symmetry gene becomes k, determining its petal crown; odd and even values produce different petal counts.", fact: "Rose curves are also called rhodonea curves, from the Greek word for rose." },
  spiral: { explanation: "An Archimedean spiral increases radius linearly as the angle increases: r=a+bθ.", creature: "Its membrane appears to unfurl rather than close perfectly. Harmonics wrap living ripples around that growth path.", fact: "Successive turns of an Archimedean spiral remain a constant distance apart." },
  superformula: { explanation: "The Gielis superformula raises sine and cosine terms to adjustable powers, generalizing circles and polygons.", creature: "Symmetry supplies m while instability changes the exponent, allowing shells, stars, rounded polygons, and plant-like forms.", fact: "One compact superformula can approximate a remarkable variety of natural silhouettes." },
  cardioid: { explanation: "The polar radius 1−cosθ is smallest on one side and largest on the other, creating a cusp and rounded heart.", creature: "The unequal radius gives it a forward-facing lobe and tail-like notch, as if the organism has a natural direction.", fact: "A cardioid is traced by a point on a circle rolling around another circle of equal radius." },
  lemniscate: { explanation: "Bernoulli’s equation r²=a²cos(2θ) creates two opposing loops joined at the origin.", creature: "The paired loops become twin body chambers around one nucleus, with noise filling the narrow waist.", fact: "Lemniscate comes from a Latin word for a ribbon and is a mathematical infinity shape." },
  lissajous: { explanation: "Independent sine waves control x and y. Their frequency ratio determines whether the path closes and how many lobes appear.", creature: "Symmetry and frequency become competing oscillators, folding the membrane through a woven harmonic route.", fact: "Lissajous figures were historically used to compare frequencies on oscilloscopes." },
  hypotrochoid: { explanation: "A point attached to a small circle rolling inside a larger circle traces a hypotrochoid.", creature: "Its genes choose the two radii and pen distance, producing inward loops like a biological Spirograph.", fact: "Many familiar Spirograph drawings are hypotrochoids." },
  epitrochoid: { explanation: "A point attached to a circle rolling around the outside of another circle traces an epitrochoid.", creature: "External rolling pushes its lobes outward, making a broader crown than the inward-rolling hypotrochoid.", fact: "The orbit of a planet in the old Ptolemaic model can be described using epicycles related to epitrochoids." },
  fourier: { explanation: "Several sine waves with different integer frequencies are added together as a short Fourier series.", creature: "Every harmonic contributes a smaller ridge, so the membrane looks richly detailed but remains mathematically ordered.", fact: "Fourier analysis can rebuild extremely complex periodic signals from simple sine and cosine waves." },
  fibonacci: { explanation: "A golden-ratio growth term combines with angular oscillation to suggest phyllotaxis and expanding spirals.", creature: "Its body widens as it turns, while nodes follow the golden angle used by many leaves and seed heads.", fact: "The ratio of consecutive Fibonacci numbers approaches φ≈1.618." },
  mobius: { explanation: "A Möbius strip introduces a half-twist before reconnecting its ends, producing one continuous side.", creature: "The 2D membrane projection alternately swells and narrows as though its surface were twisting through itself.", fact: "A Möbius strip has only one side and one boundary edge." },
  gaussian: { explanation: "Repeated bell curves e^(−x²) are arranged around the circle, concentrating radius near several means μ.", creature: "Probability peaks become rounded colonies or bulbs, while frequency changes how narrowly each cluster is distributed.", fact: "The Gaussian distribution appears throughout statistics because sums of many small effects often approach it." },
  butterfly: { explanation: "The butterfly curve combines exponentials, trigonometric waves, and a fifth power in one transcendental polar equation.", creature: "Those competing terms create wings, antenna-like tips, and small folds that remain recognizable while moving.", fact: "The famous butterfly curve was introduced by Temple H. Fay in 1989." },
  mandelbrot: { explanation: "The Mandelbrot idea repeatedly applies z↦z²+c and studies whether values escape; this membrane imitates its layered boundary.", creature: "Nested harmonics create self-similar bumps at several scales, making the edge look recursively alive.", fact: "The Mandelbrot set has a finite area but a boundary of extraordinary, effectively infinite detail." },
};

function atlasGroup(mode: MathMode) {
  const category = MATH_MODES.find(item => item.id === mode)?.category;
  if (category === "BASIC") return "BASIC";
  if (["TRIG", "POLAR", "GEOMETRY"].includes(category || "")) return "CURVES";
  return "ADVANCED";
}
const EMPTY_TRAINING: Training = { vitality: 0, power: 0, defense: 0, speed: 0 };
const EMPTY_UPGRADES: UpgradeMap = {};

const SEQUENCES: Array<{ id: SequenceMode; label: string; symbol: string; effect: string; description: string }> = [
  { id: "fibonacci", label: "Fibonacci", symbol: "1,1,2,3,5…", effect: "+VITALITY", description: "Growth follows the golden recurrence Fₙ=Fₙ₋₁+Fₙ₋₂." },
  { id: "primes", label: "Prime", symbol: "2,3,5,7,11…", effect: "+MATH LUCK", description: "Indivisible nodes increase critical resonance probability." },
  { id: "pascal", label: "Pascal", symbol: "1 3 3 1", effect: "+DEFENSE", description: "Binomial coefficients reinforce the membrane lattice." },
  { id: "collatz", label: "Collatz", symbol: "3n+1", effect: "+POWER", description: "Chaotic iteration creates unpredictable attack surges." },
  { id: "harmonic", label: "Harmonic", symbol: "1+½+⅓…", effect: "+SPEED", description: "A converging rhythm accelerates temporal reactions." },
];

const UPGRADES = [
  { id: "integral_membrane", symbol: "∫", name: "Integral Membrane", branch: "CALCULUS", base: 10, description: "Accumulates area under the curve into permanent vitality." },
  { id: "derivative_spines", symbol: "d/dx", name: "Derivative Spines", branch: "CALCULUS", base: 12, description: "Turns rate of change into sharper attack power." },
  { id: "vector_field", symbol: "∇", name: "Vector Field", branch: "ALGEBRA", base: 14, description: "Redirects hostile forces into additional defense." },
  { id: "prime_lens", symbol: "ℙ", name: "Prime Lens", branch: "NUMBER THEORY", base: 15, description: "Detects prime resonance and improves Math Luck." },
  { id: "golden_core", symbol: "φ", name: "Golden Core", branch: "GEOMETRY", base: 18, description: "Golden-ratio proportions strengthen every combat stat." },
  { id: "chaos_attractor", symbol: "λ", name: "Chaos Attractor", branch: "DYNAMICS", base: 20, description: "Harnesses sensitive dependence for critical damage." },
  { id: "fractal_memory", symbol: "∞", name: "Fractal Memory", branch: "FRACTALS", base: 22, description: "Self-similar training patterns amplify all experiments." },
  { id: "euler_heart", symbol: "eⁱπ", name: "Euler Heart", branch: "MASTER THEOREM", base: 30, description: "Unifies five constants into a powerful universal core." },
];

const PASS_REWARDS: PassReward[] = [
  { tier: 1, points: 20, label: "10 Quantum Energy", energy: 10 },
  { tier: 2, points: 45, label: "40 Research XP", xp: 40 },
  { tier: 3, points: 75, label: "Solar Aura", aura: "solar" },
  { tier: 4, points: 110, label: "20 Quantum Energy", energy: 20 },
  { tier: 5, points: 150, label: "80 Research XP", xp: 80 },
  { tier: 6, points: 195, label: "Void Aura", aura: "void" },
  { tier: 7, points: 245, label: "30 Quantum Energy", energy: 30 },
  { tier: 8, points: 300, label: "120 Research XP", xp: 120 },
  { tier: 9, points: 360, label: "Prismatic Aura", aura: "prism" },
  { tier: 10, points: 425, label: "Ascendant Cache", energy: 50, xp: 200 },
];

const TOUR_STEPS = [
  { target: "purpose", title: "Your mission: Ascension", body: "This is the main objective. Build a bonded, powerful bloodline; win arena battles; finish contracts; breed a hybrid; and gather enough Quantum Energy to ascend your organism." },
  { target: "genome", title: "Design the mathematical genome", body: "Every slider changes both appearance and combat potential. Values farther right always add more raw charge. Put every slider at maximum to unlock Omega Overdrive, the highest possible base power." },
  { target: "formula", title: "Choose and understand its shape", body: "The Equation Atlas contains twenty-three morphologies, from circles and polygons to polar curves, topology, statistics, and fractals. Filter the atlas or press Why This Shape for an illustrated mathematical explanation." },
  { target: "mutate", title: "Evolve deliberately—or gamble", body: "Mutate All creates a new roll. Micro Mutation makes smaller changes. Lock up to three genes to preserve the traits you care about. Charged Evolution spends energy and pushes unlocked genes toward greater power." },
  { target: "habitat", title: "Bond through experiments", body: "Choose Nutrient, Light, Gravity, or Chaos, then click inside the chamber. Your companion gains bond, Quantum Energy, and permanent training: vitality, speed, defense, or power." },
  { target: "specimen", title: "Know and name your companion", body: "This panel shows family, anomalies, bond, generation, Math Luck, and arena power. Rename the organism here, then preserve it when you want its exact genome and training saved." },
  { target: "archive", title: "Archive and breed", body: "Preserved creatures can return later, fight in the arena, or become parents. Select two parents to synthesize a hybrid that inherits genes, formula type, and a higher generation." },
  { target: "field", title: "Field Lab drives progression", body: "Contracts ask for precise mathematical traits and pay XP plus Quantum Energy. The Theorem Lab installs calculus, number theory, geometry, dynamics, and fractal upgrades. The Protocol tracks Ascension." },
  { target: "research", title: "Research records milestones", body: "Objectives reward exploration across mutation, functions, bonding, breeding, contracts, and battle. Use this checklist when you are unsure what to try next." },
  { target: "arena", title: "Arena turns math into strategy", body: "Fight with the active creature or any archived specimen. Stats come from its genome, training, bond, generation, and ascension. Random variance and Math Luck create calculated uncertainty." },
  { target: "arena", title: "Win the Genome Pass", body: "Arena victories earn pass points; longer win streaks multiply progress. Claim energy, XP, and cosmetic auras, then reinvest those rewards into stronger evolution and Ascension." },
];

const CONTRACTS: Contract[] = [
  {
    id: "prime-sanctuary", title: "Prime Sanctuary", reward: 80,
    brief: "The orbital station needs a stable, prime-symmetric organism to calibrate its navigation lattice.",
    requirements: ["Prime symmetry", "Instability ≤ 0.25", "Amplitude ≥ 50"],
    score: g => Math.round((([3, 5, 7, 11, 13].includes(g.symmetry) ? 1 : .15) * .45 + Math.max(0, 1 - g.noise / .25) * .35 + Math.min(1, g.amplitude / 50) * .2) * 100),
  },
  {
    id: "golden-resonance", title: "Golden Resonance", reward: 110,
    brief: "Synthesize a lifeform whose frequency approaches the golden harmonic without losing its temporal wake.",
    requirements: ["Frequency ≈ 3.24", "Trail ≥ 20", "Pulse between 0.7–1.5"],
    score: g => Math.round((Math.max(0, 1 - Math.abs(g.frequency - 3.236) / 2) * .55 + Math.min(1, g.trail / 20) * .25 + Math.max(0, 1 - Math.abs(g.pulse - 1.1) / .8) * .2) * 100),
  },
  {
    id: "chaos-vessel", title: "Chaos Vessel", reward: 90,
    brief: "Contain a volatile specimen energetic enough to survive transit through a probability storm.",
    requirements: ["Instability ≥ 0.85", "Pulse ≥ 1.4", "Complexity ≥ 100"],
    score: g => Math.round((Math.min(1, g.noise / .85) * .4 + Math.min(1, g.pulse / 1.4) * .3 + Math.min(1, g.complexity / 100) * .3) * 100),
  },
  {
    id: "radiant-survey", title: "Radiant Survey", reward: 100,
    brief: "Produce a coherent high-order specimen for deep-ocean bioluminescence mapping.",
    requirements: ["Symmetry ≥ 10", "Instability ≤ 0.30", "Hue 140°–220°"],
    score: g => Math.round((Math.min(1, g.symmetry / 10) * .35 + Math.max(0, 1 - g.noise / .3) * .35 + (g.hue >= 140 && g.hue <= 220 ? 1 : Math.max(0, 1 - Math.min(Math.abs(g.hue - 140), Math.abs(g.hue - 220)) / 100)) * .3) * 100),
  },
];

const INTRO_STEPS = [
  { icon: "∿", eyebrow: "WELCOME, RESEARCHER", title: "Equations become living things", body: "Every creature in Equationarium is drawn and animated from a mathematical genome. Your goal is to create a companion, develop its mathematical anatomy, build a bloodline, finish research, and reach Ascension.", tips: ["Twenty-three equation families create radically different bodies", "Every function includes an illustrated explanation"] },
  { icon: "✣", eyebrow: "STEP 01 • EVOLVE", title: "Shape the genome", body: "Move ten gene sliders, choose an Equation Atlas morphology, and encode a number sequence. Lock up to three genes when you want traits to survive mutation.", tips: ["Every slider increases raw charge as it moves right", "Prime and golden-ratio patterns improve Math Luck"] },
  { icon: "⌁", eyebrow: "STEP 02 • DEVELOP", title: "Train mathematical anatomy", body: "Habitat experiments build bond and combat stats. Research generates Quantum Energy for calculus, number theory, geometry, dynamics, and fractal upgrades in the Theorem Lab.", tips: ["Theorem upgrades stay with preserved creatures", "Breeding inherits parts of both parents’ development"] },
  { icon: "⚔", eyebrow: "STEP 03 • COMPETE", title: "Enter the Genome Arena", body: "Your equations are also combat statistics. Choose the current organism or a preserved specimen, then strike, stabilize, and unleash its family ability against an adaptive rival.", tips: ["Every family has a unique signature move", "Arena wins earn XP and build a victory streak"] },
];

const PREFIXES = ["Nyxa", "Lumi", "Astra", "Velo", "Orbi", "Cyra", "Iono", "Zeta", "Mira", "Echo", "Quanta", "Vanta"];
const SUFFIXES = ["lume", "vora", "phage", "morph", "tide", "nix", "ella", "ion", "oid", "ara", "yx", "ora"];

function seededPart(g: Genome, salt = 0) {
  const n = Math.sin(g.hue * 12.9898 + g.symmetry * 78.233 + g.frequency * 31.7 + salt) * 43758.5453;
  return Math.abs(n - Math.floor(n));
}

function creatureName(g: Genome) {
  const a = PREFIXES[Math.floor(seededPart(g, 1) * PREFIXES.length)];
  const b = SUFFIXES[Math.floor(seededPart(g, 2) * SUFFIXES.length)];
  const code = Math.round((g.frequency * g.symmetry + g.noise * 13) % 19) + 1;
  return `${a}${b}-${code}`;
}

function familyOf(g: Genome) {
  if (g.noise > 0.72) return "Glitchling";
  if (g.trail > 25 && g.orbit > 0.55) return "Drifter";
  if (g.pulse > 1.7) return "Pulsar";
  if (g.symmetry >= 10 && g.noise < 0.3) return "Radiant";
  if (g.frequency > 6) return "Fractail";
  if (g.hue > 245 && g.hue < 330 && g.phase > 4.2) return "Voidborn";
  if (g.orbit > 0.6) return "Orbital";
  return "Harmonic";
}

function rarityOf(g: Genome) {
  if (isOverdrive(g)) return "Mythic";
  let score = 0;
  if ([3, 5, 7, 11, 13].includes(g.symmetry)) score += 1;
  if (g.noise < 0.06 || g.noise > 0.91) score += 1;
  if (Math.abs(g.frequency / 2 - 1.618) < 0.08) score += 2;
  if (g.trail > 29) score += 1;
  if (g.symmetry === 13) score += 1;
  if (g.pulse > 2.2) score += 1;
  if (score >= 6) return "Legendary";
  if (score >= 4) return "Epic";
  if (score >= 2) return "Rare";
  if (score >= 1) return "Uncommon";
  return "Common";
}

function rareTraits(g: Genome) {
  const traits: string[] = [];
  if (g.noise > 0.9) traits.push("Mirror fracture");
  if (g.trail > 28) traits.push("Temporal echo");
  if (g.symmetry === 13) traits.push("Prime crown");
  if (Math.abs(g.frequency / 2 - 1.618) < 0.08) traits.push("Golden resonance");
  if (g.pulse > 2.15) traits.push("Double nucleus");
  if (g.noise < 0.05) traits.push("Perfect lattice");
  return traits;
}

function personalities(g: Genome) {
  const options = [
    g.orbit > 0.55 ? "Curious" : "Watchful",
    g.noise > 0.55 ? "Volatile" : "Serene",
    g.pulse > 1.25 ? "Energetic" : "Patient",
  ];
  return options;
}

function descriptionFor(g: Genome) {
  const family = familyOf(g).toLowerCase();
  const stability = g.noise < 0.25 ? "unusually coherent" : g.noise > 0.7 ? "beautifully unstable" : "gently fluctuating";
  const article = stability.startsWith("unusually") ? "An" : "A";
  return `${article} ${stability} ${family} whose ${g.symmetry}-fold membrane resonates at ${g.frequency.toFixed(1)} cycles. It appears to ${g.orbit > 0.6 ? "map invisible currents in its habitat" : "listen for small changes in local light"}.`;
}

function randomGenome(): Genome {
  return {
    symmetry: 3 + Math.floor(Math.random() * 11),
    frequency: +(1 + Math.random() * 7).toFixed(2),
    amplitude: Math.round(34 + Math.random() * 48),
    phase: +(Math.random() * 6.28).toFixed(2),
    noise: +(Math.random()).toFixed(2),
    pulse: +(0.3 + Math.random() * 2).toFixed(2),
    complexity: Math.round(58 + Math.random() * 100),
    orbit: +(Math.random()).toFixed(2),
    trail: Math.round(5 + Math.random() * 26),
    hue: Math.round(Math.random() * 359),
  };
}

function mutateGenome(g: Genome, amount: number, locked: Array<keyof Genome> = []): Genome {
  const next = { ...g };
  for (const gene of GENES) {
    if (locked.includes(gene.key)) continue;
    const range = gene.max - gene.min;
    let value = Number(g[gene.key]) + (Math.random() * 2 - 1) * range * amount;
    value = Math.max(gene.min, Math.min(gene.max, value));
    if (gene.step >= 1) value = Math.round(value);
    else value = +value.toFixed(2);
    next[gene.key] = value as never;
  }
  return next;
}

function randomGenomeWithLocks(g: Genome, locked: Array<keyof Genome>) {
  const next = randomGenome();
  locked.forEach(key => { next[key] = g[key] as never; });
  return next;
}

function isOverdrive(g: Genome) {
  return GENES.every(gene => Number(g[gene.key]) >= gene.max - gene.step / 2);
}

function genomeCharge(g: Genome) {
  return GENES.reduce((sum, gene) => sum + (Number(g[gene.key]) - gene.min) / (gene.max - gene.min), 0) / GENES.length;
}

function mathLuck(g: Genome, mode: MathMode = "sine", sequence: SequenceMode = "fibonacci", upgrades: UpgradeMap = EMPTY_UPGRADES) {
  const prime = [3, 5, 7, 11, 13].includes(g.symmetry) ? 4 : 0;
  const golden = Math.max(0, 5 - Math.abs(g.frequency - 3.236) * 2.2);
  const resonance = Math.abs(Math.sin(g.phase * g.frequency) * 5 + Math.cos(g.symmetry + g.pulse) * 4);
  const modePattern: Record<MathMode, number> = { circle: 1, ellipse: 2, triangle: 3, square: 3, pentagon: 4, hexagon: 4, star: 5, sine: 1, cosine: 2, rose: 4, spiral: 3, superformula: 5, cardioid: 3, lemniscate: 5, lissajous: 4, hypotrochoid: 5, epitrochoid: 4, fourier: 6, fibonacci: 7, mobius: 6, gaussian: 4, butterfly: 7, mandelbrot: 8 };
  const sequenceBonus = sequence === "primes" ? 5 : sequence === "collatz" ? 2 : 1;
  return Math.min(40, Math.round(3 + prime + golden + resonance + modePattern[mode] + sequenceBonus + (upgrades.prime_lens || 0) * 3 + (upgrades.chaos_attractor || 0) * 2));
}

function formulaEquation(mode: MathMode, g: Genome) {
  if (mode === "circle") return `x² + y² = ${g.amplitude.toFixed(0)}²`;
  if (mode === "ellipse") return `x²/${g.amplitude.toFixed(0)}² + y²/${Math.round(g.amplitude * .68)}² = 1`;
  if (mode === "triangle") return `P₃(r=${g.amplitude.toFixed(0)}, θ₀=${g.phase.toFixed(1)})`;
  if (mode === "square") return `P₄(r=${g.amplitude.toFixed(0)}, θ₀=${g.phase.toFixed(1)})`;
  if (mode === "pentagon") return `P₅(r=${g.amplitude.toFixed(0)}, θ₀=${g.phase.toFixed(1)})`;
  if (mode === "hexagon") return `P₆(r=${g.amplitude.toFixed(0)}, θ₀=${g.phase.toFixed(1)})`;
  if (mode === "star") return `r(θ) = ${g.amplitude.toFixed(0)}[.72 + .28 cos⁶(5θ)]`;
  if (mode === "cosine") return `r(θ,t) = ${g.amplitude.toFixed(0)}[1 + .24 cos(${g.symmetry}θ + ${g.pulse.toFixed(2)}t)]`;
  if (mode === "rose") return `r(θ) = ${g.amplitude.toFixed(0)} |cos(${g.symmetry}θ / 2)| + η(${g.noise.toFixed(2)})`;
  if (mode === "spiral") return `r(θ,t) = ${Math.round(g.amplitude * .45)} + ${Math.round(g.amplitude * .09)}θ + sin(${g.frequency.toFixed(1)}t)`;
  if (mode === "superformula") return `r(θ) = G(m=${g.symmetry}, n=${(1 + g.noise * 4).toFixed(1)}) · ${g.amplitude.toFixed(0)}`;
  if (mode === "cardioid") return `r(θ) = ${g.amplitude.toFixed(0)}(1 − cos θ)`;
  if (mode === "lemniscate") return `r²(θ) = ${Math.round(g.amplitude ** 2)} cos(2θ)`;
  if (mode === "lissajous") return `x=sin(${g.symmetry}t+${g.phase.toFixed(1)}), y=sin(${Math.max(2, Math.round(g.frequency))}t)`;
  if (mode === "hypotrochoid") return `H(R=${g.symmetry + 4}, r=${Math.max(2, Math.round(g.frequency))}, d=${Math.round(g.amplitude / 18)})`;
  if (mode === "epitrochoid") return `E(R=${g.symmetry + 3}, r=${Math.max(2, Math.round(g.frequency))}, d=${Math.round(g.amplitude / 20)})`;
  if (mode === "fourier") return `r(θ) = Σₙ₌₁⁴ sin(n·${g.symmetry}θ + φ) / n`;
  if (mode === "fibonacci") return `r(θ) = φ^(θ/2π) · [1 + .13 sin(${g.symmetry}θ)]`;
  if (mode === "mobius") return `M(u,v) = [(1+v cos(u/2))cos u, …]`;
  if (mode === "gaussian") return `r(θ) = Σ exp(−(θ−μₖ)² / 2σ²)`;
  if (mode === "butterfly") return `r(θ)=e^sinθ−2cos(4θ)+sin⁵((2θ−π)/24)`;
  if (mode === "mandelbrot") return `zₙ₊₁ = zₙ² + c • boundary depth ${Math.round(2 + g.noise * 6)}`;
  return `r(θ,t) = ${g.amplitude.toFixed(0)}[1 + .24 sin(${g.symmetry}θ + ${g.pulse.toFixed(2)}t)] + η(${g.noise.toFixed(2)})`;
}

function curvePoint(mode: MathMode, g: Genome, a: number, index: number, count: number) {
  const polygon = (sides: number) => {
    const sector = ((a + Math.PI / sides) % (Math.PI * 2 / sides)) - Math.PI / sides;
    return Math.cos(Math.PI / sides) / Math.max(.15, Math.cos(sector));
  };
  if (mode === "circle") return { x: Math.cos(a), y: Math.sin(a) };
  if (mode === "ellipse") return { x: Math.cos(a) * 1.25, y: Math.sin(a) * .72 };
  if (["triangle", "square", "pentagon", "hexagon"].includes(mode)) {
    const sides = { triangle: 3, square: 4, pentagon: 5, hexagon: 6 }[mode as "triangle" | "square" | "pentagon" | "hexagon"];
    const r = polygon(sides); return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
  if (mode === "star") { const r = .66 + .38 * Math.pow(Math.abs(Math.cos(5 * a)), 6); return { x: Math.cos(a) * r, y: Math.sin(a) * r }; }
  if (mode === "lemniscate") { const denominator = 1 + Math.sin(a) ** 2; return { x: Math.cos(a) / denominator * 1.35, y: Math.sin(a) * Math.cos(a) / denominator * 1.35 }; }
  if (mode === "lissajous") return { x: Math.sin(g.symmetry * a + g.phase), y: Math.sin(Math.max(2, Math.round(g.frequency)) * a) };
  if (mode === "hypotrochoid" || mode === "epitrochoid") {
    const inner = Math.max(2, Math.round(g.frequency)); const outer = g.symmetry + (mode === "epitrochoid" ? 3 : 4); const d = 1.4 + g.noise * 2.4;
    const sign = mode === "epitrochoid" ? 1 : -1; const ratio = (outer + sign * inner) / inner; const scale = Math.max(outer + inner + d, 1);
    return { x: ((outer + sign * inner) * Math.cos(a) - sign * d * Math.cos(ratio * a)) / scale, y: ((outer + sign * inner) * Math.sin(a) - d * Math.sin(ratio * a)) / scale };
  }
  let r = 1;
  if (mode === "sine") r = 1 + .24 * Math.sin(a * g.symmetry + g.phase);
  if (mode === "cosine") r = 1 + .24 * Math.cos(a * g.symmetry + g.phase);
  if (mode === "rose") r = .34 + .92 * Math.abs(Math.cos(a * g.symmetry / 2));
  if (mode === "spiral") r = .28 + index / count * .9;
  if (mode === "superformula") { const n = 1 + g.noise * 4; r = Math.min(1.45, Math.max(.4, Math.pow(Math.pow(Math.abs(Math.cos(g.symmetry * a / 4)), n) + Math.pow(Math.abs(Math.sin(g.symmetry * a / 4)), n), -1 / Math.max(1, n)))); }
  if (mode === "cardioid") r = .3 + .52 * (1 - Math.cos(a));
  if (mode === "lemniscate") r = .2 + .95 * Math.sqrt(Math.abs(Math.cos(2 * a)));
  if (mode === "fourier") r = 1 + .2 * Math.sin(g.symmetry * a) + .1 * Math.sin((g.symmetry + 2) * a) + .06 * Math.sin((g.symmetry + 5) * a);
  if (mode === "fibonacci") r = .35 + index / count * .82 + .12 * Math.sin(g.symmetry * a);
  if (mode === "mobius") r = .86 + .24 * Math.cos(a / 2) + .1 * Math.sin(g.symmetry * a);
  if (mode === "gaussian") { const folded = ((a * g.symmetry / (Math.PI * 2)) % 1) - .5; r = .48 + .9 * Math.exp(-folded * folded * (10 + g.frequency)); }
  if (mode === "butterfly") r = .7 + .16 * (Math.exp(Math.sin(a)) - 2 * Math.cos(4 * a) + Math.pow(Math.sin((2 * a - Math.PI) / 24), 5));
  if (mode === "mandelbrot") r = .84 + .2 * Math.sin(g.symmetry * a + .65 * Math.sin(3 * a + .45 * Math.sin(7 * a))) + .07 * Math.sin(13 * a);
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

function FunctionDiagram({ mode, genome }: { mode: MathMode; genome: Genome }) {
  const count = 220; const raw = Array.from({ length: count + 1 }, (_, index) => curvePoint(mode, genome, index / count * Math.PI * 2, index, count));
  const extent = Math.max(...raw.flatMap(point => [Math.abs(point.x), Math.abs(point.y)]), .01);
  const points = raw.map(point => `${210 + point.x / extent * 104},${140 - point.y / extent * 104}`).join(" ");
  return <svg className="function-diagram" viewBox="0 0 420 280" role="img" aria-label={`Coordinate plot of the ${MATH_MODES.find(item => item.id === mode)?.label} function`}>
    <defs><radialGradient id="diagramGlow"><stop offset="0" stopColor={`hsl(${genome.hue} 90% 65% / .24)`}/><stop offset="1" stopColor={`hsl(${genome.hue} 90% 55% / 0)`}/></radialGradient></defs>
    <rect width="420" height="280" fill="url(#diagramGlow)"/>
    {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 52.5} x2={i * 52.5} y1="0" y2="280" className="diagram-grid"/>)}
    {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1="0" x2="420" y1={i * 46.66} y2={i * 46.66} className="diagram-grid"/>)}
    <line x1="0" x2="420" y1="140" y2="140" className="diagram-axis"/><line x1="210" x2="210" y1="0" y2="280" className="diagram-axis"/>
    <circle cx="210" cy="140" r="104" className="diagram-reference"/><polyline points={points} className="diagram-curve" style={{ "--plot-hue": genome.hue } as React.CSSProperties}/>
    <text x="400" y="133">x</text><text x="218" y="16">y</text><text x="218" y="154">0</text>
  </svg>;
}

function chargedGenome(g: Genome, locked: Array<keyof Genome>) {
  const next = { ...g };
  GENES.forEach(gene => {
    if (locked.includes(gene.key)) return;
    const progress = Number(g[gene.key]);
    const value = progress + (gene.max - progress) * (.12 + Math.random() * .13);
    next[gene.key] = (gene.step >= 1 ? Math.round(value) : +value.toFixed(2)) as never;
  });
  return next;
}

function rankFor(xp: number) {
  if (xp >= 700) return { name: "CHIEF XENOBIOLOGIST", level: 5, next: 700 };
  if (xp >= 400) return { name: "EVOLUTION ARCHITECT", level: 4, next: 700 };
  if (xp >= 200) return { name: "GENOME ANALYST", level: 3, next: 400 };
  if (xp >= 75) return { name: "FIELD RESEARCHER", level: 2, next: 200 };
  return { name: "LAB ASSISTANT", level: 1, next: 75 };
}

function compatibilityOf(a?: Specimen, b?: Specimen) {
  if (!a || !b) return 0;
  const distance = GENES.reduce((sum, gene) => sum + Math.abs(a.genome[gene.key] - b.genome[gene.key]) / (gene.max - gene.min), 0) / GENES.length;
  return Math.round((1 - distance) * 100);
}

function fighterStats(g: Genome, bond = 0, training: Training = EMPTY_TRAINING, ascension = 0, mode: MathMode = "sine", sequence: SequenceMode = "fibonacci", upgrades: UpgradeMap = EMPTY_UPGRADES): FighterStats {
  const charge = genomeCharge(g); const luck = mathLuck(g, mode, sequence, upgrades); const omega = isOverdrive(g) ? 1 : 0;
  const universal = (upgrades.golden_core || 0) * 2 + (upgrades.euler_heart || 0) * 4;
  const fractal = 1 + (upgrades.fractal_memory || 0) * .08;
  const hp = Math.round(82 + charge * 72 + bond * .18 + training.vitality * 3 * fractal + ascension * 12 + omega * 20 + (upgrades.integral_membrane || 0) * 13 + (sequence === "fibonacci" ? 10 : 0) + universal);
  const power = Math.round(10 + charge * 27 + training.power * 1.55 * fractal + bond * .07 + ascension * 3 + omega * 8 + (upgrades.derivative_spines || 0) * 5 + (upgrades.chaos_attractor || 0) * 3 + (sequence === "collatz" ? 4 : 0) + universal);
  const defense = Math.round(8 + charge * 23 + training.defense * 1.4 * fractal + bond * .06 + ascension * 3 + omega * 7 + (upgrades.vector_field || 0) * 5 + (sequence === "pascal" ? 5 : 0) + universal);
  const speed = Math.round(7 + charge * 18 + training.speed * 1.25 * fractal + bond * .05 + ascension * 2 + omega * 5 + (sequence === "harmonic" ? 5 : 0) + universal);
  const rating = Math.round(90 + charge * 175 + bond * .38 + (training.vitality + training.power + training.defense + training.speed) * 1.7 * fractal + ascension * 25 + luck * .7 + omega * 80 + Object.values(upgrades).reduce((a, b) => a + b, 0) * 10);
  return { hp, power, defense, speed, rating, luck, charge: Math.round(charge * 100) };
}

function statsOf(specimen: Specimen) {
  return fighterStats(specimen.genome, specimen.bond || 0, specimen.training || EMPTY_TRAINING, specimen.ascension || 0, specimen.mathMode || "sine", specimen.sequence || "fibonacci", specimen.upgrades || EMPTY_UPGRADES);
}

function familyAbility(family: string) {
  return ({
    Harmonic: ["Resonance Beam", "Focused harmonic damage that pierces defense"],
    Orbital: ["Gravity Sling", "Heavy impact with a chance to evade retaliation"],
    Radiant: ["Lattice Bloom", "Repairs vitality and raises a luminous shield"],
    Pulsar: ["Nova Pulse", "Massive damage with a small recoil cost"],
    Drifter: ["Temporal Echo", "Strikes twice from two points in time"],
    Fractail: ["Branch Cascade", "A branching three-hit combination"],
    Glitchling: ["Reality Tear", "Wild damage that ignores most defenses"],
    Voidborn: ["Entropy Drain", "Steals vitality from the opposing genome"],
  } as Record<string, [string, string]>)[family] || ["Genome Surge", "A concentrated burst of evolutionary energy"];
}

function combatMove(attacker: Specimen, defender: Specimen, action: "strike" | "ability") {
  const atk = statsOf(attacker); const def = statsOf(defender);
  const variance = .82 + Math.random() * .36; const critical = Math.random() < .04 + atk.luck / 180;
  const result = (damage: number, heal: number, recoil: number, guard: boolean, label: string) => ({ damage: Math.max(3, Math.round(damage * variance * (critical ? 1.55 : 1))), heal, recoil, guard, label, critical });
  if (action === "strike") return result(atk.power - def.defense * .34, 0, 0, false, "Genome strike");
  const family = familyOf(attacker.genome); const label = familyAbility(family)[0];
  if (family === "Radiant") return result(atk.power * .45, Math.round(atk.hp * .19), 0, true, label);
  if (family === "Pulsar") return result(atk.power * 1.82 - def.defense * .25, 0, Math.round(atk.hp * .07), false, label);
  if (family === "Drifter") return result(atk.power * 1.45 - def.defense * .22, 0, 0, true, label);
  if (family === "Fractail") return result(atk.power * 1.65 - def.defense * .28, 0, 0, false, label);
  if (family === "Glitchling") return result(atk.power * (1.2 + Math.random() * .85), 0, 0, false, label);
  if (family === "Voidborn") { const damage = Math.max(7, atk.power * 1.36 - def.defense * .16); return result(damage, Math.round(damage * .55), 0, false, label); }
  if (family === "Orbital") return result(atk.power * 1.55 - def.defense * .24, 0, 0, Math.random() > .45, label);
  return result(atk.power * 1.5 - def.defense * .12, 0, 0, false, label);
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function CreatureCanvas({ genome, mathMode, sequence, upgrades, tool, onMood, onExperiment }: { genome: Genome; mathMode: MathMode; sequence: SequenceMode; upgrades: UpgradeMap; tool: Tool; onMood: (m: string) => void; onExperiment: (type: Tool) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const genomeRef = useRef(genome);
  const mathModeRef = useRef(mathMode);
  const sequenceRef = useRef(sequence);
  const upgradesRef = useRef(upgrades);
  const toolRef = useRef(tool);
  const moodRef = useRef("CALM");
  const pointer = useRef({ x: 0, y: 0, active: false, speed: 0 });
  const stimuli = useRef<Stimulus[]>([]);
  const body = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const trail = useRef<Array<{ x: number; y: number }>>([]);
  const current = useRef({ ...genome });

  useEffect(() => { genomeRef.current = genome; }, [genome]);
  useEffect(() => { mathModeRef.current = mathMode; }, [mathMode]);
  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  useEffect(() => { upgradesRef.current = upgrades; }, [upgrades]);
  useEffect(() => { toolRef.current = tool; }, [tool]);

  const setMood = useCallback((m: string) => {
    if (moodRef.current !== m) {
      moodRef.current = m;
      onMood(m);
    }
  }, [onMood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    let last = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      w = box.width; h = box.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!body.current.x) { body.current.x = w / 2; body.current.y = h / 2; }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const noiseAt = (i: number, t: number, n: number) => Math.sin(i * 12.17 + Math.sin(i * 3.1) * 4 + t * 0.8) * n;

    const drawStimuli = () => {
      stimuli.current = stimuli.current.filter(s => s.life > 0);
      for (const s of stimuli.current) {
        s.life -= 0.004;
        const color = s.type === "nutrient" ? "93,255,176" : s.type === "light" ? "255,225,122" : s.type === "gravity" ? "177,128,255" : "255,91,174";
        const radius = (1 - s.life) * 32 + 8;
        ctx.beginPath(); ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color},${Math.max(0, s.life) * .65})`; ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath(); ctx.arc(s.x, s.y, 3 + Math.sin(s.life * 20) * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${Math.max(0, s.life)})`; ctx.fill();
      }
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 2); last = now;
      const t = now / 1000;
      const target = genomeRef.current;
      for (const key of Object.keys(target) as Array<keyof Genome>) current.current[key] = lerp(current.current[key], target[key], 0.055);
      const g = current.current;
      ctx.clearRect(0, 0, w, h);

      // laboratory grid and roaming micro-particles
      ctx.save();
      ctx.strokeStyle = "rgba(122, 235, 225, .045)"; ctx.lineWidth = 1;
      for (let x = 24; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 24; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let i = 0; i < 24; i++) {
        const px = (i * 83.7 + t * (3 + i % 4)) % w;
        const py = (i * 47.3 + Math.sin(t * .3 + i) * 22 + h) % h;
        ctx.fillStyle = `hsla(${(g.hue + i * 7) % 360},90%,70%,${.08 + (i % 3) * .03})`;
        ctx.fillRect(px, py, 1.2, 1.2);
      }
      ctx.restore();

      const b = body.current;
      let ax = Math.sin(t * .43) * .006 * g.orbit;
      let ay = Math.cos(t * .37) * .006 * g.orbit;
      if (pointer.current.active) {
        const dx = pointer.current.x - b.x, dy = pointer.current.y - b.y;
        const dist = Math.max(40, Math.hypot(dx, dy));
        const flee = pointer.current.speed > 25 ? -1.5 : .55;
        ax += dx / dist * .012 * flee; ay += dy / dist * .012 * flee;
        setMood(flee < 0 ? "STARTLED" : "CURIOUS");
      }
      for (const s of stimuli.current) {
        const dx = s.x - b.x, dy = s.y - b.y, dist = Math.max(28, Math.hypot(dx, dy));
        const force = s.type === "nutrient" ? .025 : s.type === "gravity" ? .045 : s.type === "chaos" ? -.02 : .012;
        ax += dx / dist * force; ay += dy / dist * force;
      }
      b.vx = (b.vx + ax * dt) * .985; b.vy = (b.vy + ay * dt) * .985;
      b.x += b.vx * dt; b.y += b.vy * dt;
      const margin = 90;
      if (b.x < margin) b.vx += .08; if (b.x > w - margin) b.vx -= .08;
      if (b.y < margin) b.vy += .08; if (b.y > h - margin) b.vy -= .08;
      trail.current.unshift({ x: b.x, y: b.y }); trail.current = trail.current.slice(0, Math.round(g.trail));

      // temporal trail
      trail.current.forEach((p, i) => {
        if (i < 2) return;
        const alpha = (1 - i / trail.current.length) * .12;
        ctx.beginPath(); ctx.arc(p.x, p.y, 16 * (1 - i / trail.current.length), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${g.hue},90%,65%,${alpha})`; ctx.fill();
      });

      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.sin(t * .23) * .12 + g.phase * .06);
      const pulse = 1 + Math.sin(t * g.pulse * 2.2) * .08;
      const points = Math.max(48, Math.round(g.complexity));
      const color2 = (g.hue + 70 + g.frequency * 8) % 360;
      const mode = mathModeRef.current;
      const activeSequence = sequenceRef.current;
      const activeUpgrades = upgradesRef.current;

      // orbital sensory cells
      const orbiters = Math.min(7, Math.max(2, Math.floor(g.symmetry / 2)));
      for (let i = 0; i < orbiters; i++) {
        const a = t * (.18 + g.orbit * .35) + i * Math.PI * 2 / orbiters;
        const rr = g.amplitude * (1.5 + (i % 2) * .25);
        const ox = Math.cos(a) * rr, oy = Math.sin(a) * rr * .7;
        ctx.beginPath(); ctx.arc(ox, oy, 2.5 + g.noise * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${color2},95%,70%,.75)`; ctx.shadowColor = `hsl(${color2},90%,60%)`; ctx.shadowBlur = 12; ctx.fill();
      }

      // sequence reactor particles: each number family creates a different orbital rhythm
      const sequenceNodes = activeSequence === "primes" ? [2, 3, 5, 7, 11] : activeSequence === "pascal" ? [1, 3, 3, 1] : activeSequence === "collatz" ? [8, 4, 2, 1] : activeSequence === "harmonic" ? [1, .5, .333, .25, .2] : [1, 1, 2, 3, 5, 8];
      sequenceNodes.forEach((value, i) => {
        const a = i * 2.399963 + t * (.08 + g.orbit * .12);
        const rr = g.amplitude * (1.18 + Math.min(1.2, Number(value) / 9));
        ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr * .72, 1.2 + (i % 3) * .45, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(color2 + i * 13) % 360},100%,78%,.48)`; ctx.fill();
      });

      // translucent outer membrane
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const a = i / points * Math.PI * 2;
        const basicWave = mode === "cosine" ? Math.cos(a * g.symmetry + t * g.pulse + g.phase) : Math.sin(a * g.symmetry + t * g.pulse + g.phase);
        const rose = Math.abs(Math.cos(a * g.symmetry / 2 + t * .12));
        const spiral = .72 + (i / points) * .45 + Math.sin(a * 2 - t * .4) * .05;
        const n = 1 + g.noise * 4;
        const superRadius = Math.pow(Math.pow(Math.abs(Math.cos(g.symmetry * a / 4)), n) + Math.pow(Math.abs(Math.sin(g.symmetry * a / 4)), n), -1 / Math.max(1, n));
        let modeShape = mode === "rose" ? .42 + rose * .88 : mode === "spiral" ? spiral : mode === "superformula" ? Math.min(1.45, Math.max(.5, superRadius)) : 1 + basicWave * .24;
        if (mode === "circle" || mode === "ellipse") modeShape = 1;
        if (["triangle", "square", "pentagon", "hexagon"].includes(mode)) {
          const sides = { triangle: 3, square: 4, pentagon: 5, hexagon: 6 }[mode as "triangle" | "square" | "pentagon" | "hexagon"];
          const sector = ((a + Math.PI / sides) % (Math.PI * 2 / sides)) - Math.PI / sides;
          modeShape = Math.cos(Math.PI / sides) / Math.max(.15, Math.cos(sector));
        }
        if (mode === "star") modeShape = .66 + .38 * Math.pow(Math.abs(Math.cos(5 * a)), 6);
        if (mode === "cardioid") modeShape = .52 + .52 * (1 - Math.cos(a));
        if (mode === "lemniscate") modeShape = .38 + .95 * Math.sqrt(Math.abs(Math.cos(2 * a)));
        if (mode === "fourier") modeShape = 1 + .19 * Math.sin(g.symmetry * a + t * .3) + .12 * Math.sin((g.symmetry + 2) * a) / 2 + .08 * Math.sin((g.symmetry + 5) * a) / 3;
        if (mode === "fibonacci") modeShape = .7 + (i / points) * .52 + .14 * Math.sin(g.symmetry * a + 1.618 * t);
        if (mode === "mobius") modeShape = .88 + .24 * Math.cos(a / 2 + t * .15) + .12 * Math.sin(g.symmetry * a);
        if (mode === "gaussian") { const folded = ((a * g.symmetry / (Math.PI * 2)) % 1) - .5; modeShape = .58 + .9 * Math.exp(-folded * folded * (10 + g.frequency)); }
        if (mode === "butterfly") modeShape = .74 + .16 * (Math.exp(Math.sin(a)) - 2 * Math.cos(4 * a) + Math.pow(Math.sin((2 * a - Math.PI) / 24), 5));
        if (mode === "mandelbrot") modeShape = .86 + .18 * Math.sin(g.symmetry * a + .65 * Math.sin(3 * a + .45 * Math.sin(7 * a))) + .08 * Math.sin(13 * a + t * .2);
        const isBasic = atlasGroup(mode) === "BASIC";
        const harmonic = Math.sin(a * g.frequency * 2 - t * .6) * .08 * (isBasic ? .22 : 1);
        const ragged = noiseAt(i, t, g.noise) * .20 * (isBasic ? .28 : 1);
        const r = g.amplitude * pulse * (modeShape + harmonic + ragged);
        let x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (mode === "ellipse") { x *= 1.22; y *= .7; }
        if (mode === "lemniscate") { const denominator = 1 + Math.sin(a) ** 2; x = g.amplitude * pulse * Math.cos(a) / denominator * 1.35; y = g.amplitude * pulse * Math.sin(a) * Math.cos(a) / denominator * 1.35; }
        if (mode === "lissajous") { x = Math.sin(g.symmetry * a + g.phase + t * .08) * g.amplitude * pulse; y = Math.sin(Math.max(2, Math.round(g.frequency)) * a) * g.amplitude * pulse; }
        if (mode === "hypotrochoid" || mode === "epitrochoid") {
          const inner = Math.max(2, Math.round(g.frequency)); const outer = g.symmetry + (mode === "epitrochoid" ? 3 : 4); const d = 1.4 + g.noise * 2.4;
          const sign = mode === "epitrochoid" ? 1 : -1; const ratio = (outer + sign * inner) / inner;
          x = g.amplitude * .42 * ((outer + sign * inner) * Math.cos(a) - sign * d * Math.cos(ratio * a + t * .05));
          y = g.amplitude * .42 * ((outer + sign * inner) * Math.sin(a) - d * Math.sin(ratio * a + t * .05));
          const maxExtent = g.amplitude * Math.max(4, outer) * .42; x *= g.amplitude * 1.25 / maxExtent; y *= g.amplitude * 1.25 / maxExtent;
        }
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, g.amplitude * 1.35);
      grad.addColorStop(0, `hsla(${color2},95%,68%,.32)`);
      grad.addColorStop(.48, `hsla(${g.hue},88%,55%,.14)`);
      grad.addColorStop(1, `hsla(${g.hue},90%,50%,.025)`);
      ctx.fillStyle = grad; ctx.shadowColor = `hsla(${g.hue},100%,60%,.8)`; ctx.shadowBlur = 28; ctx.fill();
      ctx.strokeStyle = `hsla(${g.hue},92%,72%,.78)`; ctx.lineWidth = 1.4; ctx.stroke();

      // theorem upgrades appear as a second mathematical anatomy layer
      const theoremLevel = Object.values(activeUpgrades).reduce((sum, level) => sum + level, 0);
      if (theoremLevel > 0) {
        ctx.beginPath();
        for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; const rr = g.amplitude * (1.12 + .05 * Math.sin(a * (3 + (activeUpgrades.prime_lens || 0) * 2) - t)); const x = Math.cos(a) * rr; const y = Math.sin(a) * rr; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.closePath(); ctx.setLineDash([2 + (activeUpgrades.vector_field || 0), 5]); ctx.strokeStyle = `hsla(${color2},100%,78%,${.14 + Math.min(.28, theoremLevel * .018)})`; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      }

      // radial nervous system
      ctx.shadowBlur = 9; ctx.lineWidth = .8;
      for (let i = 0; i < Math.round(g.symmetry); i++) {
        const a = i * Math.PI * 2 / Math.round(g.symmetry) + Math.sin(t * .5) * .04;
        const end = g.amplitude * (1.05 + Math.sin(t * g.pulse + i) * .09);
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 15, Math.sin(a) * 15);
        const bend = Math.sin(t + i * 2.1) * 12 * g.noise;
        ctx.quadraticCurveTo(Math.cos(a) * end * .55 - Math.sin(a) * bend, Math.sin(a) * end * .55 + Math.cos(a) * bend, Math.cos(a) * end, Math.sin(a) * end);
        ctx.strokeStyle = `hsla(${(g.hue + i * 5) % 360},95%,72%,.42)`; ctx.stroke();
        ctx.beginPath(); ctx.arc(Math.cos(a) * end, Math.sin(a) * end, 1.5 + Math.sin(t * 2 + i) * .5, 0, Math.PI * 2); ctx.fillStyle = `hsla(${color2},100%,78%,.8)`; ctx.fill();
      }

      // nucleus and directional eyes
      const doubleNucleus = g.pulse > 2.15;
      [-1, ...(doubleNucleus ? [1] : [])].forEach((side, idx) => {
        const nx = doubleNucleus ? side * 9 : 0;
        const core = ctx.createRadialGradient(nx - 3, -3, 1, nx, 0, 17);
        core.addColorStop(0, "rgba(255,255,255,.95)"); core.addColorStop(.18, `hsla(${color2},100%,75%,.9)`); core.addColorStop(1, `hsla(${g.hue},100%,45%,.04)`);
        ctx.beginPath(); ctx.arc(nx, 0, 17 - idx * 2, 0, Math.PI * 2); ctx.fillStyle = core; ctx.shadowBlur = 20; ctx.fill();
      });
      const lookX = pointer.current.active ? Math.max(-4, Math.min(4, (pointer.current.x - b.x) / 30)) : Math.sin(t) * 2;
      const lookY = pointer.current.active ? Math.max(-4, Math.min(4, (pointer.current.y - b.y) / 30)) : Math.cos(t * .8) * 2;
      ctx.beginPath(); ctx.arc(lookX, lookY, 3.2, 0, Math.PI * 2); ctx.fillStyle = "rgba(3,14,19,.92)"; ctx.shadowBlur = 0; ctx.fill();
      ctx.restore();

      drawStimuli();
      if (!pointer.current.active && stimuli.current.length === 0 && Math.abs(b.vx) < .3) setMood(g.noise > .8 ? "UNSTABLE" : "CALM");
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); };
  }, [setMood]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  return (
    <canvas
      ref={canvasRef}
      aria-label="Animated mathematical creature habitat. Move the pointer to attract the organism, or choose an experiment tool and click to place it."
      role="img"
      onPointerEnter={(e) => { pointer.current.active = true; Object.assign(pointer.current, pointFromEvent(e)); }}
      onPointerLeave={() => { pointer.current.active = false; pointer.current.speed = 0; }}
      onPointerMove={(e) => {
        const p = pointFromEvent(e); const dx = p.x - pointer.current.x, dy = p.y - pointer.current.y;
        pointer.current.speed = Math.hypot(dx, dy); pointer.current.x = p.x; pointer.current.y = p.y;
      }}
      onPointerDown={(e) => {
        const p = pointFromEvent(e);
        if (toolRef.current !== "observe") {
          stimuli.current.push({ ...p, type: toolRef.current, life: 1 });
          onExperiment(toolRef.current);
          setMood(toolRef.current === "chaos" ? "UNSTABLE" : toolRef.current === "nutrient" ? "EXCITED" : "CURIOUS");
        } else setMood("STARTLED");
      }}
    />
  );
}

function CreatureGlyph({ genome }: { genome: Genome }) {
  return <span className="creature-glyph" style={{ "--hue": genome.hue, "--sym": genome.symmetry } as React.CSSProperties}><i /><b /></span>;
}

export default function Home() {
  const [genome, setGenome] = useState<Genome>(INITIAL);
  const [history, setHistory] = useState<Genome[]>([]);
  const [name, setName] = useState(creatureName(INITIAL));
  const [customNamed, setCustomNamed] = useState(false);
  const [draftName, setDraftName] = useState(creatureName(INITIAL));
  const [renaming, setRenaming] = useState(false);
  const [mathMode, setMathMode] = useState<MathMode>("sine");
  const [mathModesSeen, setMathModesSeen] = useState<MathMode[]>(["sine"]);
  const [atlasFilter, setAtlasFilter] = useState<"ALL" | "BASIC" | "CURVES" | "ADVANCED">("ALL");
  const [shapeExplainOpen, setShapeExplainOpen] = useState(false);
  const [geneHelp, setGeneHelp] = useState<keyof Genome | null>(null);
  const [sequence, setSequence] = useState<SequenceMode>("fibonacci");
  const [sequencesSeen, setSequencesSeen] = useState<SequenceMode[]>(["fibonacci"]);
  const [upgrades, setUpgrades] = useState<UpgradeMap>(EMPTY_UPGRADES);
  const [bond, setBond] = useState(0);
  const [training, setTraining] = useState<Training>(EMPTY_TRAINING);
  const [generation, setGeneration] = useState(1);
  const [ascension, setAscension] = useState(0);
  const [quantumEnergy, setQuantumEnergy] = useState(5);
  const [mood, setMood] = useState("CALM");
  const [tool, setTool] = useState<Tool>("observe");
  const [collection, setCollection] = useState<Specimen[]>([]);
  const [completed, setCompleted] = useState<string[]>(["prime"]);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [fieldTab, setFieldTab] = useState<"contracts" | "codex" | "theorems" | "protocol">("contracts");
  const [introOpen, setIntroOpen] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourRect, setTourRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [arenaOpen, setArenaOpen] = useState(false);
  const [battleFighterId, setBattleFighterId] = useState("current");
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [battleRecord, setBattleRecord] = useState<BattleRecord>({ wins: 0, losses: 0, streak: 0, bestStreak: 0 });
  const [arenaTab, setArenaTab] = useState<"battle" | "pass">("battle");
  const [battlePassPoints, setBattlePassPoints] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [unlockedAuras, setUnlockedAuras] = useState<string[]>([]);
  const [activeAura, setActiveAura] = useState("none");
  const [parents, setParents] = useState<string[]>([]);
  const [lockedGenes, setLockedGenes] = useState<Array<keyof Genome>>([]);
  const [xp, setXp] = useState(15);
  const [contractsDone, setContractsDone] = useState<string[]>([]);
  const [discoveredFamilies, setDiscoveredFamilies] = useState<string[]>(["Harmonic"]);
  const [discoveredTraits, setDiscoveredTraits] = useState<string[]>([]);
  const [toast, setToast] = useState("Specimen stable. Awaiting input.");
  const [sound, setSound] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  /* Local storage is an external system; this one-time synchronization intentionally restores client state after hydration. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("equationarium-archive");
      const goals = localStorage.getItem("equationarium-research");
      const career = localStorage.getItem("equationarium-career");
      const currentSpecimen = localStorage.getItem("equationarium-current-v2");
      if (!localStorage.getItem("equationarium-intro-v2")) setIntroOpen(true);
      if (saved) setCollection(JSON.parse(saved));
      if (goals) setCompleted(JSON.parse(goals));
      if (career) {
        const data = JSON.parse(career);
        setXp(data.xp || 0); setContractsDone(data.contractsDone || []);
        setDiscoveredFamilies(data.discoveredFamilies || []); setDiscoveredTraits(data.discoveredTraits || []);
        setBattleRecord(data.battleRecord || { wins: 0, losses: 0, streak: 0, bestStreak: 0 });
        setQuantumEnergy(data.quantumEnergy ?? 5); setBattlePassPoints(data.battlePassPoints || 0);
        setClaimedRewards(data.claimedRewards || []); setUnlockedAuras(data.unlockedAuras || []);
        setMathModesSeen(data.mathModesSeen || ["sine"]); setSequencesSeen(data.sequencesSeen || ["fibonacci"]);
      }
      if (currentSpecimen) {
        const data = JSON.parse(currentSpecimen);
        if (data.genome) setGenome(data.genome); if (data.name) { setName(data.name); setDraftName(data.name); }
        setCustomNamed(Boolean(data.customNamed)); setMathMode(data.mathMode || "sine"); setBond(data.bond || 0);
        setTraining(data.training || EMPTY_TRAINING); setGeneration(data.generation || 1); setAscension(data.ascension || 0);
        setActiveAura(data.activeAura || "none"); setSequence(data.sequence || "fibonacci"); setUpgrades(data.upgrades || EMPTY_UPGRADES);
      }
    } catch { /* private browsing can reject storage */ }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => { if (hydrated) localStorage.setItem("equationarium-archive", JSON.stringify(collection)); }, [collection, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("equationarium-research", JSON.stringify(completed)); }, [completed, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem("equationarium-career", JSON.stringify({ xp, contractsDone, discoveredFamilies, discoveredTraits, battleRecord, quantumEnergy, battlePassPoints, claimedRewards, unlockedAuras, mathModesSeen, sequencesSeen }));
  }, [xp, contractsDone, discoveredFamilies, discoveredTraits, battleRecord, quantumEnergy, battlePassPoints, claimedRewards, unlockedAuras, mathModesSeen, sequencesSeen, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem("equationarium-current-v2", JSON.stringify({ genome, name, customNamed, mathMode, sequence, upgrades, bond, training, generation, ascension, activeAura }));
  }, [genome, name, customNamed, mathMode, sequence, upgrades, bond, training, generation, ascension, activeAura, hydrated]);

  const family = useMemo(() => familyOf(genome), [genome]);
  const rarity = useMemo(() => rarityOf(genome), [genome]);
  const traits = useMemo(() => rareTraits(genome), [genome]);
  const personality = useMemo(() => personalities(genome), [genome]);
  const rank = useMemo(() => rankFor(xp), [xp]);
  const selectedParents = useMemo(() => parents.map(id => collection.find(s => s.id === id)).filter(Boolean) as Specimen[], [parents, collection]);
  const compatibility = useMemo(() => compatibilityOf(selectedParents[0], selectedParents[1]), [selectedParents]);
  const currentFighter = useMemo<Specimen>(() => ({ id: "current", name, genome, discoveredAt: 0, bond, mathMode, sequence, upgrades, training, generation, ascension, aura: activeAura }), [name, genome, bond, mathMode, sequence, upgrades, training, generation, ascension, activeAura]);
  const fighterChoices = useMemo(() => [currentFighter, ...collection], [currentFighter, collection]);
  const visibleMathModes = useMemo(() => MATH_MODES.filter(mode => atlasFilter === "ALL" || atlasGroup(mode.id) === atlasFilter), [atlasFilter]);
  const liveStats = useMemo(() => statsOf(currentFighter), [currentFighter]);
  const ascensionRequirements = useMemo(() => [
    { label: "Bond 60+", done: bond >= 60 }, { label: "Arena power 300+", done: liveStats.rating >= 300 },
    { label: "Win 3 arena battles", done: battleRecord.wins >= 3 }, { label: "Complete 2 contracts", done: contractsDone.length >= 2 },
    { label: "Synthesize a hybrid", done: completed.includes("hybrid") }, { label: "Store 50 Quantum Energy", done: quantumEnergy >= 50 },
  ], [bond, liveStats.rating, battleRecord.wins, contractsDone.length, completed, quantumEnergy]);
  const ascensionReady = ascensionRequirements.every(item => item.done);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShapeExplainOpen(false); setGeneHelp(null); setCollectionOpen(false); setResearchOpen(false); setFieldOpen(false); setArenaOpen(false); setIntroOpen(false); setTourActive(false);
    };
    window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const ping = useCallback((kind: "soft" | "rare" = "soft") => {
    if (!sound || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.setValueAtTime(kind === "rare" ? 520 : 240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(kind === "rare" ? 880 : 330, ctx.currentTime + .18);
      gain.gain.setValueAtTime(.05, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .25);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .26);
    } catch { /* sound is optional */ }
  }, [sound]);

  const mark = useCallback((id: string) => {
    setCompleted(c => c.includes(id) ? c : [...c, id]);
  }, []);

  const evaluateGenome = (next: Genome) => {
    if ([3, 5, 7, 11, 13].includes(next.symmetry)) mark("prime");
    if (next.noise < .05) mark("stable");
    if (next.noise > .9) mark("chaos");
    if (["Rare", "Epic", "Legendary", "Mythic"].includes(rarityOf(next))) mark("rare");

    const nextFamily = familyOf(next);
    if (!discoveredFamilies.includes(nextFamily)) {
      const families = [...discoveredFamilies, nextFamily];
      setDiscoveredFamilies(families); setXp(current => current + 15);
      if (families.length >= 4) mark("codex");
      setToast(`Codex updated — ${nextFamily} family documented (+15 XP)`);
    }
    const freshTraits = rareTraits(next).filter(trait => !discoveredTraits.includes(trait));
    if (freshTraits.length) {
      setDiscoveredTraits(current => [...current, ...freshTraits]); setXp(current => current + freshTraits.length * 25);
      setToast(`Anomaly documented — ${freshTraits[0]} (+${freshTraits.length * 25} XP)`);
    }
  };

  const changeGenome = (next: Genome, message = "Genome recalibrated") => {
    setHistory(h => [...h.slice(-9), genome]); setGenome(next); setName(creatureName(next)); setDraftName(creatureName(next)); setCustomNamed(false);
    setBond(0); setTraining(EMPTY_TRAINING); setGeneration(1); setAscension(0); setSequence("fibonacci"); setUpgrades(EMPTY_UPGRADES); setActiveAura("none");
    setToast(message); evaluateGenome(next); ping(rareTraits(next).length ? "rare" : "soft");
  };

  const updateGene = (key: keyof Genome, value: number) => {
    const next = { ...genome, [key]: value };
    setGenome(next); if (!customNamed) { setName(creatureName(next)); setDraftName(creatureName(next)); }
    setToast(`${GENES.find(g => g.key === key)?.label} adjusted${isOverdrive(next) ? " — OMEGA OVERDRIVE ACHIEVED" : ""}`); evaluateGenome(next);
  };

  const toggleGeneLock = (key: keyof Genome) => {
    setLockedGenes(current => {
      if (current.includes(key)) return current.filter(item => item !== key);
      if (current.length >= 3) { setToast("Maximum of three genome locks reached"); return current; }
      const next = [...current, key];
      setToast(`${GENES.find(g => g.key === key)?.label} locked for directed evolution`);
      if (next.length === 3) mark("lock");
      return next;
    });
  };

  const submitContract = (contract: Contract) => {
    const score = Math.min(100, contract.score(genome));
    if (contractsDone.includes(contract.id)) { setToast("Contract already completed"); return; }
    if (score < 75) { setToast(`${contract.title}: ${score}% match — reach 75% to submit`); ping(); return; }
    setContractsDone(current => [...current, contract.id]); setXp(current => current + contract.reward); setQuantumEnergy(current => current + 12);
    setToast(`${contract.title} completed — +${contract.reward} XP, +12 QE`); mark("contract"); ping("rare");
  };

  const selectMathMode = (mode: MathMode) => {
    const firstObservation = !mathModesSeen.includes(mode);
    setMathMode(mode); setMathModesSeen(current => {
      const next = current.includes(mode) ? current : [...current, mode]; if (next.length >= 18) mark("atlas"); if (next.length === MATH_MODES.length) mark("polymath"); return next;
    });
    if (firstObservation) { setXp(value => value + 4); setQuantumEnergy(value => value + 1); }
    setToast(`${MATH_MODES.find(item => item.id === mode)?.label} morphology engaged — Math Luck ${mathLuck(genome, mode, sequence, upgrades)}${firstObservation ? " • +4 XP, +1 QE" : ""}`); ping();
  };

  const selectSequence = (nextSequence: SequenceMode) => {
    const firstObservation = !sequencesSeen.includes(nextSequence);
    setSequence(nextSequence); setSequencesSeen(current => { const next = current.includes(nextSequence) ? current : [...current, nextSequence]; if (next.length === SEQUENCES.length) mark("sequence"); return next; });
    if (firstObservation) { setXp(value => value + 8); setQuantumEnergy(value => value + 2); }
    const item = SEQUENCES.find(entry => entry.id === nextSequence); setToast(`${item?.label} sequence encoded — ${item?.effect}${firstObservation ? " • +8 XP, +2 QE" : ""}`); ping("rare");
  };

  const buyUpgrade = (id: string) => {
    const upgrade = UPGRADES.find(item => item.id === id); if (!upgrade) return;
    const level = upgrades[id] || 0; if (level >= 3) { setToast(`${upgrade.name} is already at maximum theorem level`); return; }
    const cost = upgrade.base * (level + 1); if (quantumEnergy < cost) { setToast(`${upgrade.name} requires ${cost} Quantum Energy`); return; }
    const next = { ...upgrades, [id]: level + 1 }; setUpgrades(next); setQuantumEnergy(value => value - cost); setXp(value => value + 15 * (level + 1));
    if (level + 1 === 3) mark("theorem"); setToast(`${upgrade.name} advanced to level ${level + 1} — permanent development installed`); ping("rare");
  };

  const handleExperiment = (kind: Tool) => {
    if (kind === "observe") return;
    const gains: Record<Exclude<Tool, "observe">, { bond: number; stat: keyof Training; amount: number; label: string }> = {
      nutrient: { bond: 3, stat: "vitality", amount: 1, label: "Vitality" }, light: { bond: 2, stat: "speed", amount: 1, label: "Speed" },
      gravity: { bond: 2, stat: "defense", amount: 1, label: "Defense" }, chaos: { bond: 1, stat: "power", amount: 2, label: "Power" },
    };
    const gain = gains[kind]; const nextBond = Math.min(100, bond + gain.bond);
    const trainingGain = gain.amount + (upgrades.fractal_memory || 0);
    setBond(nextBond); setTraining(current => ({ ...current, [gain.stat]: Math.min(30, current[gain.stat] + trainingGain) }));
    setQuantumEnergy(current => current + 1); setToast(`${kind.toUpperCase()} complete — bond +${gain.bond}, ${gain.label} +${trainingGain}, QE +1`);
    if (nextBond >= 60) mark("bond"); ping();
  };

  const useChargedEvolution = () => {
    if (quantumEnergy < 12) { setToast("Charged Evolution requires 12 Quantum Energy"); return; }
    const next = chargedGenome(genome, lockedGenes); setQuantumEnergy(value => value - 12);
    setHistory(h => [...h.slice(-9), genome]); setGenome(next); if (!customNamed) { setName(creatureName(next)); setDraftName(creatureName(next)); }
    setToast("Charged Evolution complete — every unlocked gene moved toward maximum"); evaluateGenome(next); ping("rare");
  };

  const commitName = () => {
    const clean = draftName.trim().slice(0, 24); if (!clean) return;
    setName(clean); setDraftName(clean); setCustomNamed(true); setRenaming(false); setToast(`Companion registered as ${clean}`);
  };

  const saveSpecimen = () => {
    if (collection.length >= 12) { setToast("Archive full — release a specimen first"); return; }
    const specimen: Specimen = { id: `sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, name, genome: { ...genome }, discoveredAt: Date.now(), bond, mathMode, sequence, upgrades: { ...upgrades }, training: { ...training }, generation, ascension, aura: activeAura };
    const next = [specimen, ...collection]; setCollection(next); setXp(current => current + 5); setToast(`${name} preserved in the living archive (+5 XP)`); ping("rare");
    if (next.length >= 5) mark("archive");
    if (new Set(next.map(s => familyOf(s.genome))).size >= 3) mark("families");
  };

  const breed = () => {
    if (parents.length !== 2) { setToast("Select exactly two parent specimens"); return; }
    const [a, b] = parents.map(id => collection.find(s => s.id === id)!).filter(Boolean);
    if (!a || !b) return;
    const child = { ...INITIAL };
    for (const key of Object.keys(child) as Array<keyof Genome>) {
      const inherited = Math.random() > .5 ? a.genome[key] : b.genome[key];
      const gene = GENES.find(x => x.key === key)!;
      let value = inherited + (Math.random() * 2 - 1) * (gene.max - gene.min) * .045;
      value = Math.max(gene.min, Math.min(gene.max, value));
      child[key] = (gene.step >= 1 ? Math.round(value) : +value.toFixed(2)) as never;
    }
    const childMode = Math.random() > .5 ? (a.mathMode || "sine") : (b.mathMode || "sine"); const childSequence = Math.random() > .5 ? (a.sequence || "fibonacci") : (b.sequence || "fibonacci");
    setHistory(h => [...h.slice(-9), genome]); setGenome(child); setMathMode(childMode); setMathModesSeen(current => current.includes(childMode) ? current : [...current, childMode]);
    const childName = creatureName(child); setName(childName); setDraftName(childName); setCustomNamed(false); setBond(5);
    setTraining({ vitality: Math.floor(((a.training?.vitality || 0) + (b.training?.vitality || 0)) / 4), power: Math.floor(((a.training?.power || 0) + (b.training?.power || 0)) / 4), defense: Math.floor(((a.training?.defense || 0) + (b.training?.defense || 0)) / 4), speed: Math.floor(((a.training?.speed || 0) + (b.training?.speed || 0)) / 4) });
    const inheritedUpgrades: UpgradeMap = {}; UPGRADES.forEach(item => { const inherited = Math.floor(((a.upgrades?.[item.id] || 0) + (b.upgrades?.[item.id] || 0)) / 2); if (inherited) inheritedUpgrades[item.id] = inherited; });
    setSequence(childSequence); setSequencesSeen(current => current.includes(childSequence) ? current : [...current, childSequence]); setUpgrades(inheritedUpgrades);
    setGeneration(Math.max(a.generation || 1, b.generation || 1) + 1); setAscension(0); setActiveAura("none"); evaluateGenome(child);
    setToast(`Hybrid synthesis complete — ${compatibility}% compatibility, generation ${Math.max(a.generation || 1, b.generation || 1) + 1}`); setXp(current => current + 30); setQuantumEnergy(current => current + 8); setParents([]); setCollectionOpen(false); mark("hybrid"); ping("rare");
  };

  const closeIntro = () => {
    localStorage.setItem("equationarium-intro-v2", "complete");
    setIntroOpen(false); setIntroStep(0);
  };

  const beginTour = () => { setIntroOpen(false); setTourStep(0); setTourActive(true); };
  const finishTour = () => { localStorage.setItem("equationarium-intro-v2", "complete"); setTourActive(false); setTourRect(null); };

  useEffect(() => {
    if (!tourActive) return;
    const target = document.querySelector(`[data-tour="${TOUR_STEPS[tourStep].target}"]`) as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = window.setTimeout(() => { const rect = target.getBoundingClientRect(); setTourRect({ top: rect.top - 7, left: rect.left - 7, width: rect.width + 14, height: rect.height + 14 }); }, 280);
    return () => window.clearTimeout(timer);
  }, [tourActive, tourStep]);

  const claimPassReward = (reward: PassReward) => {
    if (battlePassPoints < reward.points || claimedRewards.includes(reward.tier)) return;
    setClaimedRewards(current => [...current, reward.tier]); if (reward.energy) setQuantumEnergy(current => current + reward.energy!); if (reward.xp) setXp(current => current + reward.xp!);
    if (reward.aura) { setUnlockedAuras(current => current.includes(reward.aura!) ? current : [...current, reward.aura!]); setActiveAura(reward.aura); }
    setToast(`Genome Pass tier ${reward.tier} claimed — ${reward.label}`); mark("pass"); ping("rare");
  };

  const ascendCreature = () => {
    if (!ascensionReady) { setToast("Ascension Protocol incomplete — finish every requirement"); return; }
    setQuantumEnergy(value => value - 50); setAscension(value => value + 1); setXp(value => value + 250); setActiveAura("prism");
    setUnlockedAuras(current => current.includes("prism") ? current : [...current, "prism"]); mark("ascend"); setToast(`${name} ASCENDED — permanent power unlocked`); setFieldOpen(false); ping("rare");
  };

  const startBattle = () => {
    const player = fighterChoices.find(fighter => fighter.id === battleFighterId) || currentFighter;
    const targetRating = statsOf(player).rating + (rank.level - 2) * 5;
    const candidates = Array.from({ length: 10 }, () => randomGenome());
    const enemyGenome = candidates.sort((a, b) => Math.abs(fighterStats(a).rating - targetRating) - Math.abs(fighterStats(b).rating - targetRating))[0];
    const enemyMode = MATH_MODES[Math.floor(Math.random() * MATH_MODES.length)].id;
    const enemy: Specimen = { id: `rival-${Date.now().toString(36)}`, name: `RIVAL ${creatureName(enemyGenome)}`, genome: enemyGenome, discoveredAt: Date.now(), bond: 10 + rank.level * 4, mathMode: enemyMode, sequence: SEQUENCES[Math.floor(Math.random() * SEQUENCES.length)].id, upgrades: rank.level >= 3 ? { [UPGRADES[Math.floor(Math.random() * UPGRADES.length)].id]: rank.level - 2 } : {}, training: { vitality: rank.level, power: rank.level, defense: rank.level, speed: rank.level }, generation: rank.level };
    const playerStats = statsOf(player); const enemyStats = statsOf(enemy);
    setBattle({
      player, enemy, playerHp: playerStats.hp, enemyHp: enemyStats.hp, playerGuard: false, enemyGuard: false,
      playerAbilityUsed: false, enemyAbilityUsed: false, turn: 1, status: "fighting",
      log: [`Arena link established. ${player.name} faces ${enemy.name}.`, `${playerStats.speed >= enemyStats.speed ? player.name : enemy.name} has the speed advantage.`],
    });
    ping("rare");
  };

  const playBattleTurn = (action: "strike" | "guard" | "ability") => {
    if (!battle || battle.status !== "fighting") return;
    const playerStats = statsOf(battle.player); const enemyStats = statsOf(battle.enemy);
    let playerHp = battle.playerHp; let enemyHp = battle.enemyHp;
    let playerGuard = false; let enemyGuard = false;
    let playerAbilityUsed = battle.playerAbilityUsed; let enemyAbilityUsed = battle.enemyAbilityUsed;
    const newLog: string[] = [];

    if (action === "guard") {
      const recovered = Math.round(playerStats.hp * .08);
      playerHp = Math.min(playerStats.hp, playerHp + recovered); playerGuard = true;
      newLog.push(`${battle.player.name} stabilizes its lattice, restoring ${recovered} vitality and raising guard.`);
    } else {
      const move = combatMove(battle.player, battle.enemy, action);
      const damage = Math.max(1, Math.round(move.damage * (battle.enemyGuard ? .52 : 1)));
      enemyHp = Math.max(0, enemyHp - damage); playerHp = Math.min(playerStats.hp, playerHp + move.heal - move.recoil);
      playerGuard = move.guard; if (action === "ability") playerAbilityUsed = true;
      newLog.push(`${battle.player.name} uses ${move.label} for ${damage} damage${move.critical ? " — CRITICAL RESONANCE!" : ""}${move.heal ? ` and absorbs ${move.heal} vitality` : ""}${move.recoil ? `, taking ${move.recoil} recoil` : ""}.`);
    }

    if (enemyHp <= 0) {
      const wins = battleRecord.wins + 1; const streak = battleRecord.streak + 1;
      const passGain = 20 + Math.min(5, streak) * 5;
      setBattle({ ...battle, playerHp, enemyHp: 0, playerGuard, enemyGuard: false, playerAbilityUsed, status: "won", turn: battle.turn + 1, log: [...newLog, `${battle.enemy.name}'s waveform collapses. Victory recorded.`, ...battle.log].slice(0, 12) });
      setBattleRecord({ wins, losses: battleRecord.losses, streak, bestStreak: Math.max(battleRecord.bestStreak, streak) });
      setBattlePassPoints(current => current + passGain); setQuantumEnergy(current => current + 3);
      setXp(current => current + 35 + rank.level * 5); setToast(`Arena victory — +${passGain} pass points (${streak}× streak), +3 QE`); mark("arena"); if (wins >= 3) mark("champion"); ping("rare"); return;
    }

    const enemyUsesAbility = !enemyAbilityUsed && (enemyHp < enemyStats.hp * .58 || Math.random() < .2);
    const enemyMove = combatMove(battle.enemy, battle.player, enemyUsesAbility ? "ability" : "strike");
    const enemyDamage = Math.max(1, Math.round(enemyMove.damage * (playerGuard ? .48 : 1)));
    playerHp = Math.max(0, playerHp - enemyDamage); enemyHp = Math.min(enemyStats.hp, enemyHp + enemyMove.heal - enemyMove.recoil);
    enemyGuard = enemyMove.guard; if (enemyUsesAbility) enemyAbilityUsed = true;
    newLog.push(`${battle.enemy.name} counters with ${enemyMove.label} for ${enemyDamage} damage${enemyMove.critical ? " — critical resonance" : ""}${playerGuard ? " through your guard" : ""}.`);

    if (playerHp <= 0) {
      setBattle({ ...battle, playerHp: 0, enemyHp, playerGuard: false, enemyGuard, playerAbilityUsed, enemyAbilityUsed, status: "lost", turn: battle.turn + 1, log: [...newLog, `${battle.player.name}'s waveform destabilizes. Rival victory.`, ...battle.log].slice(0, 12) });
      setBattleRecord({ wins: battleRecord.wins, losses: battleRecord.losses + 1, streak: 0, bestStreak: battleRecord.bestStreak });
      setXp(current => current + 8); setBattlePassPoints(current => current + 5); setToast("Battle telemetry recovered — +5 pass points"); ping(); return;
    }

    setBattle({ ...battle, playerHp, enemyHp, playerGuard, enemyGuard, playerAbilityUsed, enemyAbilityUsed, turn: battle.turn + 1, log: [...newLog, ...battle.log].slice(0, 12) });
    ping();
  };

  const exportGenome = () => {
    const blob = new Blob([JSON.stringify({ name, family, rarity, genome, mathMode, sequence, upgrades, bond, training, generation, ascension }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${name.toLowerCase()}.json`; a.click(); URL.revokeObjectURL(url); setToast("Genome data exported");
  };

  const tools: Array<{ id: Tool; icon: string; label: string }> = [
    { id: "observe", icon: "⌁", label: "Observe" }, { id: "nutrient", icon: "✦", label: "Nutrient" },
    { id: "light", icon: "☼", label: "Light" }, { id: "gravity", icon: "◉", label: "Gravity" }, { id: "chaos", icon: "⌇", label: "Chaos" },
  ];

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><span>∿</span></div><div><strong>EQUATIONARIUM</strong><small>PROCEDURAL LIFE LABORATORY</small></div></div>
        <button className="system-status mission-status" data-tour="purpose" onClick={() => { setFieldTab("protocol"); setFieldOpen(true); }}><span className="pulse-dot" /> ASCENSION {ascensionRequirements.filter(item => item.done).length}/6 <b>•</b> {quantumEnergy} QE</button>
        <nav>
          <button className="header-action arena-action" data-tour="arena" onClick={() => { setArenaOpen(true); setArenaTab("battle"); setBattle(null); }}><span>ARENA</span><b>{battleRecord.wins}W</b></button>
          <button className="header-action career-action" data-tour="field" onClick={() => setFieldOpen(true)}><span>FIELD LAB</span><b>LVL {rank.level}</b></button>
          <button className="header-action" data-tour="research" onClick={() => setResearchOpen(true)}><span>RESEARCH</span><b>{completed.length}/{OBJECTIVES.length}</b></button>
          <button className="header-action" data-tour="archive" onClick={() => setCollectionOpen(true)}><span>ARCHIVE</span><b>{collection.length}/12</b></button>
          <button className="icon-button help-button" aria-label="Open how to play guide" onClick={() => { setIntroStep(0); setIntroOpen(true); }}>?</button>
          <button className="icon-button" aria-label={sound ? "Mute generated sound" : "Enable generated sound"} onClick={() => setSound(!sound)}>{sound ? "◖))" : "◖×"}</button>
        </nav>
      </header>

      <section className="lab-grid">
        <aside className="panel genome-panel" data-tour="genome">
          <div className="panel-heading"><div><span className="eyebrow">CONTROL ARRAY</span><h2>Genome sequencer</h2></div><span className="panel-code">DNA-01</span></div>
          <div className="gene-list">
            {GENES.map((gene, index) => (
              <div className={`gene ${lockedGenes.includes(gene.key) ? "locked" : ""}`} key={gene.key}>
                <span><i>{String(index + 1).padStart(2, "0")}</i><label htmlFor={`gene-${gene.key}`}>{gene.label}</label><button className="gene-info" aria-label={`Explain ${gene.label}`} aria-expanded={geneHelp === gene.key} onClick={() => setGeneHelp(current => current === gene.key ? null : gene.key)}>i</button><button className="gene-lock" aria-label={`${lockedGenes.includes(gene.key) ? "Unlock" : "Lock"} ${gene.label}`} onClick={() => toggleGeneLock(gene.key)}>{lockedGenes.includes(gene.key) ? "◆" : "◇"}</button><output>{Number(genome[gene.key]).toFixed(gene.step < 1 ? 2 : 0)}{gene.unit}</output></span>
                <input id={`gene-${gene.key}`} type="range" min={gene.min} max={gene.max} step={gene.step} value={genome[gene.key]} onChange={e => updateGene(gene.key, Number(e.target.value))} />
                {geneHelp === gene.key && <div className="gene-help" role="note"><b>MATHEMATICALLY</b><p>{gene.math}</p><b>ON YOUR CREATURE</b><p>{gene.effect}</p></div>}
              </div>
            ))}
          </div>
          <div className="atlas-heading" data-tour="formula"><span>EQUATION ATLAS</span><b>{mathModesSeen.length}/{MATH_MODES.length} OBSERVED</b></div>
          <div className="atlas-filters">{(["ALL", "BASIC", "CURVES", "ADVANCED"] as const).map(filter => <button className={atlasFilter === filter ? "active" : ""} key={filter} onClick={() => setAtlasFilter(filter)}>{filter}</button>)}</div>
          <div className="formula-picker">{visibleMathModes.map(mode => <button className={mathMode === mode.id ? "active" : ""} title={`${mode.category}: ${mode.description}`} key={mode.id} onClick={() => selectMathMode(mode.id)}><small>{mode.category}</small><b>{mode.symbol}</b><span>{mode.label}</span></button>)}</div>
          <div className="lock-status"><span>{lockedGenes.length}/3 GENES LOCKED</span><small>Charge {liveStats.charge}% • Luck {liveStats.luck}</small></div>
          <div className="equation-card"><span>ACTIVE {MATH_MODES.find(mode => mode.id === mathMode)?.label.toUpperCase()} MORPHOLOGY</span><code>{formulaEquation(mathMode, genome)}</code><button className="explain-shape" onClick={() => setShapeExplainOpen(true)}>ⓘ WHY THIS SHAPE?</button></div>
          <div className="mutation-actions" data-tour="mutate">
            <button className="primary" onClick={() => changeGenome(randomGenomeWithLocks(genome, lockedGenes), lockedGenes.length ? `Macromutation complete — ${lockedGenes.length} genes preserved` : "Macromutation complete — new life signature")}><span>✣</span> MUTATE ALL</button>
            <button onClick={() => changeGenome(mutateGenome(genome, .055, lockedGenes), "Micro-mutation accepted")}><span>∿</span> MICRO</button>
            <button disabled={!history.length} onClick={() => { const last = history.at(-1); if (last) { setGenome(last); setName(creatureName(last)); setHistory(h => h.slice(0, -1)); setToast("Previous genome restored"); } }}><span>↶</span> UNDO</button>
            <button className="charged" onClick={useChargedEvolution}><span>ϟ</span> CHARGE <small>12 QE</small></button>
          </div>
        </aside>

        <section className="habitat-panel">
          <div className="habitat-topline">
            <div><span className="eyebrow">LIVE SPECIMEN • GEN {generation}</span><h1>{name}</h1></div>
            <div className={`rarity rarity-${rarity.toLowerCase()}`}><span>{rarity.toUpperCase()}</span><small>{family.toUpperCase()}</small></div>
          </div>
          <div className={`habitat-stage aura-${activeAura}`}>
            <div className="corner tl" /><div className="corner tr" /><div className="corner bl" /><div className="corner br" />
            <div className="stage-readout top-left">CAM / EQ-01<br/><b>LIVE FEED</b></div>
            <div className="stage-readout top-right">MOOD<br/><b>{mood}</b></div>
            <CreatureCanvas genome={genome} mathMode={mathMode} sequence={sequence} upgrades={upgrades} tool={tool} onMood={setMood} onExperiment={handleExperiment} />
            <div className="coordinate-readout">{formulaEquation(mathMode, genome)}</div>
          </div>
          <div className="tool-console" data-tour="habitat">
            <div className="tool-label"><span>HABITAT<br/>EXPERIMENTS</span><small>Select, then place in chamber</small></div>
            <div className="tools">{tools.map(t => <button key={t.id} className={tool === t.id ? "active" : ""} onClick={() => { setTool(t.id); setToast(t.id === "observe" ? "Observation mode enabled" : `${t.label} ready — click inside habitat`); }}><i>{t.icon}</i><span>{t.label}</span></button>)}</div>
          </div>
          <div className="toast" aria-live="polite"><span className="pulse-dot" /> {toast}</div>
        </section>

        <aside className="panel specimen-panel" data-tour="specimen">
          <div className="panel-heading"><div><span className="eyebrow">OBSERVATION LOG</span><h2>Specimen data</h2></div><span className="panel-code">BIO-7</span></div>
          <div className="identity-card">
            <CreatureGlyph genome={genome} />
            <div><span>CLASSIFICATION</span><h3>{family}</h3><p>{rarity} mathematical lifeform</p></div>
          </div>
          <div className="companion-card">
            {renaming ? <div className="rename-row"><input autoFocus value={draftName} onChange={event => setDraftName(event.target.value)} onKeyDown={event => event.key === "Enter" && commitName()} /><button onClick={commitName}>SAVE</button></div> : <div className="companion-name"><span><small>REGISTERED COMPANION</small><b>{name}</b></span><button onClick={() => { setDraftName(name); setRenaming(true); }}>RENAME</button></div>}
            <div className="bond-meter"><span>BOND <b>{bond}/100</b></span><i><em style={{ width: `${bond}%` }} /></i><small>{bond < 20 ? "NEWLY OBSERVED" : bond < 60 ? "GROWING TRUST" : bond < 100 ? "BONDED PARTNER" : "PERFECT SYNCHRONY"}</small></div>
            <div className="training-grid"><span>VIT <b>{training.vitality}</b></span><span>POW <b>{training.power}</b></span><span>DEF <b>{training.defense}</b></span><span>SPD <b>{training.speed}</b></span></div>
          </div>
          <div className="math-profile"><span className="section-label">MATHEMATICAL ANATOMY</span><div><b>{MATH_MODES.find(item => item.id === mathMode)?.symbol}</b><span><strong>{MATH_MODES.find(item => item.id === mathMode)?.label}</strong><small>{MATH_MODES.find(item => item.id === mathMode)?.category} MORPHOLOGY</small></span></div><div><b>Σ</b><span><strong>{SEQUENCES.find(item => item.id === sequence)?.label} reactor</strong><small>{SEQUENCES.find(item => item.id === sequence)?.effect}</small></span></div><div><b>∴</b><span><strong>{Object.values(upgrades).reduce((sum, level) => sum + level, 0)} theorem levels</strong><small>{Object.keys(upgrades).length} UPGRADE BRANCHES</small></span></div></div>
          <div className="data-section"><span className="section-label">BEHAVIORAL SIGNATURE</span><div className="trait-row">{personality.map(p => <span key={p}>{p}</span>)}</div><p>{descriptionFor(genome)}</p></div>
          <div className="data-section"><span className="section-label">ANOMALOUS TRAITS</span>{traits.length ? <div className="anomaly-list">{traits.map(t => <div key={t}><span>✦</span><div><b>{t}</b><small>Rare genomic expression</small></div></div>)}</div> : <div className="empty-anomaly"><span>◇</span>No anomalies detected.<br/>Continue mutating.</div>}</div>
          <div className="data-section metrics"><span className="section-label">LIVE METRICS</span><div><span>STABILITY</span><b>{Math.round((1 - genome.noise) * 100)}%</b><i style={{ width: `${(1 - genome.noise) * 100}%` }} /></div><div><span>ENERGY</span><b>{Math.round(genome.pulse / 2.4 * 100)}%</b><i style={{ width: `${genome.pulse / 2.4 * 100}%` }} /></div><div><span>COMPLEXITY</span><b>{Math.round((genome.complexity - 48) / 112 * 100)}%</b><i style={{ width: `${(genome.complexity - 48) / 112 * 100}%` }} /></div></div>
          <div className={`battle-rating ${isOverdrive(genome) ? "overdrive" : ""}`}><span>{isOverdrive(genome) ? "Ω OMEGA POWER" : "ARENA POWER"}</span><strong>{liveStats.rating}</strong><small>{familyAbility(family)[0]} • LUCK {liveStats.luck}</small></div>
          <div className="specimen-actions"><button className="save-button" onClick={saveSpecimen}>＋ PRESERVE SPECIMEN</button><button className="arena-launch" onClick={() => { setArenaOpen(true); setBattle(null); }}>⚔</button><button className="export-button" onClick={exportGenome}>⇩</button></div>
        </aside>
      </section>

      <footer><span>EQUATIONARIUM RESEARCH SYSTEM</span><p>Twenty-three equation families • five sequence reactors • eight theorem branches • infinite living forms.</p><b>FINAL RELEASE 2.1</b></footer>

      {shapeExplainOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setShapeExplainOpen(false); }}>
        <section className="modal explainer-modal" role="dialog" aria-modal="true" aria-label={`Why ${MATH_MODES.find(item => item.id === mathMode)?.label} looks this way`}>
          <div className="modal-header"><div><span className="eyebrow">MATHEMATICAL FIELD GUIDE</span><h2>Why does {name} look like this?</h2><p>See the exact curve beneath the living membrane.</p></div><button onClick={() => setShapeExplainOpen(false)}>×</button></div>
          <div className="explainer-grid">
            <div className="diagram-panel"><div className="diagram-label"><span>FUNCTION PLOT • x/y COORDINATES</span><b>{MATH_MODES.find(item => item.id === mathMode)?.category}</b></div><FunctionDiagram mode={mathMode} genome={genome}/><code>{formulaEquation(mathMode, genome)}</code><small>The faint circle is a unit-radius reference. The bright line is the selected equation using this creature’s current genes.</small></div>
            <div className="explanation-panel"><span>{MATH_MODES.find(item => item.id === mathMode)?.symbol}</span><h3>{MATH_MODES.find(item => item.id === mathMode)?.label}</h3><p className="shape-summary">{MATH_MODES.find(item => item.id === mathMode)?.description}</p><article><b>HOW THE FUNCTION DRAWS IT</b><p>{SHAPE_INSIGHTS[mathMode].explanation}</p></article><article><b>WHY THE CREATURE LOOKS THIS WAY</b><p>{SHAPE_INSIGHTS[mathMode].creature}</p></article><blockquote><b>DID YOU KNOW?</b>{SHAPE_INSIGHTS[mathMode].fact}</blockquote></div>
          </div>
          <div className="parameter-breakdown"><span><b>k = {genome.symmetry}</b> repeated sectors</span><span><b>A = {genome.amplitude}</b> body scale</span><span><b>ω = {genome.frequency.toFixed(1)}</b> oscillation rate</span><span><b>φ = {genome.phase.toFixed(2)}</b> angular shift</span><span><b>η = {genome.noise.toFixed(2)}</b> organic variation</span></div>
          <div className="explainer-selector"><div><span>COMPARE ANOTHER FUNCTION</span><small>The explanation and graph update immediately.</small></div><div>{MATH_MODES.map(mode => <button className={mathMode === mode.id ? "active" : ""} key={mode.id} title={mode.label} onClick={() => selectMathMode(mode.id)}>{mode.symbol}</button>)}</div></div>
        </section>
      </div>}

      {introOpen && <div className="modal-backdrop intro-backdrop">
        <section className="modal intro-modal" role="dialog" aria-modal="true" aria-label="How to play Equationarium">
          <div className="intro-progress">{INTRO_STEPS.map((_, index) => <span className={index <= introStep ? "active" : ""} key={index}>{String(index + 1).padStart(2, "0")}</span>)}</div>
          <div className="intro-content" key={introStep}>
            <div className="intro-symbol">{INTRO_STEPS[introStep].icon}</div>
            <span className="eyebrow">{INTRO_STEPS[introStep].eyebrow}</span>
            <h2>{INTRO_STEPS[introStep].title}</h2>
            <p>{INTRO_STEPS[introStep].body}</p>
            <div className="intro-tips">{INTRO_STEPS[introStep].tips.map(tip => <span key={tip}><b>✦</b>{tip}</span>)}</div>
          </div>
          <div className="intro-actions"><button onClick={closeIntro}>SKIP GUIDE</button><span>{introStep + 1} / {INTRO_STEPS.length}</span>{introStep > 0 && <button onClick={() => setIntroStep(step => step - 1)}>← BACK</button>}<button className="primary" onClick={() => introStep === INTRO_STEPS.length - 1 ? beginTour() : setIntroStep(step => step + 1)}>{introStep === INTRO_STEPS.length - 1 ? "START GUIDED TOUR →" : "CONTINUE →"}</button></div>
        </section>
      </div>}

      {tourActive && <div className="tour-layer" role="dialog" aria-modal="true" aria-label="Guided laboratory tour">
        {tourRect && <div className="tour-spotlight" style={tourRect} />}
        <section className={`tour-card ${tourRect && tourRect.left > 650 ? "left" : "right"}`}>
          <span>GUIDED ORIENTATION • {String(tourStep + 1).padStart(2, "0")}/{TOUR_STEPS.length}</span>
          <h2>{TOUR_STEPS[tourStep].title}</h2><p>{TOUR_STEPS[tourStep].body}</p>
          <div><button onClick={finishTour}>SKIP</button>{tourStep > 0 && <button onClick={() => setTourStep(step => step - 1)}>← BACK</button>}<button className="primary" onClick={() => tourStep === TOUR_STEPS.length - 1 ? finishTour() : setTourStep(step => step + 1)}>{tourStep === TOUR_STEPS.length - 1 ? "FINISH TOUR ✓" : "NEXT →"}</button></div>
        </section>
      </div>}

      {arenaOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setArenaOpen(false); }}>
        <section className="modal arena-modal" role="dialog" aria-modal="true" aria-label="Genome battle arena">
          <div className="modal-header"><div><span className="eyebrow">COMPETITIVE SIMULATION</span><h2>Genome Arena</h2><p>Equations become combat traits. Outsmart an adaptive rival to earn research XP.</p></div><button onClick={() => setArenaOpen(false)}>×</button></div>
          <div className="arena-tabs"><button className={arenaTab === "battle" ? "active" : ""} onClick={() => setArenaTab("battle")}>⚔ BATTLE DECK</button><button className={arenaTab === "pass" ? "active" : ""} onClick={() => { setArenaTab("pass"); setBattle(null); }}>✦ GENOME PASS <b>{battlePassPoints} GP</b></button></div>
          <div className="arena-record"><div><span>CAREER RECORD</span><strong>{battleRecord.wins}W <i>/</i> {battleRecord.losses}L</strong></div><div><span>WIN STREAK</span><strong>{battleRecord.streak}</strong></div><div><span>BEST STREAK</span><strong>{battleRecord.bestStreak}</strong></div><div><span>CLEARANCE</span><strong>LEVEL {rank.level}</strong></div></div>
          {arenaTab === "pass" ? <div className="genome-pass">
            <div className="pass-hero"><div><span>SEASON 01 • INFINITE FORMS</span><h3>Genome Pass</h3><p>Win battles to advance. Every consecutive victory adds +5 bonus points, up to a 5-win resonance streak.</p></div><strong>{battlePassPoints}<small>PASS POINTS</small></strong></div>
            <div className="pass-track">{PASS_REWARDS.map(reward => { const unlocked = battlePassPoints >= reward.points; const claimed = claimedRewards.includes(reward.tier); return <article className={`${unlocked ? "unlocked" : ""} ${claimed ? "claimed" : ""}`} key={reward.tier}><div><span>TIER {String(reward.tier).padStart(2, "0")}</span><b>{reward.points} GP</b></div><i>{reward.aura ? "◈" : reward.energy ? "ϟ" : "XP"}</i><strong>{reward.label}</strong><button disabled={!unlocked || claimed} onClick={() => claimPassReward(reward)}>{claimed ? "CLAIMED ✓" : unlocked ? "CLAIM" : `${reward.points - battlePassPoints} TO GO`}</button></article>; })}</div>
            <div className="aura-locker"><span>UNLOCKED AURAS</span><button className={activeAura === "none" ? "active" : ""} onClick={() => setActiveAura("none")}>NONE</button>{unlockedAuras.map(aura => <button className={activeAura === aura ? `active aura-${aura}` : `aura-${aura}`} key={aura} onClick={() => setActiveAura(aura)}>{aura.toUpperCase()}</button>)}</div>
          </div> : !battle ? <div className="arena-select">
            <div className="arena-section-title"><span>01</span><div><strong>Choose your combat specimen</strong><small>The active organism and every preserved specimen can enter.</small></div></div>
            <div className="fighter-picker">{fighterChoices.slice(0, 9).map(fighter => { const stats = statsOf(fighter); const selected = battleFighterId === fighter.id; return <button className={selected ? "selected" : ""} key={fighter.id} onClick={() => setBattleFighterId(fighter.id)}><CreatureGlyph genome={fighter.genome}/><span><small>{fighter.id === "current" ? "ACTIVE SPECIMEN" : `${rarityOf(fighter.genome)} • ARCHIVED`}</small><strong>{fighter.name}</strong><em>{familyOf(fighter.genome)} • PWR {stats.rating}</em></span><b>{selected ? "◆" : "◇"}</b></button>; })}</div>
            {(() => { const chosen = fighterChoices.find(f => f.id === battleFighterId) || currentFighter; const stats = statsOf(chosen); const ability = familyAbility(familyOf(chosen.genome)); return <div className="fighter-loadout">
              <div className="loadout-creature"><CreatureGlyph genome={chosen.genome}/><span><small>SELECTED CHALLENGER</small><strong>{chosen.name}</strong><em>{familyOf(chosen.genome)} class</em></span></div>
              <div className="combat-stats"><div><span>VITALITY</span><b>{stats.hp}</b></div><div><span>POWER</span><b>{stats.power}</b></div><div><span>DEFENSE</span><b>{stats.defense}</b></div><div><span>SPEED</span><b>{stats.speed}</b></div><div><span>MATH LUCK</span><b>{stats.luck}</b></div><div><span>CHARGE</span><b>{stats.charge}%</b></div></div>
              <div className="ability-preview"><small>SIGNATURE ABILITY</small><strong>{ability[0]}</strong><p>{ability[1]}</p></div>
              <button className="primary begin-battle" onClick={startBattle}>FIND RIVAL &amp; BEGIN ⚔</button>
            </div>; })()}
            <div className="arena-rules"><span>STRIKE</span><p>Reliable damage based on power.</p><span>STABILIZE</span><p>Restore 8% vitality and halve the next hit.</p><span>ABILITY</span><p>A powerful family-specific move usable once.</p></div>
          </div> : <div className={`battle-screen status-${battle.status}`}>
            <div className="battle-stage">
              {[{ side: "player", fighter: battle.player, hp: battle.playerHp }, { side: "enemy", fighter: battle.enemy, hp: battle.enemyHp }].map(entry => { const stats = statsOf(entry.fighter); const hpPct = Math.max(0, entry.hp / stats.hp * 100); return <article className={`arena-fighter ${entry.side} ${entry.hp <= 0 ? "defeated" : ""}`} key={entry.side}>
                <div className="fighter-tag"><span>{entry.side === "player" ? "YOUR SPECIMEN" : "ADAPTIVE RIVAL"}</span><b>{MATH_MODES.find(item => item.id === (entry.fighter.mathMode || "sine"))?.label.toUpperCase()}</b></div>
                <div className="battle-glyph"><CreatureGlyph genome={entry.fighter.genome}/><i /></div>
                <h3>{entry.fighter.name}</h3><small>POWER RATING {stats.rating}</small>
                <div className="health-copy"><span>WAVEFORM VITALITY</span><b>{Math.max(0, entry.hp)} / {stats.hp}</b></div>
                <div className="health-bar"><i style={{ width: `${hpPct}%` }} /></div>
                <div className="mini-stats"><span>ATK {stats.power}</span><span>DEF {stats.defense}</span><span>SPD {stats.speed}</span><span>LUCK {stats.luck}</span></div>
              </article>; })}
              <div className="battle-versus"><small>TURN</small><strong>{battle.turn}</strong><span>VS</span></div>
            </div>
            <div className="battle-console">
              <div className="battle-log" aria-live="polite"><span className="section-label">COMBAT TELEMETRY</span>{battle.log.map((entry, index) => <p className={index === 0 ? "latest" : ""} key={`${battle.turn}-${index}`}><b>{index === 0 ? "›" : "·"}</b>{entry}</p>)}</div>
              <div className="battle-controls">
                {battle.status === "fighting" ? <><button onClick={() => playBattleTurn("strike")}><i>⌁</i><span><b>GENOME STRIKE</b><small>Reliable attack + luck crits</small></span></button><button onClick={() => playBattleTurn("guard")}><i>◇</i><span><b>STABILIZE</b><small>Heal + guard</small></span></button><button className="ability" disabled={battle.playerAbilityUsed} onClick={() => playBattleTurn("ability")}><i>✦</i><span><b>{familyAbility(familyOf(battle.player.genome))[0].toUpperCase()}</b><small>{battle.playerAbilityUsed ? "Ability expended" : "Signature move"}</small></span></button></> : <div className="battle-result"><span>{battle.status === "won" ? "VICTORY" : "WAVEFORM LOST"}</span><strong>{battle.status === "won" ? `+${35 + rank.level * 5} XP • +${20 + Math.min(5, battleRecord.streak) * 5} GP` : "+8 XP • +5 GP"}</strong><p>{battle.status === "won" ? "Your streak accelerated Genome Pass progress. Claim rewards in the Pass tab." : "Telemetry still earned pass progress. Train, bond, or evolve before the rematch."}</p><button className="primary" onClick={() => setBattle(null)}>CHOOSE NEXT FIGHTER</button><button onClick={startBattle}>REMATCH</button></div>}
              </div>
            </div>
          </div>}
        </section>
      </div>}

      {collectionOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setCollectionOpen(false); }}>
        <section className="modal archive-modal" role="dialog" aria-modal="true" aria-label="Living specimen archive">
          <div className="modal-header"><div><span className="eyebrow">PERSISTENT STORAGE</span><h2>Living specimen archive</h2><p>Select two preserved organisms to synthesize an offspring.</p></div><button onClick={() => setCollectionOpen(false)}>×</button></div>
          {collection.length ? <div className="specimen-grid">{collection.map(s => <article key={s.id} className={parents.includes(s.id) ? "selected" : ""}>
            <button className="specimen-main" onClick={() => setParents(p => p.includes(s.id) ? p.filter(id => id !== s.id) : p.length < 2 ? [...p, s.id] : [p[1], s.id])}><CreatureGlyph genome={s.genome}/><span><small>{rarityOf(s.genome)} • {familyOf(s.genome)} • GEN {s.generation || 1}</small><b>{s.name}</b><em>{MATH_MODES.find(item => item.id === (s.mathMode || "sine"))?.label} / {Object.values(s.upgrades || {}).reduce((sum, level) => sum + level, 0)} theorem levels</em></span><i>{parents.includes(s.id) ? "SELECTED" : "SELECT"}</i></button>
            <div className="card-actions"><button onClick={() => { setGenome(s.genome); setName(s.name); setDraftName(s.name); setCustomNamed(true); setBond(s.bond || 0); setMathMode(s.mathMode || "sine"); setSequence(s.sequence || "fibonacci"); setUpgrades(s.upgrades || EMPTY_UPGRADES); setTraining(s.training || EMPTY_TRAINING); setGeneration(s.generation || 1); setAscension(s.ascension || 0); setActiveAura(s.aura || "none"); setToast(`${s.name} restored with its complete mathematical development intact`); setCollectionOpen(false); }}>RESTORE</button><button onClick={() => { setCollection(c => c.filter(x => x.id !== s.id)); setParents(p => p.filter(id => id !== s.id)); }}>RELEASE</button></div>
          </article>)}</div> : <div className="modal-empty"><CreatureGlyph genome={INITIAL}/><h3>The archive is empty</h3><p>Preserve an organism from the main laboratory to begin your collection.</p></div>}
          <div className="modal-footer breeding-footer"><span>{parents.length}/2 PARENTS SELECTED</span>{parents.length === 2 && <div className="compatibility"><small>GENOME COMPATIBILITY</small><b>{compatibility}%</b><i><em style={{ width: `${compatibility}%` }} /></i></div>}<button className="primary" disabled={parents.length !== 2} onClick={breed}>SYNTHESIZE HYBRID ✦</button></div>
        </section>
      </div>}

      {fieldOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setFieldOpen(false); }}>
        <section className="modal field-modal" role="dialog" aria-modal="true" aria-label="Field research laboratory">
          <div className="modal-header"><div><span className="eyebrow">CAREER TERMINAL</span><h2>Field research laboratory</h2><p>Complete commissions and document mathematical life to advance your rank.</p></div><button onClick={() => setFieldOpen(false)}>×</button></div>
          <div className="career-strip">
            <div className="rank-seal"><span>{rank.level}</span></div>
            <div className="rank-copy"><small>CURRENT CLEARANCE</small><strong>{rank.name}</strong><div><i style={{ width: `${rank.level === 5 ? 100 : Math.min(100, xp / rank.next * 100)}%` }} /></div><em>{xp} XP {rank.level < 5 ? `/ ${rank.next}` : "• MAXIMUM RANK"}</em></div>
            <div className="career-stat"><b>{contractsDone.length}</b><span>CONTRACTS</span></div>
            <div className="career-stat"><b>{discoveredFamilies.length + discoveredTraits.length}</b><span>CODEX ENTRIES</span></div>
          </div>
          <div className="field-tabs"><button className={fieldTab === "contracts" ? "active" : ""} onClick={() => setFieldTab("contracts")}>CONTRACTS <b>{contractsDone.length}/{CONTRACTS.length}</b></button><button className={fieldTab === "codex" ? "active" : ""} onClick={() => setFieldTab("codex")}>CODEX <b>{discoveredFamilies.length}/{FAMILIES.length}</b></button><button className={fieldTab === "theorems" ? "active" : ""} onClick={() => setFieldTab("theorems")}>THEOREM LAB <b>{Object.values(upgrades).reduce((sum, level) => sum + level, 0)}</b></button><button className={fieldTab === "protocol" ? "active" : ""} onClick={() => setFieldTab("protocol")}>ASCENSION <b>{ascensionRequirements.filter(item => item.done).length}/6</b></button></div>
          {fieldTab === "contracts" ? <div className="contract-list">
            {CONTRACTS.map((contract, index) => { const score = Math.min(100, contract.score(genome)); const done = contractsDone.includes(contract.id); return <article className={done ? "done" : score >= 75 ? "ready" : ""} key={contract.id}>
              <div className="contract-index"><span>{done ? "✓" : String(index + 1).padStart(2, "0")}</span><small>{done ? "FILED" : "OPEN"}</small></div>
              <div className="contract-copy"><small>COMMISSION • +{contract.reward} XP</small><h3>{contract.title}</h3><p>{contract.brief}</p><div>{contract.requirements.map(r => <span key={r}>{r}</span>)}</div></div>
              <div className="match-score"><small>LIVE MATCH</small><strong>{score}%</strong><i><em style={{ height: `${score}%` }} /></i><button disabled={done} onClick={() => submitContract(contract)}>{done ? "COMPLETE" : score >= 75 ? "SUBMIT" : "TUNE GENOME"}</button></div>
            </article>; })}
          </div> : fieldTab === "codex" ? <div className="codex-wrap">
            <div className="codex-section"><div className="codex-heading"><span>SPECIES FAMILIES</span><small>{discoveredFamilies.length} OF {FAMILIES.length} DOCUMENTED</small></div><div className="codex-grid">{FAMILIES.map((item, index) => { const found = discoveredFamilies.includes(item); return <article className={found ? "found" : ""} key={item}><div className="codex-orbit" style={{ "--orbit": index + 3 } as React.CSSProperties}><i /></div><small>{found ? `ENTRY ${String(index + 1).padStart(2, "0")}` : "UNDISCOVERED"}</small><strong>{found ? item : "???"}</strong><span>{found ? "Genome signature archived" : "Continue field research"}</span></article>; })}</div></div>
            <div className="codex-section"><div className="codex-heading"><span>GENOMIC ANOMALIES</span><small>{discoveredTraits.length} OF {ANOMALIES.length} DOCUMENTED</small></div><div className="anomaly-codex">{ANOMALIES.map(item => <div className={discoveredTraits.includes(item) ? "found" : ""} key={item}><b>{discoveredTraits.includes(item) ? "✦" : "◇"}</b><span><strong>{discoveredTraits.includes(item) ? item : "Encrypted anomaly"}</strong><small>{discoveredTraits.includes(item) ? "Verified expression" : "Signature unknown"}</small></span></div>)}</div></div>
          </div> : fieldTab === "theorems" ? <div className="theorem-lab">
            <div className="sequence-reactor"><div className="theorem-title"><span>01 • DISCRETE DEVELOPMENT</span><h3>Sequence Reactor</h3><p>Encode a number sequence into the organism. The active recurrence changes its particle anatomy and adds a permanent-style combat specialization while selected.</p></div><div className="sequence-grid">{SEQUENCES.map(item => <button className={sequence === item.id ? "active" : ""} key={item.id} onClick={() => selectSequence(item.id)}><i>{item.symbol}</i><span><b>{item.label}</b><small>{item.effect}</small></span><em>{sequence === item.id ? "ACTIVE" : sequencesSeen.includes(item.id) ? "OBSERVED" : "UNTESTED"}</em></button>)}</div></div>
            <div className="upgrade-reactor"><div className="theorem-title"><span>02 • APPLIED MATHEMATICS</span><h3>Theorem Matrix</h3><p>Spend Quantum Energy to install mathematical organs. Every theorem has three permanent levels and is preserved, inherited, and battle-tested with the creature.</p></div><div className="upgrade-grid">{UPGRADES.map(item => { const level = upgrades[item.id] || 0; const cost = item.base * (level + 1); return <article className={level ? "installed" : ""} key={item.id}><div className="upgrade-symbol">{item.symbol}</div><span><small>{item.branch}</small><strong>{item.name}</strong><p>{item.description}</p></span><div className="upgrade-level"><i>{[1,2,3].map(n => <b className={n <= level ? "on" : ""} key={n} />)}</i><button disabled={level >= 3 || quantumEnergy < cost} onClick={() => buyUpgrade(item.id)}>{level >= 3 ? "MAX LEVEL" : `UPGRADE • ${cost} QE`}</button></div></article>; })}</div></div>
            <div className="theorem-summary"><span><b>{quantumEnergy}</b> QUANTUM ENERGY</span><span><b>{sequencesSeen.length}/{SEQUENCES.length}</b> SEQUENCES</span><span><b>{Object.values(upgrades).reduce((sum, level) => sum + level, 0)}/24</b> THEOREM LEVELS</span><span><b>{liveStats.rating}</b> ARENA POWER</span></div>
          </div> : <div className="protocol-wrap">
            <div className="protocol-hero"><span>PRIMARY GAME OBJECTIVE</span><h3>The Ascension Protocol</h3><p>Create more than a beautiful equation. Build a named companion, earn its trust, strengthen its bloodline, prove it in combat, complete research, and concentrate enough Quantum Energy to awaken a permanent Ascendant form.</p><div><b>{ascensionRequirements.filter(item => item.done).length}/6</b><span>PROTOCOL NODES ONLINE</span></div></div>
            <div className="protocol-requirements">{ascensionRequirements.map((item, index) => <article className={item.done ? "done" : ""} key={item.label}><b>{item.done ? "✓" : String(index + 1).padStart(2, "0")}</b><span>{item.label}</span><em>{item.done ? "ONLINE" : "INCOMPLETE"}</em></article>)}</div>
            <div className="protocol-footer"><div><span>ASCENSION COST</span><strong>50 QE</strong><small>Current reserves: {quantumEnergy} QE</small></div><button className="primary" disabled={!ascensionReady} onClick={ascendCreature}>{ascensionReady ? `ASCEND ${name.toUpperCase()} ✦` : "PROTOCOL LOCKED"}</button></div>
            {ascension > 0 && <div className="ascension-complete">✦ ASCENSION LEVEL {ascension} ACTIVE • PERMANENT COMBAT AMPLIFICATION ONLINE</div>}
          </div>}
        </section>
      </div>}

      {researchOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setResearchOpen(false); }}>
        <section className="modal research-modal" role="dialog" aria-modal="true" aria-label="Research objectives">
          <div className="modal-header"><div><span className="eyebrow">FIELD DIRECTIVE</span><h2>Research objectives</h2><p>Manipulate, observe, and preserve life to complete the study.</p></div><button onClick={() => setResearchOpen(false)}>×</button></div>
          <div className="progress-ring" style={{ "--progress": `${completed.length / OBJECTIVES.length * 360}deg` } as React.CSSProperties}><div><strong>{completed.length}</strong><span>OF {OBJECTIVES.length}<br/>COMPLETE</span></div></div>
          <div className="objective-list">{OBJECTIVES.map((o, i) => <article className={completed.includes(o.id) ? "done" : ""} key={o.id}><b>{completed.includes(o.id) ? "✓" : String(i + 1).padStart(2, "0")}</b><span><strong>{o.label}</strong><small>{o.hint}</small></span><i>{completed.includes(o.id) ? "COMPLETE" : "OPEN"}</i></article>)}</div>
        </section>
      </div>}
    </main>
  );
}
