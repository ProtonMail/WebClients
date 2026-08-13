import { APPS } from '@proton/shared/lib/constants';

import { type ProtonForkData, SSOType } from '../content/actions/forkInterface';
import { clearForkState, readForkState, saveForkState } from './persistedForkState';

const getForkData = (redirectUrl: URL | null): ProtonForkData => ({
    type: SSOType.Proton,
    payload: {
        forkParameters: {
            state: 'state',
            app: APPS.PROTONMAIL,
            localID: 0,
            independent: false,
            forkVersion: 1,
            prompt: undefined,
            promptType: 'default',
            promptBypass: 'sso',
            payloadType: 'default',
            payloadVersion: 1,
            unauthenticatedReturnUrl: '',
            returnUrl: undefined,
            redirectUrl,
        },
    },
});

describe('persistedForkState', () => {
    afterEach(() => {
        clearForkState();
    });

    it('returns null when nothing is saved', () => {
        expect(readForkState()).toBe(null);
    });

    const readRedirectUrl = () => {
        const forkState = readForkState();
        return forkState?.type === SSOType.Proton ? forkState.payload.forkParameters.redirectUrl : undefined;
    };

    it('restores redirectUrl as a URL and not as a string', () => {
        saveForkState(getForkData(new URL('http://localhost:8080/callback')));

        const redirectUrl = readRedirectUrl();

        expect(redirectUrl).toBeInstanceOf(URL);
        expect(redirectUrl?.href).toBe('http://localhost:8080/callback');
        // The property that matters: consumers can read protocol and hostname off it
        expect(redirectUrl?.protocol).toBe('http:');
        expect(redirectUrl?.hostname).toBe('localhost');
    });

    it('keeps a null redirectUrl as null', () => {
        saveForkState(getForkData(null));

        expect(readRedirectUrl()).toBe(null);
    });

    it('returns null for a saved proton fork without fork parameters', () => {
        saveForkState({ type: SSOType.Proton, payload: {} } as unknown as ProtonForkData);

        expect(readForkState()).toBe(null);
    });
});
