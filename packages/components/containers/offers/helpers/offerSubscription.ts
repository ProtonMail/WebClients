import type { Subscription } from '@proton/payments';
import {
    CYCLE,
    hasAnniversary2025Coupon,
    hasBundle,
    hasDeprecatedVPN,
    hasDrive,
    hasDuo,
    hasMail,
    hasPass,
    hasVPN2024,
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

    isMonthly() {
        return this.getCycle() === CYCLE.MONTHLY;
    }

    isYearly() {
        return this.getCycle() === CYCLE.YEARLY;
    }

    isTwoYears() {
        return this.getCycle() === CYCLE.TWO_YEARS;
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

    hasPass() {
        if (this.upcomingSubscription) {
            return hasPass(this.upcomingSubscription);
        }

        return hasPass(this.subscription);
    }

    hasMail() {
        if (this.upcomingSubscription) {
            return hasMail(this.upcomingSubscription);
        }

        return hasMail(this.subscription);
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
}

export default OfferSubscription;
