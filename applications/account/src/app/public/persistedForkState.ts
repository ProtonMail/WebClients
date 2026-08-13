import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';

import { type ProduceForkData, SSOType } from '../content/actions/forkInterface';

export const saveForkState = (state: ProduceForkData) => {
    setItem('fork-state', JSON.stringify(state));
};

export const clearForkState = () => {
    removeItem('fork-state');
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
            // A URL does not survive JSON, it serializes to its href. Parse it back so that consumers
            // get the URL the type promises rather than a string. Both forms are accepted here.
            const { redirectUrl } = forkParameters;
            return {
                ...forkState,
                payload: {
                    ...forkState.payload,
                    forkParameters: {
                        ...forkParameters,
                        redirectUrl: redirectUrl && URL.canParse(redirectUrl) ? new URL(redirectUrl) : null,
                    },
                },
            };
        }
        return forkState;
    } catch {}
    return null;
};
