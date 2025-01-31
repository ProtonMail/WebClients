import { type SubscriptionCheckResponse, SubscriptionMode } from '@proton/shared/lib/interfaces';

import { getCheckoutModifiers } from './checkout-modifiers';
import { CYCLE } from './constants';

describe('getCheckoutModifiers', () => {
    let checkResult: SubscriptionCheckResponse;

    beforeEach(() => {
        checkResult = {
            Amount: 499,
            AmountDue: 499,
            Coupon: null,
            Currency: 'CHF',
            Cycle: CYCLE.MONTHLY,
            PeriodEnd: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60),
            SubscriptionMode: SubscriptionMode.Regular,
        };
    });

    it('should set all checkout modifiers to false if check result is optimistic', () => {
        checkResult.optimistic = true;
        const modifiers = getCheckoutModifiers(checkResult);
        expect(modifiers.isProration).toEqual(false);
        expect(modifiers.isScheduledChargedImmediately).toEqual(false);
        expect(modifiers.isCustomBilling).toEqual(false);
        expect(modifiers.isScheduledChargedLater).toEqual(false);
    });

    it('should set isProration to true if SubscriptionMode is Regular', () => {
        checkResult.SubscriptionMode = SubscriptionMode.Regular;
        const modifiers = getCheckoutModifiers(checkResult);

        expect(modifiers.isProration).toEqual(true);
        expect(modifiers.isScheduledChargedImmediately).toEqual(false);
        expect(modifiers.isScheduledChargedLater).toEqual(false);
        expect(modifiers.isScheduled).toEqual(false);
        expect(modifiers.isCustomBilling).toEqual(false);
    });

    it('should set isCustomBilling to true if SubscriptionMode is CustomBillings', () => {
        checkResult.SubscriptionMode = SubscriptionMode.CustomBillings;
        const modifiers = getCheckoutModifiers(checkResult);

        expect(modifiers.isProration).toEqual(false);
        expect(modifiers.isCustomBilling).toEqual(true);
        expect(modifiers.isScheduledChargedImmediately).toEqual(false);
        expect(modifiers.isScheduledChargedLater).toEqual(false);
        expect(modifiers.isScheduled).toEqual(false);
    });

    it('should set isScheduledChargedImmediately to true if SubscriptionMode is ScheduledChargedImmediately', () => {
        checkResult.SubscriptionMode = SubscriptionMode.ScheduledChargedImmediately;
        const modifiers = getCheckoutModifiers(checkResult);

        expect(modifiers.isProration).toEqual(false);
        expect(modifiers.isCustomBilling).toEqual(false);
        expect(modifiers.isScheduledChargedImmediately).toEqual(true);
        expect(modifiers.isScheduledChargedLater).toEqual(false);
        expect(modifiers.isScheduled).toEqual(true);
    });

    it('should set isScheduledChargedLater to true if SubscriptionMode is ScheduledChargedLater', () => {
        checkResult.SubscriptionMode = SubscriptionMode.ScheduledChargedLater;
        const modifiers = getCheckoutModifiers(checkResult);

        expect(modifiers.isProration).toEqual(false);
        expect(modifiers.isCustomBilling).toEqual(false);
        expect(modifiers.isScheduledChargedImmediately).toEqual(false);
        expect(modifiers.isScheduledChargedLater).toEqual(true);
        expect(modifiers.isScheduled).toEqual(true);
    });
});
