import { getOrgPermissions } from '@proton/account/userPermissions';
import { createEntitlementResolver } from '@proton/payments/core/entitlements/resolver';
import { Renew } from '@proton/payments/core/subscription/constants';
import { hasCancellablePlan, isCancellableOnlyViaSupport } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';
import { buildUser } from '@proton/testing/builders/user';

import type { AccountRecoveryRouterFlags, AccountRouterParams, Flags } from '../../content/router-params';
import { getAccountAppRoutes } from './routes';

jest.mock('@proton/payments/core/subscription/helpers', () => ({
    ...jest.requireActual('@proton/payments/core/subscription/helpers'),
    hasCancellablePlan: jest.fn(),
    isCancellableOnlyViaSupport: jest.fn(),
    getHasExternalMemberCapableB2BPlan: jest.fn().mockReturnValue(false),
    getHasVpnB2BPlan: jest.fn().mockReturnValue(false),
    isManagedExternally: jest.fn().mockReturnValue(false),
    hasLumo: jest.fn().mockReturnValue(false),
}));

const mockedHasCancellablePlan = jest.mocked(hasCancellablePlan);
const mockedIsCancellableOnlyViaSupport = jest.mocked(isCancellableOnlyViaSupport);

const accountRecoveryRouterFlags: AccountRecoveryRouterFlags = {
    isAccountRecoveryAvailable: false,
    isMnemonicAvailable: false,
    isRecoveryFileAvailable: false,
    isDataRecoveryAvailable: false,
    isSessionRecoveryAvailable: false,
    isDelegatedAccessAvailable: false,
    isNonPrivateDelegatedAccessAvailable: false,
    isRecoveryScoreBannerAvailable: false,
};

const defaultFlags: Flags = {
    isAlwaysOnVpnEnabled: false,
    isMspEnabled: false,
    isReferralProgramEnabled: false,
    canDisplayNonPrivateEmailPhone: false,
    isUserGroupsFeatureEnabled: false,
    isUserGroupsNoCustomDomainEnabled: false,
    isScribeEnabled: false,
    isZoomIntegrationEnabled: false,
    isProtonMeetIntegrationEnabled: false,
    isSharedServerFeatureEnabled: false,
    isCryptoPostQuantumOptInEnabled: false,
    isSsoForPbsEnabled: false,
    isRetentionPoliciesEnabled: false,
    isPasswordRemindersOrgEnabled: false,
    isAuthenticatorAvailable: false,
    isCategoryViewEnabled: false,
};

type Overrides = Omit<Partial<AccountRouterParams>, 'flags'> & { flags?: Partial<Flags> };

function buildDefaultParams({ flags: flagOverrides, ...rest }: Overrides = {}): AccountRouterParams {
    return {
        app: APPS.PROTONMAIL,
        user: buildUser(),
        subscription: { Renew: Renew.Enabled } as Subscription,
        entitlements: createEntitlementResolver(undefined),
        recoveryNotification: undefined,
        accountRecoveryRouterFlags,
        organization: undefined,
        showVPNDashboard: false,
        showVPNDashboardVariant: 'disabled',
        showThemeSelection: false,
        assistantKillSwitch: false,
        memberships: undefined,
        isB2BDrive: false,
        isGroupOwner: null,
        referralInfo: { refereeRewardAmount: '0', referrerRewardAmount: '0', maxRewardAmount: '0' },
        showDashboard: true,
        showDriveDashboard: false,
        showDriveDashboardVariant: 'disabled',
        showGenericDashboard: false,
        hasPendingInvitations: false,
        permissions: getOrgPermissions([], true),
        flags: { ...defaultFlags, ...flagOverrides },
        groups: undefined,
        ...rest,
    };
}

function getCancelSubscriptionSubsection(result: ReturnType<typeof getAccountAppRoutes>) {
    return result.routes.subscription.subsections.find((s) => s.id === 'cancel-subscription');
}

function getDashboardAvailability(overrides: Overrides) {
    return getAccountAppRoutes(buildDefaultParams(overrides)).routes.dashboard.available;
}

describe('getAccountAppRoutes', () => {
    describe('cancel-subscription subsection available property', () => {
        beforeEach(() => {
            mockedHasCancellablePlan.mockReturnValue(true);
            mockedIsCancellableOnlyViaSupport.mockReturnValue(false);
        });

        it('should be available when all conditions are met', () => {
            const result = getAccountAppRoutes(buildDefaultParams());
            expect(getCancelSubscriptionSubsection(result)?.available).toBe(true);
        });

        it.each([
            {
                description: 'user is not paid',
                overrides: { user: buildUser({ isPaid: false, isFree: true }) },
                mockSetup: {},
            },
            {
                description: 'user cannot pay',
                overrides: { user: buildUser({ canPay: false }) },
                mockSetup: {},
            },
            {
                description: 'plan is not cancellable',
                overrides: {},
                mockSetup: { hasCancellablePlan: false },
            },
            {
                description: 'subscription renewal is disabled',
                overrides: { subscription: { Renew: Renew.Disabled } as Subscription },
                mockSetup: {},
            },
            {
                description: 'upcoming subscription renewal is disabled',
                overrides: {
                    subscription: {
                        Renew: Renew.Enabled,
                        UpcomingSubscription: { Renew: Renew.Disabled },
                    } as Subscription,
                },
                mockSetup: {},
            },
            {
                description: 'subscription is only cancellable via support',
                overrides: {},
                mockSetup: { isCancellableOnlyViaSupport: true },
            },
            {
                description: 'subscription is undefined',
                overrides: { subscription: undefined },
                mockSetup: {},
            },
        ])('should not be available when $description', ({ overrides, mockSetup }) => {
            if ('hasCancellablePlan' in mockSetup) {
                mockedHasCancellablePlan.mockReturnValue(mockSetup.hasCancellablePlan as boolean);
            }
            if ('isCancellableOnlyViaSupport' in mockSetup) {
                mockedIsCancellableOnlyViaSupport.mockReturnValue(mockSetup.isCancellableOnlyViaSupport as boolean);
            }

            const result = getAccountAppRoutes(buildDefaultParams(overrides));
            expect(getCancelSubscriptionSubsection(result)?.available).toBeFalsy();
        });
    });

    describe('dashboard available property', () => {
        const orgAdmin = buildUser({ isAdmin: true, isMember: false, canPay: true, isFree: false, isPaid: true });
        const subscribedOrgMember = buildUser({
            isAdmin: false,
            isMember: true,
            canPay: false,
            isFree: false,
            isPaid: true,
        });
        const freeOrgMember = buildUser({
            isAdmin: false,
            isMember: true,
            canPay: false,
            isFree: true,
            isPaid: false,
        });
        const individual = buildUser({ isAdmin: false, isMember: false, canPay: true, isFree: true, isPaid: false });

        it('is available for an admin with the dashboard permission', () => {
            const permissions = getOrgPermissions(['account.dashboard.read'], false);
            expect(getDashboardAvailability({ user: orgAdmin, permissions })).toBe(true);
        });

        it('is not available for an admin without the dashboard permission', () => {
            // A real admin role without dashboard access (e.g. User Admin) still holds some other
            // permissions (member/group CRUD), unlike the transitional all-false state below.
            const permissions = getOrgPermissions(['account.user.read'], false);
            expect(getDashboardAvailability({ user: orgAdmin, permissions })).toBe(false);
            expect(getDashboardAvailability({ user: orgAdmin, permissions, showDashboard: false })).toBe(false);
        });

        it('is available for an admin in the transitional state right after a free-to-paid upgrade', () => {
            // Right after upgrading, isAdmin flips to true before the org permissions have been
            // refetched, so every permission is still false. We treat that as eligible by default.
            const permissions = getOrgPermissions([], false);
            expect(getDashboardAvailability({ user: orgAdmin, permissions })).toBe(true);
            expect(getDashboardAvailability({ user: orgAdmin, permissions, showDashboard: false })).toBe(true);
        });

        it('is available for a member of a free organization without any permission', () => {
            const permissions = getOrgPermissions([], false);
            expect(getDashboardAvailability({ user: freeOrgMember, permissions })).toBe(true);
            expect(getDashboardAvailability({ user: freeOrgMember, permissions, showDashboard: false })).toBe(true);
        });

        it('is available for a user outside an organization without any permission', () => {
            const permissions = getOrgPermissions([], false);
            expect(getDashboardAvailability({ user: individual, permissions })).toBe(true);
        });

        it('is available for a member of a subscribed organization with the dashboard permission', () => {
            const permissions = getOrgPermissions(['account.dashboard.read'], false);
            expect(getDashboardAvailability({ user: subscribedOrgMember, permissions })).toBe(true);
        });

        it('is not available for a member of a subscribed organization without the dashboard permission', () => {
            const permissions = getOrgPermissions([], false);
            expect(getDashboardAvailability({ user: subscribedOrgMember, permissions })).toBe(false);
        });
    });
});
