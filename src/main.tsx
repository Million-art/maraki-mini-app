import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { init, postEvent, mockTelegramEnv, retrieveLaunchParams, retrieveRawInitData } from '@tma.js/sdk';

try {
  // Try to retrieve launch params to check if we are in Telegram
  retrieveLaunchParams();
  const rawInitData = retrieveRawInitData();
  if (rawInitData) {
    sessionStorage.setItem('tg_init_data', rawInitData);
  }
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
  try {
    const rawInitData = retrieveRawInitData();
    if (rawInitData) {
      sessionStorage.setItem('tg_init_data', rawInitData);
    }
  } catch (err) {}
}

try {
  // Initializes the Telegram SDK and informs Telegram the app is ready
  init();
  // Forces the app to expand to maximum height
  postEvent('web_app_expand');
  // Prevent accidental closure during a voice session by prompting the user
  postEvent('web_app_setup_closing_behavior', { need_confirmation: true });
  // Disable vertical swipe to prevent accidentally docking/closing the app when scrolling or dragging
  postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });
} catch (e) {
  console.error('Telegram SDK initialization failed:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
