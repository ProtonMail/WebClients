import { getForkRedirectUrl } from '@proton/shared/lib/authentication/fork/produce';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';

import { type ProduceForkData, SSOType } from '../content/actions/forkInterface';

export const saveForkState = (state: ProduceForkData) => {
    setItem('fork-state', JSON.stringify(state));
};

export const clearForkState = () => {
    removeItem('fork-state');
};

/** The saved redirect's href: JSON keeps a URL as its href, inside `url` or, in older saves, as the whole value. */
const getSavedRedirectHref = (saved: unknown) => {
    if (typeof saved === 'string') {
        return saved;
    }
    if (typeof saved === 'object' && saved !== null && 'url' in saved && typeof saved.url === 'string') {
        return saved.url;
    }
};

export const readForkState = (): ProduceForkData | null => {
    try {
        const forkState: ProduceForkData = JSON.parse(getItem('fork-state') || '');
        if (!('type' in forkState)) {
            return null;
        }
        if (forkState.type === SSOType.Proton) {
            const forkParameters = forkState.payload?.forkParameters;
            // The type says this is always there, but the value comes from session storage, so treat a
            // missing one as nothing saved rather than handing consumers a half-built fork.
            if (!forkParameters) {
                return null;
            }
            // A URL does not survive JSON, it serializes to its href. Parse it back, and validate it again since
            // session storage may hold one saved before validation or changed since.
            const { redirectUrl } = forkParameters;
            return {
                ...forkState,
                payload: {
                    ...forkState.payload,
                    forkParameters: {
                        ...forkParameters,
                        redirectUrl: getForkRedirectUrl(getSavedRedirectHref(redirectUrl), forkParameters.app),
                    },
                },
            };
        }
        return forkState;
    } catch {}
    return null;
};
