import { getOrgPermissions } from '@proton/account/userPermissions';
import { PLANS } from '@proton/payments/core/constants';
import { createEntitlementResolverForOrgAndUser } from '@proton/payments/core/entitlements/resolver';
import { isCancellableOnlyViaSupport } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { regularAdmin } from '@proton/payments/testing/regularAdmin';
import { APPS } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';
import { buildUser } from '@proton/shared/testing/buildUser';

import type { AccountRecoveryRouterFlags, AccountRouterParams, Flags } from '../../router-params';
import { defaultFlags } from '../../testing/buildOrganizationRouterParams';
import { getAccountAppRoutes } from './routes';

vi.mock('@proton/payments/core/subscription/helpers', async () => ({
    ...(await vi.importActual('@proton/payments/core/subscription/helpers')),
    isCancellableOnlyViaSupport: vi.fn(),
    getHasVpnB2BPlan: vi.fn().mockReturnValue(false),
    isManagedExternally: vi.fn().mockReturnValue(false),
}));

const mockedIsCancellableOnlyViaSupport = vi.mocked(isCancellableOnlyViaSupport);

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

type Overrides = Omit<Partial<AccountRouterParams>, 'flags'> & { flags?: Partial<Flags> };

function buildDefaultParams({ flags: flagOverrides, ...rest }: Overrides = {}): AccountRouterParams {
    return {
        app: APPS.PROTONMAIL,
        user: buildUser(),
        subscription: { Renew: Renew.Enabled } as Subscription,
        allSubscriptions: [],
        entitlements: createEntitlementResolverForOrgAndUser({
            entitlementCatalog: buildEntitlementCatalog(),
            entitlements: undefined,
            subscriptions: [],
            ...regularAdmin,
        }),
        recoveryNotification: undefined,
        accountRecoveryRouterFlags,
        organization: undefined,
        showVPNDashboard: false,
        showVPNDashboardVariant: 'disabled',
        showThemeSelection: false,
        assistantKillSwitch: false,
        memberships: undefined,
        isGroupOwner: null,
        isOrganizationOwner: false,
        referralInfo: { refereeRewardAmount: '0', referrerRewardAmount: '0', maxRewardAmount: '0' },
        showDashboard: true,
        showDriveDashboard: false,
        showDriveDashboardVariant: 'disabled',
        showGenericDashboard: false,
        hasPendingInvitations: false,
        isPasswordReminderAvailable: true,
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

function getTwoFaSubsection(result: ReturnType<typeof getAccountAppRoutes>) {
    return result.routes.password.subsections.find((subsection) => subsection.id === 'two-fa');
}

describe('getAccountAppRoutes', () => {
    describe('cancel-subscription subsection available property', () => {
        const renewing = { ID: 'sub-mail', Renew: Renew.Enabled } as Subscription;
        const buildParams = (overrides: Overrides = {}) =>
            buildDefaultParams({ allSubscriptions: [renewing], ...overrides });

        beforeEach(() => {
            mockedIsCancellableOnlyViaSupport.mockReturnValue(false);
        });

        it('should be available when all conditions are met', () => {
            const result = getAccountAppRoutes(buildParams());
            expect(getCancelSubscriptionSubsection(result)?.available).toBe(true);
        });

        it('is available while one subscription renews, whatever useSubscription returns', () => {
            const result = getAccountAppRoutes(
                buildParams({
                    subscription: { ID: 'sub-lumo', Renew: Renew.Disabled } as Subscription,
                    allSubscriptions: [
                        { ID: 'sub-mail', Renew: Renew.Enabled },
                        { ID: 'sub-lumo', Renew: Renew.Disabled },
                    ] as Subscription[],
                })
            );
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
                description: 'subscription renewal is disabled',
                overrides: { allSubscriptions: [{ ...renewing, Renew: Renew.Disabled }] },
                mockSetup: {},
            },
            {
                description: 'upcoming subscription renewal is disabled',
                overrides: {
                    allSubscriptions: [
                        { ...renewing, UpcomingSubscription: { Renew: Renew.Disabled } } as Subscription,
                    ],
                },
                mockSetup: {},
            },
            {
                description: 'subscription is only cancellable via support',
                overrides: {},
                mockSetup: { isCancellableOnlyViaSupport: true },
            },
            {
                description: 'there is no subscription',
                overrides: { allSubscriptions: [] },
                mockSetup: {},
            },
        ])('should not be available when $description', ({ overrides, mockSetup }) => {
            if ('isCancellableOnlyViaSupport' in mockSetup) {
                mockedIsCancellableOnlyViaSupport.mockReturnValue(mockSetup.isCancellableOnlyViaSupport as boolean);
            }

            const result = getAccountAppRoutes(buildParams(overrides));
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

        it('is not available for a member of a free organization without any permission', () => {
            const permissions = getOrgPermissions([], false);
            expect(getDashboardAvailability({ user: freeOrgMember, permissions })).toBe(false);
            expect(getDashboardAvailability({ user: freeOrgMember, permissions, showDashboard: false })).toBe(false);
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

    describe('two-factor authentication subsection for SSO users', () => {
        const globalSsoUser = buildUser({
            Flags: { ...buildUser().Flags, sso: true },
            Keys: buildUser().Keys,
        });
        const vpnOnlySsoUser = buildUser({
            Flags: { ...buildUser().Flags, sso: true },
            Keys: [],
        });

        it('is hidden for global SSO users in Lumo account settings', () => {
            const result = getAccountAppRoutes(
                buildDefaultParams({
                    app: APPS.PROTONLUMO,
                    user: globalSsoUser,
                })
            );

            expect(result.routes.password.available).toBe(true);
            expect(getTwoFaSubsection(result)?.available).toBe(false);
        });

        it('is hidden for VPN-only SSO users', () => {
            const result = getAccountAppRoutes(
                buildDefaultParams({
                    app: APPS.PROTONLUMO,
                    user: vpnOnlySsoUser,
                })
            );

            expect(result.routes.password.available).toBe(false);
            expect(getTwoFaSubsection(result)?.available).toBe(false);
        });
    });

    describe('YourPlanV2 subsection in the VPN dashboard', () => {
        function getYourPlanAvailability(overrides: Overrides) {
            return getAccountAppRoutes(
                buildDefaultParams({
                    app: APPS.PROTONVPN_SETTINGS,
                    showVPNDashboard: true,
                    showVPNDashboardVariant: 'B',
                    ...overrides,
                })
            ).routes.vpnDashboardV2.subsections.find((subsection) => subsection.id === 'YourPlanV2')?.available;
        }

        it('is hidden in variant B for a free user', () => {
            expect(getYourPlanAvailability({ user: buildUser({ isFree: true, isPaid: false }) })).toBe(false);
        });

        it('is shown in variant B for a user on the Lumo plan', () => {
            const lumoSubscription = buildSubscription(PLANS.LUMO);
            expect(
                getYourPlanAvailability({
                    user: buildUser({ isFree: false, isPaid: true }),
                    subscription: lumoSubscription,
                    allSubscriptions: [lumoSubscription],
                })
            ).toBe(true);
        });

        it('is shown in variant A for a free user', () => {
            expect(
                getYourPlanAvailability({
                    user: buildUser({ isFree: true, isPaid: false }),
                    showVPNDashboardVariant: 'A',
                })
            ).toBe(true);
        });
    });

    describe('notifications section', () => {
        // The settings used to live on the dashboard and subscription pages, in a subsection hidden from members,
        // so the page keeps exactly that audience
        const orgAdmin = buildUser({ isAdmin: true, isMember: false, canPay: true, isFree: false, isPaid: true });
        const getAvailability = (overrides: Overrides) => {
            const { routes } = getAccountAppRoutes(buildDefaultParams(overrides));
            return { dashboard: routes.dashboard.available, notifications: routes.notifications.available };
        };

        it('is available to a user outside an organization', () => {
            const user = buildUser({ isAdmin: false, isMember: false, canPay: true, isFree: true, isPaid: false });

            expect(getAvailability({ user })).toEqual({ dashboard: true, notifications: true });
        });

        it('is available to an admin with the dashboard permission', () => {
            const permissions = getOrgPermissions(['account.dashboard.read'], false);

            expect(getAvailability({ user: orgAdmin, permissions })).toEqual({ dashboard: true, notifications: true });
        });

        it('is not available to an admin without the dashboard permission', () => {
            const permissions = getOrgPermissions(['account.user.read'], false);

            expect(getAvailability({ user: orgAdmin, permissions })).toEqual({
                dashboard: false,
                notifications: false,
            });
        });

        it('is not available in an MSP subsidiary organization', () => {
            const permissions = getOrgPermissions(['account.dashboard.read'], false);
            const organization = { IsSubsidiary: true } as unknown as OrganizationExtended;

            expect(getAvailability({ user: orgAdmin, permissions, organization })).toEqual({
                dashboard: false,
                notifications: false,
            });
        });

        it('is not available to a member, even one who can see the dashboard', () => {
            const user = buildUser({ isAdmin: false, isMember: true, canPay: false, isFree: false, isPaid: true });
            const permissions = getOrgPermissions(['account.dashboard.read'], false);

            expect(getAvailability({ user, permissions })).toEqual({ dashboard: true, notifications: false });
        });

        it('has one card subsection per category, in the order the router renders them', () => {
            const result = getAccountAppRoutes(buildDefaultParams());

            expect(result.routes.notifications.subsections.map(({ id }) => id)).toEqual([
                'email-subscriptions',
                'product-updates',
                'account-updates',
                'application-notifications',
            ]);
        });

        it('makes every visible toggle searchable', () => {
            const result = getAccountAppRoutes(buildDefaultParams());
            const keywords = result.routes.notifications.subsections.flatMap((subsection) => subsection.keywords);

            expect(keywords).toEqual(
                expect.arrayContaining(['In-app notifications', 'Recovery checklist', 'Password check-ins'])
            );
            expect(keywords).not.toContain('Daily email notifications');
        });

        it('only makes password check-ins searchable when they are available', () => {
            const getPasswordReminderKeywords = (isPasswordReminderAvailable: boolean) => {
                const { routes } = getAccountAppRoutes(buildDefaultParams({ isPasswordReminderAvailable }));
                return [...routes.notifications.subsections, ...routes.password.subsections]
                    .flatMap((subsection) => subsection.keywords ?? [])
                    .filter((keyword) => keyword === 'Password check-ins');
            };

            expect(getPasswordReminderKeywords(true)).toHaveLength(2);
            expect(getPasswordReminderKeywords(false)).toHaveLength(0);
        });
    });

    describe('easy switch section', () => {
        const defaultEntitlements = buildDefaultParams().entitlements;
        const getAvailability = (overrides: Overrides) =>
            getAccountAppRoutes(buildDefaultParams(overrides)).routes.easySwitch.available;

        it('is hidden in Drive for a B2B user when the Drive import UI is on', () => {
            expect(
                getAvailability({
                    app: APPS.PROTONDRIVE,
                    entitlements: { ...defaultEntitlements, isB2B: true },
                    flags: { isDriveEasySwitchNewUIEnabled: true },
                })
            ).toBe(false);
        });

        it('is shown in Drive for a non B2B user when the Drive import UI is on', () => {
            expect(
                getAvailability({
                    app: APPS.PROTONDRIVE,
                    entitlements: { ...defaultEntitlements, isB2B: false },
                    flags: { isDriveEasySwitchNewUIEnabled: true },
                })
            ).toBe(true);
        });

        it('is shown in Mail for a B2B user', () => {
            expect(
                getAvailability({
                    app: APPS.PROTONMAIL,
                    entitlements: { ...defaultEntitlements, isB2B: true },
                    flags: { isDriveEasySwitchNewUIEnabled: true },
                })
            ).toBe(true);
        });
    });
});
