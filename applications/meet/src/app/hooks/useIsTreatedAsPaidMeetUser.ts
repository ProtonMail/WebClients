import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { hasBundleBiz2025, hasBundlePro2024, hasVisionary } from '@proton/payments/core/subscription/helpers';
import { isProtoneer } from '@proton/shared/lib/helpers/organization';
import { getUserCreationDate, getUserDaysSinceCreation, isMember } from '@proton/shared/lib/user/helpers';

export const useIsTreatedAsPaidMeetUser = () => {
    const [user] = useUser();
    const daysSinceCreation = getUserDaysSinceCreation(getUserCreationDate(user));
    const [subscription] = useSubscription();
    const [organization] = useOrganization();

    const hasSubscriptionWithMeetFeature =
        hasVisionary(subscription) ||
        hasBundlePro2024(subscription) ||
        hasBundleBiz2025(subscription) ||
        isProtoneer(organization);

    return {
        isPaid: daysSinceCreation < 3 || hasSubscriptionWithMeetFeature || user.hasPaidMeet,
        isSubUser: isMember(user),
        hasSubscriptionWithoutMeet: !!subscription && !hasSubscriptionWithMeetFeature && !user.hasPaidMeet,
    };
};
