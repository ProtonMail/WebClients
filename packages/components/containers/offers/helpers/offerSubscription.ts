import type { Subscription } from '@proton/payments';
import {
    CYCLE,
    getHas2025OfferCoupon,
    getIsVariableCycleOffer,
    hasAnniversary2025Coupon,
    hasBundle,
    hasDeprecatedVPN,
    hasDrive,
    hasDrive1TB,
    hasDuo,
    hasFamily,
    hasLumo,
    hasMail,
    hasPass,
    hasPassFamily,
    hasVPN2024,
    hasVPNPassBundle,
    isManagedExternally,
} from '@proton/payments';

class OfferSubscription {
    subscription: Subscription;

    upcomingSubscription?: Subscription | null;

    constructor(subscription: Subscription) {
        this.subscription = subscription;
        this.upcomingSubscription = subscription.UpcomingSubscription;
    }

    getCycle() {
        if (getIsVariableCycleOffer(this.subscription)) {
            return this.subscription.Cycle;
        }

        if (this.upcomingSubscription) {
            return this.upcomingSubscription?.Cycle;
        }

        return this.subscription.Cycle;
    }

    getCouponCode() {
        if (this.upcomingSubscription) {
            return this.upcomingSubscription?.CouponCode;
        }

        return this.subscription.CouponCode;
    }

    hasMonthlyCycle() {
        return this.getCycle() === CYCLE.MONTHLY;
    }

    hasYearlyCycle() {
        return this.getCycle() === CYCLE.YEARLY;
    }

    hasFifteenMonthsCycle() {
        return this.getCycle() === CYCLE.FIFTEEN;
    }

    hasTwoYearsCycle() {
        return this.getCycle() === CYCLE.TWO_YEARS;
    }

    hasThirtyMonthsCycle() {
        return this.getCycle() === CYCLE.THIRTY;
    }

    isManagedExternally() {
        if (this.upcomingSubscription) {
            return isManagedExternally(this.upcomingSubscription);
        }

        return isManagedExternally(this.subscription);
    }

    hasDrive() {
        if (this.upcomingSubscription) {
            return hasDrive(this.upcomingSubscription);
        }

        return hasDrive(this.subscription);
    }

    hasDrive1TB() {
        if (this.upcomingSubscription) {
            return hasDrive1TB(this.upcomingSubscription);
        }

        return hasDrive1TB(this.subscription);
    }

    hasPass() {
        if (this.upcomingSubscription) {
            return hasPass(this.upcomingSubscription);
        }

        return hasPass(this.subscription);
    }

    hasPassFamily() {
        if (this.upcomingSubscription) {
            return hasPassFamily(this.upcomingSubscription);
        }

        return hasPassFamily(this.subscription);
    }

    hasVPNPassBundle() {
        if (this.upcomingSubscription) {
            return hasVPNPassBundle(this.upcomingSubscription);
        }

        return hasVPNPassBundle(this.subscription);
    }

    hasMail() {
        if (this.upcomingSubscription) {
            return hasMail(this.upcomingSubscription);
        }

        return hasMail(this.subscription);
    }

    hasLumo() {
        if (this.upcomingSubscription) {
            return hasLumo(this.upcomingSubscription);
        }

        return hasLumo(this.subscription);
    }

    hasDeprecatedVPN() {
        if (this.upcomingSubscription) {
            return hasDeprecatedVPN(this.upcomingSubscription);
        }

        return hasDeprecatedVPN(this.subscription);
    }

    hasVPN2024() {
        if (this.upcomingSubscription) {
            return hasVPN2024(this.upcomingSubscription);
        }

        return hasVPN2024(this.subscription);
    }

    hasDuo() {
        if (this.upcomingSubscription) {
            return hasDuo(this.upcomingSubscription);
        }

        return hasDuo(this.subscription);
    }

    hasFamily() {
        if (this.upcomingSubscription) {
            return hasFamily(this.upcomingSubscription);
        }

        return hasFamily(this.subscription);
    }

    hasBundle() {
        if (this.upcomingSubscription) {
            return hasBundle(this.upcomingSubscription);
        }

        return hasBundle(this.subscription);
    }

    hasAnniversary2025Coupon() {
        if (this.upcomingSubscription) {
            return hasAnniversary2025Coupon(this.upcomingSubscription) || hasAnniversary2025Coupon(this.subscription);
        }

        return hasAnniversary2025Coupon(this.subscription);
    }

    hasBF2025Coupon() {
        if (this.upcomingSubscription) {
            return (
                getHas2025OfferCoupon(this.upcomingSubscription.CouponCode) ||
                getHas2025OfferCoupon(this.subscription.CouponCode)
            );
        }

        return getHas2025OfferCoupon(this.subscription.CouponCode);
    }
}

export default OfferSubscription;
