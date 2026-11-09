import { Renew, SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { buildSubscription } from '../../testing/buildSubscription';
import { COUPON_CODES, PLANS } from '../constants';
import { getCancellableSubscriptions, isCancelSubscriptionSectionAvailable } from './cancellable-subscriptions';
import type { Subscription } from './interface';

const withId = (subscription: Subscription, ID: string): Subscription => ({ ...subscription, ID });

const mail = withId(buildSubscription(PLANS.MAIL), 'sub-mail');
const lumo = withId(buildSubscription(PLANS.LUMO), 'sub-lumo');
const cancelledLumo = { ...lumo, Renew: Renew.Disabled };
const googleDrive = { ...withId(buildSubscription(PLANS.DRIVE), 'sub-drive'), External: SubscriptionPlatform.Android };
const lifetimeMail = { ...withId(buildSubscription(PLANS.MAIL), 'sub-lifetime'), CouponCode: COUPON_CODES.LIFETIME };
const vpnEssentials = withId(buildSubscription(PLANS.VPN_PRO), 'sub-vpn-pro');
const businessTrial = { ...withId(buildSubscription(PLANS.VPN_PRO), 'sub-vpn-pro-trial'), IsTrial: true };

const ids = (subscriptions: Subscription[]) => subscriptions.map(({ ID }) => ID);

describe('getCancellableSubscriptions', () => {
    it('keeps every renewing subscription, web and store', () => {
        expect(ids(getCancellableSubscriptions([mail, lumo, googleDrive]))).toEqual([
            'sub-mail',
            'sub-lumo',
            'sub-drive',
        ]);
    });

    it('leaves out a subscription that is already cancelled', () => {
        expect(ids(getCancellableSubscriptions([mail, cancelledLumo]))).toEqual(['sub-mail']);
    });

    it('leaves out a lifetime subscription', () => {
        expect(ids(getCancellableSubscriptions([lifetimeMail, lumo]))).toEqual(['sub-lumo']);
    });

    it('leaves out a subscription cancellable only via support, but not its trial', () => {
        expect(ids(getCancellableSubscriptions([vpnEssentials, businessTrial]))).toEqual(['sub-vpn-pro-trial']);
    });
});

describe('isCancelSubscriptionSectionAvailable', () => {
    it('is available while one subscription can be cancelled', () => {
        expect(isCancelSubscriptionSectionAvailable([cancelledLumo, mail])).toBe(true);
    });

    it('is not available when none can be cancelled', () => {
        expect(isCancelSubscriptionSectionAvailable([cancelledLumo, lifetimeMail, vpnEssentials])).toBe(false);
        expect(isCancelSubscriptionSectionAvailable([])).toBe(false);
    });
});
