import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { ADDON_NAMES, FREE_SUBSCRIPTION, PLANS } from '../../constants';
import { getPlanIDs } from './plan-ids';

describe('getPlanIDs', () => {
    it('maps subscription plans to their quantities', () => {
        const subscription = buildSubscription({
            [PLANS.MAIL]: 1,
            [ADDON_NAMES.LUMO_MAIL]: 2,
        });

        expect(getPlanIDs(subscription)).toEqual({
            [PLANS.MAIL]: 1,
            [ADDON_NAMES.LUMO_MAIL]: 2,
        });
    });

    it('returns an empty map without plans', () => {
        expect(getPlanIDs(FREE_SUBSCRIPTION)).toEqual({});
        expect(getPlanIDs(undefined)).toEqual({});
        expect(getPlanIDs(null)).toEqual({});
    });
});
