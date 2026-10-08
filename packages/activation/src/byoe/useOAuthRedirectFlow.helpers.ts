const STORAGE_KEY = 'proton:oauth-redirect-state';
const CALLBACK_PARAMS = ['code', 'error', 'state', 'scope', 'authuser', 'prompt', 'hd'];

export interface OAuthRedirectState {
    /** Compared against the `state` returned by the provider, to make sure we started this authorization. */
    uid: string;
    /** Whether the user asked to import their existing emails. */
    importEmails: boolean;
    /** Where to send the user once the flow is done. Not validated here. */
    redirect?: string;
}

export type OAuthCallbackResult =
    { type: 'none' } | { type: 'error' } | { type: 'code'; code: string; state: OAuthRedirectState };

export const storeOAuthRedirectState = (state: OAuthRedirectState) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const clearOAuthRedirectState = () => {
    sessionStorage.removeItem(STORAGE_KEY);
};

/** Returns the stored state, or undefined when it is missing, malformed or tampered with. */
export const readOAuthRedirectState = (): OAuthRedirectState | undefined => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const parsed: Partial<Record<keyof OAuthRedirectState, unknown>> | null = raw ? JSON.parse(raw) : null;

        if (typeof parsed?.uid !== 'string' || typeof parsed.importEmails !== 'boolean') {
            return;
        }

        return {
            uid: parsed.uid,
            importEmails: parsed.importEmails,
            redirect: typeof parsed.redirect === 'string' ? parsed.redirect : undefined,
        };
    } catch {
        return;
    }
};

/**
 * Reads the provider's callback from the URL. `none` is an ordinary page load. A callback is `error` when the user
 * declined or when `state` does not match the one stored before leaving. The stored state is single use: it is
 * removed as soon as a callback is read.
 */
export const readOAuthCallback = (searchParams: URLSearchParams): OAuthCallbackResult => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (!code && !error) {
        return { type: 'none' };
    }

    const stored = readOAuthRedirectState();
    clearOAuthRedirectState();

    if (error || !code || !stored || stored.uid !== searchParams.get('state')) {
        return { type: 'error' };
    }

    return { type: 'code', code, state: stored };
};

/** Returns a copy of the URL without the params added by the provider. Other params (e.g. `action`) are kept. */
export const removeOAuthCallbackParams = (url: URL): URL => {
    const cleaned = new URL(url.toString());
    CALLBACK_PARAMS.forEach((param) => cleaned.searchParams.delete(param));
    return cleaned;
};
