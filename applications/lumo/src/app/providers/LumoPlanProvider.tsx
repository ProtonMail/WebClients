import type { ReactNode} from 'react';
import React, { createContext, useContext } from 'react';

import { useMember } from '@proton/account/member/hook';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { hasVisionary, isManagedExternally } from '@proton/payments';
import { hasLumoAddon } from '@proton/payments';
import { isOrganization, isSuperAdmin } from '@proton/shared/lib/organization/helper';

import { useIsGuest } from './IsGuestProvider';

// TODO: refactor guest vs authenticated components using useLumoPlan hook to use provider instead
export interface LumoPlanData {
    hasLumoSeat: boolean;
    hasLumoPlusAddon: boolean;
    isVisionary: boolean;
    canShowUpsell: boolean;
    canShowLumoUpsellFree: boolean;
    canShowLumoUpsellB2BOrB2C: boolean;
    isOrgOrMultiUser: boolean;
    isOrgOrMultiAdmin: boolean;
    isLumoPlanLoading: boolean;
}

const LumoPlanContext = createContext<LumoPlanData | null>(null);

// Guest-only provider - no API calls, just default values
const GuestLumoPlanProvider = ({ children }: { children: ReactNode }) => {
    const guestDefaults: LumoPlanData = {
        hasLumoSeat: false,
        hasLumoPlusAddon: false,
        isVisionary: false,
        canShowUpsell: false,
        canShowLumoUpsellFree: false,
        canShowLumoUpsellB2BOrB2C: false,
        isOrgOrMultiUser: false,
        isOrgOrMultiAdmin: false,
        isLumoPlanLoading: false,
    };

    return <LumoPlanContext.Provider value={guestDefaults}>{children}</LumoPlanContext.Provider>;
};

const AuthenticatedLumoPlanProvider = ({ children }: { children: ReactNode }) => {
    const [user, isUserLoading] = useUser();
    const [subscription, isSubscriptionLoading] = useSubscription();
    const [organization, isOrganizationLoading] = useOrganization();
    const [member, isMemberLoading] = useMember();

    const isLoading = isUserLoading || isSubscriptionLoading || isOrganizationLoading || isMemberLoading;

    // In authenticated context, user and subscription should be loaded
    // but we need to handle loading states gracefully
    if (isLoading || !user || !subscription) {
        const loadingDefaults: LumoPlanData = {
            hasLumoSeat: user?.NumLumo > 0, //return value as soon as possible to avoid logo flash
            hasLumoPlusAddon: false,
            isVisionary: false,
            canShowUpsell: false,
            canShowLumoUpsellFree: false,
            canShowLumoUpsellB2BOrB2C: false,
            isOrgOrMultiUser: false,
            isOrgOrMultiAdmin: false,
            isLumoPlanLoading: true,
        };
        return <LumoPlanContext.Provider value={loadingDefaults}>{children}</LumoPlanContext.Provider>;
    }

    const hasLumoSeat = user.NumLumo > 0;
    const hasLumoPlusAddon = hasLumoAddon(subscription);
    const isVisionary = hasVisionary(subscription);

    const canShowUpsell = !hasLumoSeat && user.canPay && !user.isDelinquent && !isManagedExternally(subscription);
    const canShowLumoUpsellFree = user.isFree && canShowUpsell;
    const canShowLumoUpsellB2BOrB2C = user.isPaid && canShowUpsell;

    const userIsSuperAdmin = member ? isSuperAdmin([member]) : false;

    const isOrgOrMultiUser = organization ? isOrganization(organization) && !userIsSuperAdmin : false;
    const isOrgOrMultiAdmin = organization ? isOrganization(organization) && userIsSuperAdmin : false;

    const value: LumoPlanData = {
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
