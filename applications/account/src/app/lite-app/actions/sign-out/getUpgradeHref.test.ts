import { PRODUCT_BIT } from '@proton/shared/lib/constants';

import { getUpgradeHref } from './getUpgradeHref';

const getParams = (Subscribed: number) =>
    Object.fromEntries(new URL(getUpgradeHref({ Subscribed }), 'https://a.b').searchParams);

describe('getUpgradeHref', () => {
    it('opens the plan selection of the only product the user pays for', () => {
        expect(getParams(PRODUCT_BIT.PASS)).toEqual({ action: 'subscribe-account', start: 'compare', app: 'pass' });
        expect(getParams(PRODUCT_BIT.VPN)).toEqual({ action: 'subscribe-account', start: 'compare', app: 'vpn' });
    });

    it.each([
        ['free users', 0],
        ['several products', PRODUCT_BIT.MAIL | PRODUCT_BIT.PASS],
        ['a product without its own plan selection', PRODUCT_BIT.WALLET],
    ])('opens the generic plan selection for %s', (_, Subscribed) => {
        expect(getParams(Subscribed)).toEqual({ action: 'subscribe-account', start: 'compare' });
    });
});
