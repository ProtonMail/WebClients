import { APPS } from '@proton/shared/lib/constants';

import { type ProduceForkData, SSOType } from '../actions/forkInterface';
import { getIsIndependentFork } from './getIsIndependentFork';

const getProtonForkData = ({
    independent,
    isDesktopFork = false,
}: {
    independent: boolean;
    isDesktopFork?: boolean;
}): ProduceForkData => ({
    type: SSOType.Proton,
    payload: {
        forkParameters: {
            state: 'state',
            app: APPS.PROTONPASS,
            localID: undefined,
            independent,
            forkVersion: 1,
            prompt: undefined,
            promptType: 'default',
            promptBypass: 'sso',
            payloadType: 'default',
            forkChallenge: undefined,
            payloadVersion: 1,
            unauthenticatedReturnUrl: '',
            returnUrl: undefined,
            redirectUrl: null,
        },
        desktopForkParameters: isDesktopFork
            ? {
                  app: APPS.PROTONPASS,
                  redirectUrl: undefined,
                  qrCodePayload: {
                      version: 0,
                      userCode: 'ABCDEFGH',
                      encodedBytes: undefined,
                      childClientId: 'macos-pass',
                  },
              }
            : undefined,
    },
});

describe('getIsIndependentFork', () => {
    it('is false without a fork', () => {
        expect(getIsIndependentFork(null)).toBe(false);
    });

    it('is false for an OAuth fork', () => {
        const oauthFork: ProduceForkData = {
            type: SSOType.OAuth,
            payload: {
                oauthData: {
                    clientID: 'client',
                    oaSession: 'session',
                    clientInfo: { ClientID: 'client', Name: 'Client', Logo: '', ModifyTime: 0, CreateTime: 0 },
                },
            },
        };
        expect(getIsIndependentFork(oauthFork)).toBe(false);
    });

    it('is false for a dependent Proton fork', () => {
        expect(getIsIndependentFork(getProtonForkData({ independent: false }))).toBe(false);
    });

    it('is true for a Proton fork requested as independent', () => {
        expect(getIsIndependentFork(getProtonForkData({ independent: true }))).toBe(true);
    });

    it('is true for a desktop fork, which always creates an independent session', () => {
        expect(getIsIndependentFork(getProtonForkData({ independent: false, isDesktopFork: true }))).toBe(true);
    });
});
