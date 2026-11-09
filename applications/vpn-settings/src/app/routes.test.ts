import { buildOrganizationRouterParams } from 'proton-account/src/app/private-app/testing/buildOrganizationRouterParams';

import type { SubSectionConfig } from '@proton/components/containers/layout/interface';
import { PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';
import { buildUser } from '@proton/shared/testing/buildUser';
import type { VPNDashboardVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

import { getRoutes } from './routes';

const paidUser = buildUser({ isFree: false, isPaid: true, canPay: true });
const freeUser = buildUser({ isFree: true, isPaid: false, canPay: true });

const buildRoutes = ({
    user = paidUser,
    subscription,
    allSubscriptions = [],
    showVPNDashboardVariant = 'B',
}: {
    user?: UserModel;
    subscription?: Subscription;
    allSubscriptions?: Subscription[];
    showVPNDashboardVariant?: VPNDashboardVariant;
}) => {
    const { organization, isGroupOwner, isOrganizationOwner, memberships, groups, permissions, flags } =
        buildOrganizationRouterParams();

    return getRoutes({
        user,
        addresses: [],
        subscription,
        allSubscriptions,
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
};

const getYourPlanAvailability = (options: Parameters<typeof buildRoutes>[0]) =>
    buildRoutes(options).dashboardV2.subsections.find((subsection) => subsection.id === 'YourPlanV2')?.available;

const getCancelSubscriptionAvailability = (options: Parameters<typeof buildRoutes>[0]) => {
    const routes = buildRoutes(options);
    const findCancelSubscription = (subsections: SubSectionConfig[]) =>
        subsections.find((subsection) => subsection.id === 'cancel-subscription')?.available;

    return {
        subscriptionPage: findCancelSubscription(routes.subscription.subsections),
        dashboard: findCancelSubscription(routes.dashboard.subsections),
    };
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

describe('cancel-subscription subsection', () => {
    const vpn: Subscription = { ...buildSubscription(PLANS.VPN2024), ID: 'sub-vpn' };
    const pass: Subscription = { ...buildSubscription(PLANS.PASS), ID: 'sub-pass' };

    it('is available on both pages with several cancellable web subscriptions', () => {
        expect(
            getCancelSubscriptionAvailability({
                subscription: { ...vpn, Renew: Renew.Disabled },
                allSubscriptions: [vpn, pass],
            })
        ).toEqual({ subscriptionPage: true, dashboard: true });
    });

    it('is not available when no subscription renews', () => {
        const notRenewing = { ...vpn, Renew: Renew.Disabled };

        expect(
            getCancelSubscriptionAvailability({ subscription: notRenewing, allSubscriptions: [notRenewing] })
        ).toEqual({ subscriptionPage: false, dashboard: false });
    });

    it('is not available for a free user', () => {
        expect(getCancelSubscriptionAvailability({ user: freeUser, allSubscriptions: [vpn, pass] })).toEqual({
            subscriptionPage: false,
            dashboard: false,
        });
    });
});
