import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  useInView,
  useScroll,
  type Variants,
} from 'framer-motion';
import { useRef, useEffect, useState, useCallback, type CSSProperties } from 'react';
import { getHistory } from '../api/history';

interface Props {
  onStart: () => void;
  onHistory: () => void;
}

// ── Animated counter ──────────────────────────────────────────────────────────
function useCounter(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return { count, ref };
}

// ── Word-split spring entrance ─────────────────────────────────────────────────
const wordVariants: Variants = {
  hidden: { opacity: 0, y: 52, rotateX: -28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { delay: i * 0.08, duration: 0.78, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ── 3D magnetic card ──────────────────────────────────────────────────────────
function MagneticCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-60, 60], [10, -10]), { stiffness: 260, damping: 26 });
  const ry = useSpring(useTransform(mx, [-60, 60], [-10, 10]), { stiffness: 260, damping: 26 });

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      mx.set(e.clientX - r.left - r.width / 2);
      my.set(e.clientY - r.top - r.height / 2);
    },
    [mx, my],
  );
  const onLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.025 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    emoji: '🎭',
    title: 'Tell your mood',
    desc: 'Spicy, cozy, quick, adventurous — tap a few feelings in under a minute.',
    color: '#E8703A',
  },
  {
    num: '02',
    emoji: '✨',
    title: 'AI picks one dish',
    desc: 'No endless scrolling. No paradox of choice. One perfect meal, just for you.',
    color: '#7C3AED',
  },
  {
    num: '03',
    emoji: '🍳',
    title: 'Cook cheap or order',
    desc: 'Get a real recipe and save up to $15 — or order from your favourite app in seconds.',
    color: '#FF6B9D',
  },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Instant decisions',
    desc: "Under a minute from mood to meal. Because your hunger can't wait.",
    grad: 'linear-gradient(135deg,rgba(232,112,58,.14),rgba(252,140,90,.06))',
    border: 'rgba(232,112,58,.28)',
    glow: '#E8703A',
  },
  {
    icon: '💸',
    title: 'Save every meal',
    desc: 'Real recipes, real savings. See exactly how much you save vs ordering out.',
    grad: 'linear-gradient(135deg,rgba(124,58,237,.14),rgba(159,90,237,.06))',
    border: 'rgba(124,58,237,.28)',
    glow: '#7C3AED',
  },
  {
    icon: '🧠',
    title: 'Gets smarter',
    desc: 'Preferences remembered. Every pick learns from you and gets better over time.',
    grad: 'linear-gradient(135deg,rgba(255,107,157,.14),rgba(255,143,175,.06))',
    border: 'rgba(255,107,157,.28)',
    glow: '#FF6B9D',
  },
];

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: (i * 4.7 + 3) % 100,
  y: (i * 7.3 + 5) % 100,
  size: (i % 3) + 1.5,
  dur: 7 + (i % 5) * 1.8,
  delay: (i % 6) * 0.7,
  op: 0.06 + (i % 4) * 0.04,
}));

// ── Component ─────────────────────────────────────────────────────────────────
export default function Landing({ onStart, onHistory }: Props) {
  const historyCount = getHistory().length;
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.28], [0, -55]);
  const heroOp = useTransform(scrollYProgress, [0, 0.22], [1, 0]);

  const { count: savingsCount, ref: savRef } = useCounter(12);

  const words1 = 'No idea what to eat?'.split(' ');
  const words2 = 'We got you.'.split(' ');

  return (
    <div className="lv3-screen" ref={containerRef}>

      {/* Fixed mesh + orbs */}
      <div className="lv3-mesh" />
      <motion.div className="lv3-orb lv3-orb-a"
        animate={{ x: [0, 45, 0], y: [0, -35, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="lv3-orb lv3-orb-b"
        animate={{ x: [0, -35, 0], y: [0, 45, 0], scale: [1, 0.88, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
      <motion.div className="lv3-orb lv3-orb-c"
        animate={{ x: [0, 22, -14, 0], y: [0, -25, 32, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="lv3-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: p.op }}
          animate={{ y: [0, -28, 0], opacity: [p.op, p.op * 3, p.op] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}

      {/* ═══════════════════ HERO ═══════════════════ */}
      <motion.section className="lv3-hero" style={{ y: heroY, opacity: heroOp }}>

        {/* Badge */}
        <motion.div
          className="lv3-badge"
          initial={{ opacity: 0, y: 18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="lv3-badge-dot" />
          AI-powered meal decisions
          <span className="lv3-badge-tag">NEW</span>
        </motion.div>

        {/* Headline — word split with 3D perspective */}
        <div className="lv3-headline" style={{ perspective: 1200 }}>
          <div className="lv3-hl-row lv3-hl-row--line1">
            {words1.map((w, i) => (
              <motion.span
                key={`a${i}`}
                className="lv3-hl-word"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={wordVariants}
              >
                {w}
              </motion.span>
            ))}
          </div>
          <div className="lv3-hl-row">
            {words2.map((w, i) => (
              <motion.span
                key={`b${i}`}
                className="lv3-hl-word lv3-grad-text"
                custom={i + words1.length}
                initial="hidden"
                animate="visible"
                variants={wordVariants}
              >
                {w}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <motion.p
          className="lv3-tagline"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.52, ease: [0.16, 1, 0.3, 1] }}
        >
          Tell us your mood. Get <strong>one perfect dish</strong> — cook it for{' '}
          <span ref={savRef} className="lv3-accent">${savingsCount} less</span> or order instantly.
        </motion.p>

        {/* Stats strip */}
        <motion.div
          className="lv3-stats"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.68, ease: [0.16, 1, 0.3, 1] }}
        >
          {[
            { val: '<1min', label: 'to decide' },
            { val: `$${savingsCount}+`, label: 'saved / meal' },
            { val: '1', label: 'perfect pick' },
          ].map((s, i) => (
            <div key={i} className="lv3-stat-item">
              {i > 0 && <div className="lv3-stat-sep" />}
              <span className="lv3-stat-val">{s.val}</span>
              <span className="lv3-stat-lbl">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="lv3-cta-wrap"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.84, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.button
            className="lv3-cta"
            onClick={onStart}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.965 }}
          >
            <span className="lv3-shimmer" />
            Decide my meal
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              →
            </motion.span>
          </motion.button>

          {historyCount > 0 && (
            <motion.button
              className="lv3-ghost"
              onClick={onHistory}
              whileHover={{ scale: 1.03 }}
            >
              {historyCount} past meal{historyCount !== 1 ? 's' : ''} →
            </motion.button>
          )}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="lv3-scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.7 }}
        >
          <motion.div
            className="lv3-scroll-dot"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.section>

      {/* ═══════════════════ PROBLEM HOOK ═══════════════════ */}
      <section className="lv3-section lv3-problem-section">
        <motion.div
          className="lv3-problem-card"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.p
            className="lv3-problem-label"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            Sound familiar?
          </motion.p>
          <motion.p
            className="lv3-problem-q"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            "I've been scrolling for <span className="lv3-kw">20 minutes</span> —<br />
            and I still <span className="lv3-kw">don't know what to eat.</span>"
          </motion.p>
          <motion.div
            className="lv3-problem-rule"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.p
            className="lv3-problem-a"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            We pick the perfect meal for you in <span className="lv3-grad-text">under a minute.</span>
          </motion.p>
        </motion.div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="lv3-section">
        <motion.div
          className="lv3-sec-head"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="lv3-sec-tag">How it works</span>
          <h2 className="lv3-sec-title">3 steps.<br />One perfect meal.</h2>
        </motion.div>

        <div className="lv3-steps">
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              className="lv3-step"
              style={{ '--sc': s.color } as CSSProperties}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ x: 6 }}
            >
              <div className="lv3-step-num">{s.num}</div>
              <div className="lv3-step-body">
                <div className="lv3-step-emoji">{s.emoji}</div>
                <h3 className="lv3-step-title">{s.title}</h3>
                <p className="lv3-step-desc">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <motion.div
                  className="lv3-step-line"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 + 0.35 }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section className="lv3-section">
        <motion.div
          className="lv3-sec-head"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="lv3-sec-tag">Why it works</span>
          <h2 className="lv3-sec-title">Built for the<br />indecisive human.</h2>
        </motion.div>

        <div className="lv3-feat-grid">
          {FEATURES.map((f, i) => (
            <MagneticCard key={i} className="lv3-feat-wrap">
              <motion.div
                className="lv3-feat-card"
                style={{ background: f.grad, border: `1px solid ${f.border}`, '--fg': f.glow } as CSSProperties}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="lv3-feat-icon-bg" style={{ boxShadow: `0 0 28px ${f.glow}30` }}>
                  <span className="lv3-feat-icon">{f.icon}</span>
                </div>
                <h3 className="lv3-feat-title">{f.title}</h3>
                <p className="lv3-feat-desc">{f.desc}</p>
              </motion.div>
            </MagneticCard>
          ))}
        </div>
      </section>

      {/* ═══════════════════ CLOSING CTA ═══════════════════ */}
      <motion.section
        className="lv3-section lv3-closing"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="lv3-closing-glow" />
        <motion.h2
          className="lv3-closing-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Your next meal<br />
          <span className="lv3-grad-text">is one tap away.</span>
        </motion.h2>
        <motion.button
          className="lv3-cta lv3-cta-lg"
          onClick={onStart}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.22 }}
        >
          <span className="lv3-shimmer" />
          Decide my meal →
        </motion.button>
        <motion.p
          className="lv3-closing-sub"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.38 }}
        >
          Built for people who hate deciding.
        </motion.p>
      </motion.section>

    </div>
  );
}
