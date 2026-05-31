import { motion, type Variants } from 'framer-motion';
import { getHistory } from '../api/history';

interface Props {
  onStart: () => void;
  onHistory: () => void;
}

const FLOATING_EMOJIS = [
  { emoji: '🍜', x: '8%',  y: '12%', duration: 3.2, delay: 0 },
  { emoji: '🍕', x: '82%', y: '8%',  duration: 3.8, delay: 0.4 },
  { emoji: '🌮', x: '75%', y: '55%', duration: 3.0, delay: 0.8 },
  { emoji: '🍱', x: '5%',  y: '62%', duration: 4.1, delay: 0.2 },
  { emoji: '🍔', x: '88%', y: '30%', duration: 3.5, delay: 1.0 },
  { emoji: '🥗', x: '15%', y: '38%', duration: 2.9, delay: 0.6 },
  { emoji: '🍣', x: '60%', y: '78%', duration: 3.7, delay: 0.3 },
  { emoji: '🥘', x: '30%', y: '85%', duration: 3.3, delay: 0.9 },
];

const FEATURES = [
  { icon: '🎭', title: 'Tell your mood', desc: 'Spicy? Cozy? Quick? Just tap a few feelings.' },
  { icon: '✨', title: 'One perfect pick', desc: 'No endless scrolling. One dish, chosen for you.' },
  { icon: '🍳', title: 'Cook or order', desc: 'Save money cooking at home, or order in seconds.' },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.25 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

export default function Landing({ onStart, onHistory }: Props) {
  const historyCount = getHistory().length;

  return (
    <div className="lv2-screen">

      {/* Background gradient orbs */}
      <motion.div className="lv2-orb lv2-orb-orange"
        animate={{ x: [0, 25, 0], y: [0, -18, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="lv2-orb lv2-orb-purple"
        animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div className="lv2-orb lv2-orb-pink"
        animate={{ x: [0, 15, 0], y: [0, 20, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Floating food emojis */}
      {FLOATING_EMOJIS.map((f, i) => (
        <motion.span
          key={i}
          className="lv2-float-emoji"
          style={{ left: f.x, top: f.y }}
          animate={{ y: [0, -14, 0], rotate: [-4, 4, -4], opacity: [0.18, 0.45, 0.18] }}
          transition={{ duration: f.duration, repeat: Infinity, ease: 'easeInOut', delay: f.delay }}
        >
          {f.emoji}
        </motion.span>
      ))}

      {/* Main content */}
      <motion.div className="lv2-content" variants={container} initial="hidden" animate="show">

        {/* Badge */}
        <motion.div variants={item} className="lv2-badge">
          <span className="lv2-badge-dot" />
          AI-powered meal decisions
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={item} className="lv2-title">
          Don't know what to eat?<br />
          <span className="lv2-gradient-text">Fixed in seconds.</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p variants={item} className="lv2-tagline">
          Tell us your mood in seconds. Get one perfect dish — then cook it cheap or order instantly.
        </motion.p>

        {/* Feature cards */}
        <motion.div variants={item} className="lv2-features">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              className="lv2-feature-card"
              whileHover={{ scale: 1.03, y: -3 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            >
              <span className="lv2-feature-icon">{f.icon}</span>
              <div>
                <p className="lv2-feature-title">{f.title}</p>
                <p className="lv2-feature-desc">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          variants={item}
          className="lv2-cta"
          onClick={onStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          Decide my meal →
        </motion.button>

        {/* Returning user */}
        {historyCount > 0 && (
          <motion.div variants={item} className="lv2-returning">
            <span>Welcome back · {historyCount} meal{historyCount !== 1 ? 's' : ''} decided</span>
            <button onClick={onHistory}>View history →</button>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
