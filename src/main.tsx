import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { init, postEvent, mockTelegramEnv, retrieveLaunchParams } from '@tma.js/sdk';

try {
  // Try to retrieve launch params to check if we are in Telegram
  retrieveLaunchParams();
} catch (e) {
  console.log('App is running outside of Telegram. Mocking Telegram environment...');
  mockTelegramEnv({
    launchParams: {
      tgWebAppData: new URLSearchParams([
        ['user', JSON.stringify({ id: 123456789, first_name: 'Local', last_name: 'Dev', username: 'local_dev' })],
        ['hash', 'mock_hash'],
        ['signature', 'mock_signature'],
        ['auth_date', Math.floor(Date.now() / 1000).toString()],
      ]),
      tgWebAppThemeParams: {},
      tgWebAppStartParam: 'debug',
      tgWebAppVersion: '8',
      tgWebAppPlatform: 'tdesktop',
    },
  });
}

try {
  // Initializes the Telegram SDK and informs Telegram the app is ready
  init();
  // Forces the app to expand to maximum height
  postEvent('web_app_expand');
} catch (e) {
  console.error('Telegram SDK initialization failed:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
