import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import ModeGate from './ModeGate.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModeGate />
  </StrictMode>,
);
