import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    multiSubscriptionTestCatalog,
} from '../../testing/buildMultiSubscriptionContext';
import { buildSubscription } from '../../testing/buildSubscription';
import { PLANS } from '../constants';
import { canModifySubscriptions, isForbiddenForStoreLumoSubscriber } from './lumo-purchase-rules';
import { createMultiSubscriptionContext } from './multi-subscription-context';

const ios = { External: SubscriptionPlatform.iOS };
const android = { External: SubscriptionPlatform.Android };

const webMailPlus = buildSubscription(PLANS.MAIL, { Currency: 'USD' });
const webLumoPlus = buildLumoSubscription(PLANS.LUMO, { Currency: 'CHF' });
const iosLumoPlus = buildLumoSubscription(PLANS.LUMO, ios);
const iosLumoUltra = buildLumoSubscription(PLANS.LUMO_ULTRA, ios);
const androidMailPlus = buildSubscription(PLANS.MAIL, android);

describe('canModifySubscriptions', () => {
    it.each([
        ['no subscription', []],
        ['a web subscription', [webMailPlus]],
        ['one store Lumo Plus subscription', [iosLumoPlus]],
        ['one store Lumo Ultra subscription', [iosLumoUltra]],
        ['a store Lumo and a web subscription', [iosLumoPlus, webMailPlus]],
    ])('allows modifications with %s', (_, subscriptions) => {
        expect(canModifySubscriptions({ subscriptions, entitlementCatalog: multiSubscriptionTestCatalog })).toBe(true);
    });

    it.each([
        ['one store Mail Plus subscription', [androidMailPlus]],
        ['two store subscriptions, one of them Lumo', [iosLumoPlus, androidMailPlus]],
    ])('forbids modifications with %s', (_, subscriptions) => {
        expect(canModifySubscriptions({ subscriptions, entitlementCatalog: multiSubscriptionTestCatalog })).toBe(false);
    });
});

describe('createMultiSubscriptionContext', () => {
    it('turns the context on with the flag and the catalog', () => {
        const context = createMultiSubscriptionContext({
            lumoMultiSubscriptions: true,
            subscription: webMailPlus,
            entitlementCatalog: multiSubscriptionTestCatalog,
        });

        expect(context).toEqual({
            lumoMultiSubscriptions: true,
            subscriptions: [webMailPlus],
            entitlementCatalog: multiSubscriptionTestCatalog,
        });
    });

    it('keeps the context off while the catalog is missing', () => {
        const context = createMultiSubscriptionContext({
            lumoMultiSubscriptions: true,
            subscription: webMailPlus,
            entitlementCatalog: undefined,
        });

        expect(context.lumoMultiSubscriptions).toBe(false);
    });
});

describe('isForbiddenForStoreLumoSubscriber', () => {
    const context = buildMultiSubscriptionContext([iosLumoPlus]);

    it.each([PLANS.MAIL, PLANS.PASS, PLANS.VPN2024, PLANS.DRIVE, PLANS.BUNDLE])('allows %s', (planName) => {
        expect(isForbiddenForStoreLumoSubscriber(context, planName)).toBe(false);
    });

    it.each([PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY, PLANS.PASS_FAMILY, PLANS.BUNDLE_PRO_2024, PLANS.LUMO_BUSINESS])(
        'forbids the multi-user plan %s',
        (planName) => {
            expect(isForbiddenForStoreLumoSubscriber(context, planName)).toBe(true);
        }
    );

    it.each([PLANS.LUMO_BASIC, PLANS.LUMO_ULTRA])('forbids another Lumo tier %s', (planName) => {
        expect(isForbiddenForStoreLumoSubscriber(context, { [planName]: 1 })).toBe(true);
    });

    it('leaves the same Lumo plan to the already-subscribed check', () => {
        expect(isForbiddenForStoreLumoSubscriber(context, { [PLANS.LUMO]: 1 })).toBe(false);
    });

    it('forbids nothing without a store Lumo subscription', () => {
        expect(isForbiddenForStoreLumoSubscriber(buildMultiSubscriptionContext([webLumoPlus]), PLANS.FAMILY)).toBe(
            false
        );
    });
});
