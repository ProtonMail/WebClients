import type { InfoAuthedResponse } from '@proton/shared/lib/authentication/interface';
import { APPS } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';

import { getTwoFactorTypes } from './getTwoFactorTypes';

describe('getTwoFactorTypes', () => {
    const app = APPS.PROTONACCOUNT;

    it('returns all false for locked scope when 2fa enabled', () => {
        const res = getTwoFactorTypes({
            scope: 'locked',
            infoResult: { ['2FA']: { Enabled: 1, FIDO2: null, TOTP: 1 } } as InfoAuthedResponse,
            userSettings: { ['2FA']: { Enabled: 1 } } as UserSettings,
            app,
        });
        expect(res).toEqual({ totp: false, fido2: false, twoFactor: false });
    });

    it('returns totp true for password scope, when 2fa enabled', () => {
        const res = getTwoFactorTypes({
            scope: 'password',
            infoResult: { ['2FA']: { Enabled: 1, FIDO2: null, TOTP: 1 } } as InfoAuthedResponse,
            userSettings: { ['2FA']: { Enabled: 1 } } as UserSettings,
            app,
        });
        expect(res).toEqual({ totp: true, fido2: false, twoFactor: true });
    });

    it('returns totp true for password scope, when 2fa enabled for info and disabled for settings', () => {
        const res = getTwoFactorTypes({
            scope: 'password',
            infoResult: { ['2FA']: { Enabled: 1, FIDO2: null, TOTP: 1 } } as InfoAuthedResponse,
            userSettings: { ['2FA']: { Enabled: 0 } } as UserSettings,
            app,
        });
        expect(res).toEqual({ totp: true, fido2: false, twoFactor: true });
    });

    it('returns totp false for password scope, when 2fa disabled for info and enabled for settings', () => {
        const res = getTwoFactorTypes({
            scope: 'password',
            infoResult: { ['2FA']: { Enabled: 0, FIDO2: null, TOTP: 1 } } as InfoAuthedResponse,
            userSettings: { ['2FA']: { Enabled: 1 } } as UserSettings,
            app,
        });
        expect(res).toEqual({ totp: false, fido2: false, twoFactor: false });
    });
});
