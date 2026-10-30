import { buildOrganizationRouterParams } from 'proton-account/src/app/content/testing/buildOrganizationRouterParams';

import { PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { buildUser } from '@proton/shared/testing/buildUser';
import type { VPNDashboardVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

import { getRoutes } from './routes';

const paidUser = buildUser({ isFree: false, isPaid: true, canPay: true });
const freeUser = buildUser({ isFree: true, isPaid: false, canPay: true });

const getYourPlanAvailability = ({
    user = paidUser,
    subscription,
    showVPNDashboardVariant = 'B',
}: {
    user?: UserModel;
    subscription?: Subscription;
    showVPNDashboardVariant?: VPNDashboardVariant;
}) => {
    const { organization, isGroupOwner, isOrganizationOwner, memberships, groups, permissions, flags } =
        buildOrganizationRouterParams();

    const routes = getRoutes({
        user,
        addresses: [],
        subscription,
        showVPNDashboard: true,
        showVPNDashboardVariant,
        referralInfo: { refereeRewardAmount: '0', referrerRewardAmount: '0', maxRewardAmount: '0' },
        organizationSettingsRouterParams: {
            organization,
            isGroupOwner,
            isOrganizationOwner,
            memberships,
            groups,
            permissions,
        },
        flags,
        accountRecoveryRouterFlags: {
            isAccountRecoveryAvailable: false,
            isMnemonicAvailable: false,
            isRecoveryFileAvailable: false,
            isDataRecoveryAvailable: false,
            isSessionRecoveryAvailable: false,
            isDelegatedAccessAvailable: false,
            isNonPrivateDelegatedAccessAvailable: false,
            isRecoveryScoreBannerAvailable: false,
        },
    });

    return routes.dashboardV2.subsections.find((subsection) => subsection.id === 'YourPlanV2')?.available;
};

describe('YourPlanV2 subsection in the VPN dashboard', () => {
    it('is hidden in variant B for a free user', () => {
        expect(getYourPlanAvailability({ user: freeUser })).toBe(false);
    });

    it('is shown in variant B for a user on the Lumo plan', () => {
        expect(getYourPlanAvailability({ subscription: buildSubscription(PLANS.LUMO) })).toBe(true);
    });

    it('is shown in variant B for a VPN Plus subscription', () => {
        expect(getYourPlanAvailability({ subscription: buildSubscription(PLANS.VPN2024) })).toBe(true);
    });

    it('is shown in variant A for a free user', () => {
        expect(getYourPlanAvailability({ user: freeUser, showVPNDashboardVariant: 'A' })).toBe(true);
    });
});
