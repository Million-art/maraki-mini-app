import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { init, postEvent, mockTelegramEnv, retrieveRawInitData, isTMA } from '@tma.js/sdk';

// 1. Mock Telegram Environment ONLY in local development when outside of Telegram
if (import.meta.env.DEV && !isTMA()) {
  console.log('App is running outside of Telegram in DEV. Mocking Telegram environment...');
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

// 2. Cache raw initData in sessionStorage if available
try {
  const rawInitData = retrieveRawInitData();
  if (rawInitData) {
    sessionStorage.setItem('tg_init_data', rawInitData);
  }
} catch (e) {
  console.warn('Failed to retrieve Telegram raw init data:', e);
}

// 3. Initialize Telegram SDK if running in Telegram
if (isTMA()) {
  try {
    init();
    postEvent('web_app_expand');
    postEvent('web_app_setup_closing_behavior', { need_confirmation: true });
    postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });
  } catch (e) {
    console.error('Telegram SDK initialization failed:', e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
