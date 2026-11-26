import { PRODUCT_BIT } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces/User';

import { SupportedActions } from '../../helper';

// `app` values understood by the lite app's `getApp`
const appBySubscribedProduct: Partial<Record<PRODUCT_BIT, string>> = {
    [PRODUCT_BIT.MAIL]: 'mail',
    [PRODUCT_BIT.DRIVE]: 'drive',
    [PRODUCT_BIT.VPN]: 'vpn',
    [PRODUCT_BIT.PASS]: 'pass',
    [PRODUCT_BIT.LUMO]: 'lumo',
};

/**
 * The device limit comes with the plan, so the checkout of the current one can't raise it: open the plan selection.
 * Users who pay for a single product get that product's plans; others get the generic ones.
 */
export const getUpgradeHref = (user: Pick<User, 'Subscribed'>) => {
    const params = new URLSearchParams({ action: SupportedActions.SubscribeAccount, start: 'compare' });
    const app = appBySubscribedProduct[user.Subscribed as PRODUCT_BIT];
    if (app) {
        params.set('app', app);
    }
    return `/lite?${params}`;
};
