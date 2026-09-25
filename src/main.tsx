import React from 'react';
import {createRoot} from 'react-dom/client';
import LegacyApp from './LegacyApp';
import SecureApp from './SecureApp';
document.documentElement.classList.toggle('dark', localStorage.getItem('workspace-theme-v2') !== 'light');
createRoot(document.getElementById('root')!).render(<React.StrictMode>{import.meta.env.VITE_MULTIUSER_ENABLED==='true'?<SecureApp/>:<LegacyApp/>}</React.StrictMode>);
