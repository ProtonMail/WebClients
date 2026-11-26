import { APPS } from '@proton/shared/lib/constants';

import { getUpgradeUrl } from './SessionLimit';

const getParams = (url: string) => Object.fromEntries(new URL(url, 'https://a.b').searchParams);

describe('getUpgradeUrl', () => {
    it('opens the plan selection of the app the user signs in to', () => {
        expect(getParams(getUpgradeUrl(3, APPS.PROTONPASS))).toEqual({
            action: 'subscribe-account',
            start: 'compare',
            u: '3',
            app: 'pass',
        });
    });

    it('opens the Pass plans from the Pass browser extension', () => {
        expect(getParams(getUpgradeUrl(3, APPS.PROTONPASSBROWSEREXTENSION))).toHaveProperty('app', 'pass');
    });

    it('opens the generic plan selection for apps without their own plans', () => {
        expect(getParams(getUpgradeUrl(3, APPS.PROTONACCOUNT))).not.toHaveProperty('app');
    });
});
