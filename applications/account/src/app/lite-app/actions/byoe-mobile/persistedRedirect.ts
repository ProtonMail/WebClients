import { getValidatedProtonProtocolRedirect } from '@proton/shared/lib/authentication/fork/getValidatedProtonProtocol';

const STORAGE_KEY = 'proton:byoe-mobile-redirect';

const read = (): string | undefined => {
    try {
        return getValidatedProtonProtocolRedirect(sessionStorage.getItem(STORAGE_KEY) || undefined);
    } catch {
        return undefined;
    }
};

/**
 * The native redirect is only in the URL of the first load: Google sends the user back to a URL without it, and a
 * refresh keeps that URL. Keeps the last valid one for the tab (session storage), so the screen still knows where
 * the native app expects the user after the round trip.
 *
 * Order: the URL wins, then the one stored before leaving for Google, then the one stored for the tab.
 * Every value is validated again, because storage is not trusted.
 */
export const resolveNativeRedirect = (fromUrl: string | undefined, fromOAuthState: string | undefined) => {
    const redirect =
        getValidatedProtonProtocolRedirect(fromUrl) || getValidatedProtonProtocolRedirect(fromOAuthState) || read();

    if (redirect) {
        try {
            sessionStorage.setItem(STORAGE_KEY, redirect);
        } catch {
            // Storage unavailable: the redirect is just not kept across a refresh
        }
    }

    return redirect;
};
