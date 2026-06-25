import { appState } from './state.js';

export function isStandaloneMode() {
  return (
    appState.appInstalled ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isPwaInstallable() {
  if (isStandaloneMode()) return false;
  return !!appState.deferredInstallPrompt;
}

export async function promptPwaInstall() {
  const prompt = appState.deferredInstallPrompt;
  if (!prompt) {
    console.warn('[pwa] Chưa có lời nhắc cài đặt trên thiết bị này');
    return;
  }
  try {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    console.log('[pwa] Người dùng chọn cài app', { outcome });
    if (outcome === 'accepted') {
      appState.deferredInstallPrompt = null;
    }
    const { refreshNavButtons } = await import('./navigation.js');
    refreshNavButtons();
  } catch (err) {
    console.error('[pwa] Không mở được hộp thoại cài app', err);
  }
}

export function setupPwaInstallPrompt() {
  if (isStandaloneMode()) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    appState.deferredInstallPrompt = e;
    import('./navigation.js').then(({ refreshNavButtons }) => refreshNavButtons());
  });

  window.addEventListener('appinstalled', () => {
    appState.appInstalled = true;
    appState.deferredInstallPrompt = null;
    import('./navigation.js').then(({ refreshNavButtons }) => refreshNavButtons());
  });
}
