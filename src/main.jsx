import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './aura3d.css';
import { ProtocolPanel } from './Protocol.jsx';

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
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ x: 0, y: 0, tiltX: 0, tiltY: 0 });

  useEffect(() => {
    const node = stage.current;
    if (!node) return undefined;
    const move = event => {
      if (dragging) return;
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
      setTilt({ x: y * -12, y: x * 16 });
    };
    const leave = () => !dragging && setTilt({ x: -5, y: 0 });
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', leave);
    return () => { node.removeEventListener('pointermove', move); node.removeEventListener('pointerleave', leave); };
  }, [dragging]);

  const startDrag = event => {
    setDragging(true);
    drag.current = { x: event.clientX, y: event.clientY, tiltX: tilt.x, tiltY: tilt.y };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const dragMove = event => {
    if (!dragging) return;
    setTilt({ x: drag.current.tiltX + (event.clientY - drag.current.y) * .3, y: drag.current.tiltY + (event.clientX - drag.current.x) * .3 });
  };
  const stopDrag = () => setDragging(false);

  return <div className={`aura3d ${dragging ? 'is-dragging' : ''} ${autoRotate ? 'is-auto' : ''}`} ref={stage} onPointerDown={startDrag} onPointerMove={dragMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} style={{ '--tilt-x': `${tilt.x}deg`, '--tilt-y': `${tilt.y}deg` }}>
    <div className="aura3d-grid" />
    <div className="aura3d-scene">
      <div className="aura3d-system">
        <div className="aura3d-ring ring-1" />
        <div className="aura3d-ring ring-2" />
        <div className="aura3d-ring ring-3" />
        <div className="aura3d-orb"><span>0x</span><strong>7A3</strong><i>{active}</i></div>
        {signals.map(signal => <button key={signal.label} className={`aura3d-signal ${active === signal.label ? 'selected' : ''}`} style={{ '--signal-color': signal.color, '--signal-angle': `${signal.angle}deg`, '--signal-lift': signal.lift }} onPointerDown={event => event.stopPropagation()} onClick={() => { setActive(signal.label); setAutoRotate(false); }}>{signal.label}</button>)}
      </div>
    </div>
    <div className="aura3d-hud"><span>DRAG TO ROTATE</span><button onPointerDown={event => event.stopPropagation()} onClick={() => setAutoRotate(value => !value)}>{autoRotate ? 'AUTO · ON' : 'AUTO · OFF'}</button></div>
  </div>;
}

const root = document.querySelector('#aura-react-root');
if (root) createRoot(root).render(<Aura3D />);

const protocolRoot = document.querySelector('#protocol-react-root');
if (protocolRoot) createRoot(protocolRoot).render(<ProtocolPanel />);
