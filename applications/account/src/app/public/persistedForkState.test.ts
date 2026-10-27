import type { ValidatedRedirectUrl } from '@proton/shared/lib/authentication/fork/getValidatedRedirectUrl';
import { getForkRedirectUrl } from '@proton/shared/lib/authentication/fork/produce';
import { APPS } from '@proton/shared/lib/constants';
import { setItem } from '@proton/shared/lib/helpers/sessionStorage';

import { type ProtonForkData, SSOType } from '../content/actions/forkInterface';
import { clearForkState, readForkState, saveForkState } from './persistedForkState';

const getForkData = (redirectUrl: ValidatedRedirectUrl | null): ProtonForkData => ({
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
            forkChallenge: undefined,
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
        saveForkState(getForkData(getForkRedirectUrl('http://localhost:8080/callback', APPS.PROTONMAIL)));

        const redirectUrl = readRedirectUrl()?.url;

        expect(redirectUrl).toBeInstanceOf(URL);
        expect(redirectUrl?.href).toBe('http://localhost:8080/callback');
        // The property that matters: consumers can read protocol and hostname off it
        expect(redirectUrl?.protocol).toBe('http:');
        expect(redirectUrl?.hostname).toBe('localhost');
    });

    it('validates the saved redirectUrl again, also from older saves holding only its href', () => {
        const save = (redirectUrl: string) => {
            const { forkParameters } = getForkData(null).payload;
            setItem(
                'fork-state',
                JSON.stringify({
                    type: SSOType.Proton,
                    payload: { forkParameters: { ...forkParameters, redirectUrl } },
                })
            );
        };

        save('http://localhost:8080/callback');
        expect(readRedirectUrl()).toMatchObject({ consent: 'redirect' });

        save('https://evil.com/');
        expect(readRedirectUrl()).toBe(null);
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
