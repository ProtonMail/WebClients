import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { useMember } from '@proton/account/member/hook';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { PLANS, hasBundleBiz2025, hasVisionary } from '@proton/payments';
import { isOrganization, isOrganizationB2B } from '@proton/shared/lib/organization/helper';
import { canPay, isDelinquent, isFree, isMember, isPaid } from '@proton/shared/lib/user/helpers';

import { LUMO_USER_TYPE } from '../types';
import { useIsGuest } from './IsGuestProvider';

const getUserType = (isGuest: boolean, hasLumoSeat: boolean, isVisionary: boolean): LUMO_USER_TYPE => {
    if (isGuest) {
        return LUMO_USER_TYPE.GUEST;
    }
    return hasLumoSeat || isVisionary ? LUMO_USER_TYPE.PAID : LUMO_USER_TYPE.FREE;
};

export interface LumoPlanData {
    // Basic user classification (from LumoCommonProvider)
    lumoUserType: LUMO_USER_TYPE;
    isGuest: boolean;
    isLumoFree: boolean;
    isLumoPaid: boolean;

    // Subscription details
    hasLumoSeat: boolean;
    isVisionary: boolean;
    hasLumoPlus: boolean;
    hasOrganization: boolean;

    // Upsell eligibility
    canShowLumoUpsellFree: boolean;
    canShowLumoUpsellB2C: boolean;
    canShowLumoUpsellB2B: boolean;
    canShowTalkToAdminLumoUpsell: boolean;

    // Management capabilities
    hasLumoAndCanManageSubscription: boolean;

    // Loading state
    isLumoPlanLoading: boolean;

    // B2B
    hasLumoB2B: boolean;
    userIsMember: boolean;
    showForBusinessLink: boolean;
}

const LumoPlanContext = createContext<LumoPlanData | null>(null);

// Guest-only provider - no API calls, just default values
const GuestLumoPlanProvider = ({ children }: { children: ReactNode }) => {
    const guestDefaults: LumoPlanData = {
        // Basic user classification
        lumoUserType: LUMO_USER_TYPE.GUEST,
        isGuest: true,
        isLumoFree: false,
        isLumoPaid: false,

        // Subscription details
        hasLumoSeat: false,
        isVisionary: false,
        hasLumoPlus: false,
        hasOrganization: false,

        // Upsell eligibility
        canShowLumoUpsellFree: false,
        canShowLumoUpsellB2C: false,
        canShowLumoUpsellB2B: false,
        canShowTalkToAdminLumoUpsell: false,

        // Management capabilities
        hasLumoAndCanManageSubscription: false,

        // Loading state
        isLumoPlanLoading: false,
        hasLumoB2B: false,
        userIsMember: false,
        showForBusinessLink: true, //always show for guest users
    };

    return <LumoPlanContext.Provider value={guestDefaults}>{children}</LumoPlanContext.Provider>;
};

const AuthenticatedLumoPlanProvider = ({ children }: { children: ReactNode }) => {
    const [user, isUserLoading] = useUser();
    const [subscription, isSubscriptionLoading] = useSubscription();
    const [organization, isOrganizationLoading] = useOrganization();
    const [, isMemberLoading] = useMember();

    const isLoading = isUserLoading || isSubscriptionLoading || isOrganizationLoading || isMemberLoading;

    // In authenticated context, user and subscription should be loaded
    // but we need to handle loading states gracefully
    if (isLoading || !user || !subscription) {
        const loadingDefaults: LumoPlanData = {
            // Basic user classification
            lumoUserType: LUMO_USER_TYPE.FREE, // Default assumption
            isGuest: false,
            isLumoFree: true,
            isLumoPaid: false,

            // Subscription details - return early values when possible
            hasLumoSeat: user?.NumLumo ? user.NumLumo > 0 : false,
            isVisionary: false,
            hasLumoPlus: user?.NumLumo ? user.NumLumo > 0 : false,
            hasOrganization: false,

            // Upsell eligibility
            canShowLumoUpsellFree: false,
            canShowLumoUpsellB2C: false,
            canShowLumoUpsellB2B: false,
            canShowTalkToAdminLumoUpsell: false,

            // Management capabilities
            hasLumoAndCanManageSubscription: false,

            // Loading state
            isLumoPlanLoading: true,
            hasLumoB2B: false,
            userIsMember: false,
            showForBusinessLink: false,
        };
        return <LumoPlanContext.Provider value={loadingDefaults}>{children}</LumoPlanContext.Provider>;
    }

    // Calculate subscription details
    const hasLumoSeat = user.NumLumo > 0;
    const isVisionary = hasVisionary(subscription);
    const hasLumoPlus = hasLumoSeat || isVisionary; //could be redundant since only admins of visionary plans get subcription response
    const hasOrganization = organization ? isOrganization(organization) : false;
    // const userCanPay = canPay(user) && !isDelinquent(user) && !isManagedExternally(subscription);
    const userCanPay = canPay(user) && !isDelinquent(user);

    const isOrgB2B = organization ? isOrganizationB2B(organization) : false;

    // used to show Lumo for Business logos and messages
    const hasLumoB2B = isOrgB2B && hasLumoSeat;

    const lumoUserType = getUserType(false, hasLumoSeat, isVisionary);

    // Calculate upsell eligibility
    const showLumoUpsellFree = !hasLumoPlus && isFree(user) && userCanPay;

    const showLumoUpsellB2C = !hasLumoPlus && !hasOrganization && isPaid(user) && userCanPay;
    // bundlebiz2025 has all the lumo plus features included, so we don't need to show the upsell
    const showLumoUpsellB2B = !hasLumoPlus && hasOrganization && userCanPay && !hasBundleBiz2025(subscription);
    const showTalkToAdminLumoUpsell = hasOrganization && isMember(user);
    const hasLumoAndCanManageSubscription = hasLumoPlus && canPay(user);
    const userIsMember = isMember(user);

    // Show "For Business" link unless user has a business organization plan with lumo seat included
    const hasB2BPlanWithLumoSeatIncluded =
        organization?.PlanName === PLANS.LUMO_BUSINESS || organization?.PlanName === PLANS.BUNDLE_BIZ_2025;
    const showForBusinessLink = !hasB2BPlanWithLumoSeatIncluded;

    const value: LumoPlanData = {
        // Basic user classification
        lumoUserType,
        isGuest: false,
        isLumoFree: lumoUserType === LUMO_USER_TYPE.FREE,
        isLumoPaid: lumoUserType === LUMO_USER_TYPE.PAID,

        // Subscription details
        hasLumoSeat,
        isVisionary,
        hasLumoPlus,
        hasOrganization,

        // Upsell eligibility
        canShowLumoUpsellFree: showLumoUpsellFree,
        canShowLumoUpsellB2C: showLumoUpsellB2C,
        canShowLumoUpsellB2B: showLumoUpsellB2B,
        canShowTalkToAdminLumoUpsell: showTalkToAdminLumoUpsell,

        // Management capabilities
        hasLumoAndCanManageSubscription,

        // Loading state
        isLumoPlanLoading: isLoading,

        //B2B
        hasLumoB2B,
        userIsMember,
        showForBusinessLink,
    };

    return <LumoPlanContext.Provider value={value}>{children}</LumoPlanContext.Provider>;
};

// Main provider that decides which sub-provider to use
export const LumoPlanProvider = ({ children }: { children: ReactNode }) => {
    const isGuest = useIsGuest();

    if (isGuest) {
        return <GuestLumoPlanProvider>{children}</GuestLumoPlanProvider>;
    }

    return <AuthenticatedLumoPlanProvider>{children}</AuthenticatedLumoPlanProvider>;
};

export const useLumoPlan = (): LumoPlanData => {
    const context = useContext(LumoPlanContext);
    if (!context) {
        throw new Error('useLumoPlan must be used within a LumoPlanProvider');
    }
    return context;
};

// Convenience hooks for specific use cases
export const useLumoUserType = () => {
    const { lumoUserType, isGuest, isLumoFree, isLumoPaid } = useLumoPlan();
    return { lumoUserType, isGuest, isLumoFree, isLumoPaid };
};

export const useLumoSubscription = () => {
    const { hasLumoSeat, isVisionary, hasLumoPlus, hasOrganization } = useLumoPlan();
    return { hasLumoSeat, isVisionary, hasLumoPlus, hasOrganization };
};

export const useLumoUpsells = () => {
    const { canShowLumoUpsellFree, canShowLumoUpsellB2C, canShowLumoUpsellB2B, canShowTalkToAdminLumoUpsell } =
        useLumoPlan();
    return {
        canShowLumoUpsellFree,
        canShowLumoUpsellB2C,
        canShowLumoUpsellB2B,
        canShowTalkToAdminLumoUpsell,
    };
};
