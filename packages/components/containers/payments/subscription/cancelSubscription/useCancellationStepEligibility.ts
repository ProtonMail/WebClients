import { useOrganization } from '@proton/account/organization/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useGetCalendars } from '@proton/calendar/calendars/hooks';
import useApi from '@proton/components/hooks/useApi';
import { getAvailableSubscriptionActions, hasMigrationDiscount, hasPassLaunchOffer } from '@proton/payments';
import { getShouldCalendarPreventSubscripitionChange } from '@proton/shared/lib/calendar/plans';
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import { hasPaidMail, hasPaidVpn } from '@proton/shared/lib/user/helpers';

export const useCancellationStepEligibility = () => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const [plansResult] = usePlans();
    const api = useApi();
    const getCalendars = useGetCalendars();
    const plans = plansResult?.plans ?? [];

    const canShowCalendarDowngrade = async () => {
        return getShouldCalendarPreventSubscripitionChange({
            user,
            newPlan: {},
            api,
            getCalendars,
            plans,
        });
    };

    const canShowDiscountWarning = async () => {
        return !!subscription && !!hasMigrationDiscount(subscription);
    };

    const canShowDowngrade = async () => {
        return hasPaidMail(user) || hasPaidVpn(user);
    };

    const canShowInAppPurchase = async () => {
        return !!subscription && !getAvailableSubscriptionActions(subscription).canCancel;
    };

    const canShowLossLoyalty = async () => {
        return !!organization && hasBonuses(organization);
    };

    const canShowMemberDowngrade = async () => {
        return (organization?.UsedMembers ?? 0) > 1;
    };

    const canShowPassLaunchOffer = async () => {
        return !!subscription && hasPassLaunchOffer(subscription);
    };

    return {
        canShowCalendarDowngrade,
        canShowDiscountWarning,
        canShowDowngrade,
        canShowInAppPurchase,
        canShowLossLoyalty,
        canShowMemberDowngrade,
        canShowPassLaunchOffer,
    };
};
