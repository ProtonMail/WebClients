import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { hasBundleBiz2025, hasBundlePro2024, hasVisionary } from '@proton/payments/core/subscription/helpers';
import { getUserCreationDate, getUserDaysSinceCreation } from '@proton/shared/lib/user/helpers';

export const useIsTreatedAsPaidMeetUser = () => {
    const [user] = useUser();
    const daysSinceCreation = getUserDaysSinceCreation(getUserCreationDate(user));
    const [subscription] = useSubscription();

    const hasSubscription =
        hasVisionary(subscription) || hasBundlePro2024(subscription) || hasBundleBiz2025(subscription);

    return daysSinceCreation < 3 || hasSubscription || user.hasPaidMeet;
};
