import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { SubscriptionCheckForbiddenReason } from '@proton/payments/index';
import { SubscriptionMode } from '@proton/payments/index';

import type { CouponConfigRendered } from '../../coupon-config/useCouponConfig';
import { canShowGiftCodeInput } from './canShowGiftCodeInput';

const allowed: SubscriptionCheckForbiddenReason = { forbidden: false };

const baseInput = {
    paymentForbiddenReason: allowed,
    couponConfig: undefined as CouponConfigRendered | undefined,
    checkResult: { SubscriptionMode: SubscriptionMode.Regular } as SubscriptionEstimation,
};

describe('canShowGiftCodeInput', () => {
    it('returns true when payment is allowed, no coupon config, regular mode', () => {
        expect(canShowGiftCodeInput(baseInput)).toBe(true);
    });

    it('returns true when forbidden reason is already-subscribed', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                paymentForbiddenReason: { forbidden: true, reason: 'already-subscribed' },
            })
        ).toBe(true);
    });

    it('returns false when forbidden reason is already-subscribed-externally', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                paymentForbiddenReason: { forbidden: true, reason: 'already-subscribed-externally' },
            })
        ).toBe(false);
    });

    it('returns false when forbidden reason is offer-not-available', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                paymentForbiddenReason: { forbidden: true, reason: 'offer-not-available' },
            })
        ).toBe(false);
    });

    it('returns false when couponConfig.hidden is true', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                couponConfig: { hidden: true } as CouponConfigRendered,
            })
        ).toBe(false);
    });

    it('returns true when couponConfig is undefined', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                couponConfig: undefined,
            })
        ).toBe(true);
    });

    it('returns true when couponConfig.hidden is false', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                couponConfig: { hidden: false } as CouponConfigRendered,
            })
        ).toBe(true);
    });

    it('returns false when SubscriptionMode is ScheduledChargedLater', () => {
        expect(
            canShowGiftCodeInput({
                ...baseInput,
                checkResult: { SubscriptionMode: SubscriptionMode.ScheduledChargedLater } as SubscriptionEstimation,
            })
        ).toBe(false);
    });

    it.each([SubscriptionMode.CustomBillings, SubscriptionMode.ScheduledChargedImmediately])(
        'returns true for SubscriptionMode %s',
        (mode) => {
            expect(
                canShowGiftCodeInput({
                    ...baseInput,
                    checkResult: { SubscriptionMode: mode } as SubscriptionEstimation,
                })
            ).toBe(true);
        }
    );
});
