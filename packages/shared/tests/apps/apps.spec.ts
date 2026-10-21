import { appSupportsSSO } from '../../lib/apps/apps';
import { APPS } from '../../lib/constants';

describe('appSupportsSSO', () => {
    it('returns true for SSO-capable apps', () => {
        expect(appSupportsSSO(APPS.PROTONVPN_SETTINGS)).toBe(true);
        expect(appSupportsSSO(APPS.PROTONPASS)).toBe(true);
        expect(appSupportsSSO(APPS.PROTONLUMO)).toBe(true);
    });

    it('returns false for apps without SSO support', () => {
        expect(appSupportsSSO(APPS.PROTONMAIL)).toBe(false);
        expect(appSupportsSSO(APPS.PROTONDRIVE)).toBe(false);
        expect(appSupportsSSO(undefined)).toBe(false);
    });
});
