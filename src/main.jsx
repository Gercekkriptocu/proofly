import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './aura3d.css';
import './appfix.css';

const signals = [
  { label: 'EXPLORER', color: '#d7ff5f', angle: -14, lift: -2 },
  { label: 'EARLY BIRD', color: '#9f7bff', angle: 56, lift: 2 },
  { label: 'CHAOS', color: '#ff855e', angle: 146, lift: 1 }
];

function Aura3D() {
  const stage = useRef(null);
  const [tilt, setTilt] = useState({ x: -5, y: 0 });
  const [active, setActive] = useState('EXPLORER');
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const node = stage.current;
    if (!node) return undefined;
    const move = event => {
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
      setTilt({ x: y * -12, y: x * 16 });
    };
    const leave = () => setTilt({ x: -5, y: 0 });
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', leave);
    return () => { node.removeEventListener('pointermove', move); node.removeEventListener('pointerleave', leave); };
  }, []);

  return <div className={`aura3d ${autoRotate ? 'is-auto' : ''}`} ref={stage} style={{ '--tilt-x': `${tilt.x}deg`, '--tilt-y': `${tilt.y}deg` }}>
    <div className="aura3d-grid" />
    <div className="aura3d-scene">
      <div className="aura3d-system">
        <div className="aura3d-ring ring-1" />
        <div className="aura3d-ring ring-2" />
        <div className="aura3d-ring ring-3" />
        <div className="aura3d-orb"><span>0x</span><strong>7A3</strong><i>{active}</i></div>
        {signals.map(signal => <button key={signal.label} className={`aura3d-signal ${active === signal.label ? 'selected' : ''}`} style={{ '--signal-color': signal.color, '--signal-angle': `${signal.angle}deg`, '--signal-lift': signal.lift }} onClick={() => { setActive(signal.label); setAutoRotate(false); }}>{signal.label}</button>)}
      </div>
    </div>
  </div>;
}

const root = document.querySelector('#aura-react-root');
if (root) createRoot(root).render(<Aura3D />);
