declare global {
  interface Window {
    google?: any;
  }
}

import firebaseConfig from '../../firebase-applet-config.json';

const CLIENT_ID = firebaseConfig.oAuthClientId;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const TOKEN_KEY = 'exam_strategy_google_access_token_v31';
const TOKEN_EXP_KEY = 'exam_strategy_google_access_token_exp_v31';

let inMemoryToken: string | null = null;
let inMemoryExpiry = 0;
let tokenClient: any = null;
let pending: Promise<string> | null = null;

function readCachedToken(): string | null {
  if (inMemoryToken && Date.now() < inMemoryExpiry - 60_000) return inMemoryToken;
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const expiry = Number(sessionStorage.getItem(TOKEN_EXP_KEY) || 0);
    if (token && Date.now() < expiry - 60_000) {
      inMemoryToken = token;
      inMemoryExpiry = expiry;
      return token;
    }
  } catch {
    // sessionStorage may be unavailable in strict/private browsing contexts.
  }
  return null;
}

function saveToken(token: string, expiresInSeconds = 3500) {
  const expiry = Date.now() + Math.max(300, expiresInSeconds) * 1000;
  inMemoryToken = token;
  inMemoryExpiry = expiry;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_EXP_KEY, String(expiry));
  } catch {
    // Keep the in-memory token even if storage is blocked.
  }
}

export function clearGoogleToken() {
  const token = readCachedToken();
  inMemoryToken = null;
  inMemoryExpiry = 0;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
  } catch {}
  if (token && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(token, () => undefined);
    } catch {}
  }
}

async function waitForGoogleIdentity(timeoutMs = 10_000): Promise<void> {
  const started = Date.now();
  while (!window.google?.accounts?.oauth2) {
    if (Date.now() - started > timeoutMs) {
      throw new Error('Google認証ライブラリを読み込めませんでした。通信状態を確認してページを再読み込みしてください。');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Google Identity Services (GIS) only.
 * Firebase Auth is intentionally not used: on Vercel/iPhone it could navigate
 * to firebaseapp.com and fail with “The requested action is invalid.”
 */
export async function requestGoogleAccessToken(forceConsent = false): Promise<string> {
  const cached = readCachedToken();
  if (cached && !forceConsent) return cached;
  if (pending) return pending;

  pending = (async () => {
    await waitForGoogleIdentity();

    return await new Promise<string>((resolve, reject) => {
      let settled = false;
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Google認証がタイムアウトしました。もう一度「再同期」を押してください。'));
        }
      }, 60_000);

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        fn();
      };

      try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response?.error) {
              const detail = response.error_description ? `: ${response.error_description}` : '';
              finish(() => reject(new Error(`Google認証エラー (${response.error})${detail}`)));
              return;
            }
            if (!response?.access_token) {
              finish(() => reject(new Error('Googleアクセストークンを取得できませんでした。')));
              return;
            }
            saveToken(response.access_token, Number(response.expires_in || 3500));
            finish(() => resolve(response.access_token));
          },
          error_callback: (err: any) => {
            const type = err?.type || 'unknown_error';
            finish(() => reject(new Error(`Googleログイン画面を開けませんでした (${type})。Safariのポップアップ制限を確認してください。`)));
          },
        });

        // This call is made directly from a user click, which is important on iOS Safari.
        tokenClient.requestAccessToken({ prompt: forceConsent ? 'consent' : '' });
      } catch (e: any) {
        finish(() => reject(new Error(`Google連携の初期化に失敗しました: ${e?.message || String(e)}`)));
      }
    });
  })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}

export function getCachedGoogleToken(): string | null {
  return readCachedToken();
}
