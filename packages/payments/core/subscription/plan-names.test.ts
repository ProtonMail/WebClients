import { buildSubscription } from '../../testing/buildSubscription';
import { ADDON_NAMES, PLANS } from '../constants';
import { getPlanNamesOfSubscriptions } from './plan-names';

describe('getPlanNamesOfSubscriptions', () => {
    it('returns the plan name of every subscription without addons', () => {
        const mailPlus = buildSubscription({ [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 });
        const vpnPlus = buildSubscription(PLANS.VPN2024);

        expect(getPlanNamesOfSubscriptions([mailPlus, vpnPlus], PLANS.FREE)).toEqual([PLANS.MAIL, PLANS.VPN2024]);
    });

    it.each([PLANS.FREE, PLANS.PASS_LIFETIME] as const)(
        'returns %s when there are no subscriptions',
        (planNameWithoutSubscriptions) => {
            expect(getPlanNamesOfSubscriptions([], planNameWithoutSubscriptions)).toEqual([
                planNameWithoutSubscriptions,
            ]);
        }
    );
});
