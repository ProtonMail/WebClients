import { useMember } from '@proton/account/member/hook';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { hasVisionary, isManagedExternally } from '@proton/payments';
import { hasLumoAddon } from '@proton/payments';
import { isOrganization, isSuperAdmin } from '@proton/shared/lib/organization/helper';

export const useLumoPlan = () => {
    const [user, isUserLoading] = useUser();
    const [subscription, isSubscriptionLoading] = useSubscription();
    const [organization, isOrganizationLoading] = useOrganization();
    const [member, isMemberLoading] = useMember();

    const isLoading = isUserLoading || isSubscriptionLoading || isOrganizationLoading || isMemberLoading;

    const hasLumoSeat = user.NumLumo > 0;
    const hasLumoPlusAddon = hasLumoAddon(subscription);
    const isVisionary = hasVisionary(subscription);

    const canShowUpsell = !hasLumoSeat && user.canPay && !user.isDelinquent && !isManagedExternally(subscription);
    const canShowLumoUpsellFree = user.isFree && canShowUpsell;
    const canShowLumoUpsellB2BOrB2C = user.isPaid && canShowUpsell;

    const userIsSuperAdmin = isSuperAdmin(member ? [member] : []);

    const isOrgOrMultiUser = isOrganization(organization) && !userIsSuperAdmin;
    const isOrgOrMultiAdmin = isOrganization(organization) && userIsSuperAdmin;

    return {
        /* same as isLumoPaid from useLumoCommon */
        hasLumoSeat,
        hasLumoPlusAddon,
        isVisionary,
        canShowUpsell,
        canShowLumoUpsellFree,
        canShowLumoUpsellB2BOrB2C,
        isOrgOrMultiUser,
        isOrgOrMultiAdmin,
        isLumoPlanLoading: isLoading,
    };
};
