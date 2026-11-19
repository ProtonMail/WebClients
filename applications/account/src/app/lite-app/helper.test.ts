import { APPS } from '@proton/shared/lib/constants';

import { getApp } from './helper';

describe('getApp', () => {
    it('maps the lumo app param to Lumo', () => {
        expect(getApp({ app: 'lumo' })).toBe(APPS.PROTONLUMO);
    });

    it.each(['lumobasic2026', 'lumo2024', 'lumoultra2026'])('maps the %s plan to Lumo', (plan) => {
        expect(getApp({ app: 'proton-lumo', plan })).toBe(APPS.PROTONLUMO);
    });

    it('maps a Lumo redirect to Lumo', () => {
        expect(getApp({ redirect: 'https://lumo.proton.me' })).toBe(APPS.PROTONLUMO);
    });

    it('keeps the other products', () => {
        expect(getApp({ app: 'mail' })).toBe(APPS.PROTONMAIL);
        expect(getApp({ plan: 'vpn2024' })).toBe(APPS.PROTONVPN_SETTINGS);
        expect(getApp({ plan: 'bundle2022' })).toBe('generic');
    });
});
