import type { InfoAuthedResponse } from '@proton/shared/lib/authentication/interface';
import { APPS } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';

import { getReAuthTwoFactorTypes } from './getReAuthTwoFactorTypes';

describe('getReAuthTwoFactorTypes', () => {
    const app = APPS.PROTONACCOUNT;

    it('returns all false for locked scope when 2fa enabled', () => {
        const res = getReAuthTwoFactorTypes({
            scope: 'locked',
            infoResult: { ['2FA']: { Enabled: 1, FIDO2: null, TOTP: 1 } } as InfoAuthedResponse,
            userSettings: { ['2FA']: { Enabled: 1 } } as UserSettings,
            app,
        });
        expect(res).toEqual({ totp: false, fido2: false, enabled: false });
    });

    it('returns totp true for password scope, when 2fa enabled', () => {
        const res = getReAuthTwoFactorTypes({
            scope: 'password',
            infoResult: { ['2FA']: { Enabled: 1, FIDO2: null, TOTP: 1 } } as InfoAuthedResponse,
            userSettings: { ['2FA']: { Enabled: 1 } } as UserSettings,
            app,
        });
        expect(res).toEqual({ totp: true, fido2: false, enabled: true });
    });

    it('returns totp true for password scope, when 2fa enabled for info and disabled for settings', () => {
        const res = getReAuthTwoFactorTypes({
            scope: 'password',
            infoResult: { ['2FA']: { Enabled: 1, FIDO2: null, TOTP: 1 } } as InfoAuthedResponse,
            userSettings: { ['2FA']: { Enabled: 0 } } as UserSettings,
            app,
        });
        expect(res).toEqual({ totp: true, fido2: false, enabled: true });
    });

    it('returns totp false for password scope, when 2fa disabled for info and enabled for settings', () => {
        const res = getReAuthTwoFactorTypes({
            scope: 'password',
            infoResult: { ['2FA']: { Enabled: 0, FIDO2: null, TOTP: 1 } } as InfoAuthedResponse,
            userSettings: { ['2FA']: { Enabled: 1 } } as UserSettings,
            app,
        });
        expect(res).toEqual({ totp: false, fido2: false, enabled: false });
    });

    it('should throw for unsupported 2fa', () => {
        expect(() =>
            getReAuthTwoFactorTypes({
                scope: 'password',
                infoResult: { ['2FA']: { Enabled: 4, FIDO2: null, TOTP: 0 } } as InfoAuthedResponse,
                userSettings: { ['2FA']: { Enabled: 0 } } as UserSettings,
                app,
            })
        ).toThrow('Unsupported two-factor method enabled');
    });

    it('should throw for unsupported fido2', () => {
        expect(() =>
            getReAuthTwoFactorTypes({
                scope: 'password',
                infoResult: { ['2FA']: { Enabled: 2, FIDO2: null, TOTP: 0 } } as InfoAuthedResponse,
                userSettings: { ['2FA']: { Enabled: 2 } } as UserSettings,
                app,
            })
        ).toThrow('WebAuthn support is not available on this device');
    });

    it('should throw for unsupported fido2 vpn app', () => {
        expect(() =>
            getReAuthTwoFactorTypes({
                scope: 'password',
                infoResult: { ['2FA']: { Enabled: 2, FIDO2: null, TOTP: 0 } } as InfoAuthedResponse,
                userSettings: { ['2FA']: { Enabled: 2 } } as UserSettings,
                app: APPS.PROTONVPN_SETTINGS,
            })
        ).toThrow('Security key sign-in is not supported on this application, please use https://account.proton.me');
    });
});
