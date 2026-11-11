/**
 * Quick-ask handoff supplied by Lumo Desktop.
 *
 * The desktop quick-ask window (global shortcut) keeps the typed question in the native shell and
 * navigates the main window to `#quickask=<nonce>`. The web app trades that one-time nonce for the
 * question through this bridge. The question itself never appears in a URL, so a crafted link
 * cannot make the app auto-send a prompt: it can neither guess the nonce nor fill the shell's state.
 */
export interface DesktopQuickAskApi {
    /** Returns the pending question once if `nonce` matches and has not expired, otherwise null. */
    take(nonce: string): Promise<string | null>;
}

declare global {
    interface Window {
        LumoQuickAsk?: DesktopQuickAskApi;
    }
}

export const QUICK_ASK_PARAM = 'quickask';

// The shell hands a question out only once, so a second call for the same nonce gets null.
// Memoised per nonce so a remounted caller (React StrictMode runs effects twice) still receives it.
const takes = new Map<string, Promise<string | null>>();

export function takeDesktopQuickAsk(nonce: string): Promise<string | null> {
    const existing = takes.get(nonce);
    if (existing) {
        return existing;
    }

    const api = typeof window !== 'undefined' ? window.LumoQuickAsk : undefined;
    const taken = api
        ? api.take(nonce).then(
              (query) => (typeof query === 'string' && query.trim() ? query : null),
              (error: unknown) => {
                  // The error comes from the shell and never contains the question.
                  console.warn('Could not take the desktop quick-ask question', error);
                  return null;
              }
          )
        : Promise.resolve(null);

    takes.set(nonce, taken);
    return taken;
}
