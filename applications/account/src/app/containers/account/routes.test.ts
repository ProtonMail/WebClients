import type { Subscription } from '@proton/payments';
import { Renew, hasCancellablePlan, isCancellableOnlyViaSupport } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { PERMISSIONS } from '@proton/shared/lib/interfaces/UserPermission';
import { buildUser } from '@proton/testing/builders/user';

import type { AccountRouterParams, Flags } from '../../content/router-params';
import { getAccountAppRoutes } from './routes';

jest.mock('@proton/payments', () => ({
    ...jest.requireActual('@proton/payments'),
    hasCancellablePlan: jest.fn(),
    isCancellableOnlyViaSupport: jest.fn(),
    getHasExternalMemberCapableB2BPlan: jest.fn().mockReturnValue(false),
    getHasVpnB2BPlan: jest.fn().mockReturnValue(false),
    isManagedExternally: jest.fn().mockReturnValue(false),
    hasLumo: jest.fn().mockReturnValue(false),
    getIsConsumerPassPlan: jest.fn().mockReturnValue(false),
}));

const mockedHasCancellablePlan = jest.mocked(hasCancellablePlan);
const mockedIsCancellableOnlyViaSupport = jest.mocked(isCancellableOnlyViaSupport);

const defaultFlags: Flags = {
    canDisplayB2BLogsPass: false,
    canDisplayB2BLogsVPN: false,
    canDisplayPassReports: false,
    canB2BHidePhotos: false,
    canDisplayNonPrivateEmailPhone: false,
    isUserGroupsFeatureEnabled: false,
    isUserGroupsNoCustomDomainEnabled: false,
    isUserGroupsPassBusinessEnabled: false,
    isScribeEnabled: false,
    isZoomIntegrationEnabled: false,
    isProtonMeetIntegrationEnabled: false,
    isSharedServerFeatureEnabled: false,
    isCryptoPostQuantumOptInEnabled: false,
    isSsoForPbsEnabled: false,
    isRetentionPoliciesEnabled: false,
    isAuthenticatorAvailable: false,
    isOLESEnabled: false,
    isCategoryViewEnabled: false,
    isRecoveryContactsEnabled: false,
    isRolesAndPermissionsEnabled: false,
    isRecoverySettingsRedesignEnabled: false,
};

type Overrides = Omit<Partial<AccountRouterParams>, 'flags'> & { flags?: Partial<Flags> };

function buildDefaultParams({ flags: flagOverrides, ...rest }: Overrides = {}): AccountRouterParams {
    return {
        app: APPS.PROTONMAIL,
        user: buildUser(),
        subscription: { Renew: Renew.Enabled } as Subscription,
        isDataRecoveryAvailable: false,
        isSessionRecoveryAvailable: false,
        isReferralProgramEnabled: false,
        recoveryNotification: undefined,
        organization: undefined,
        showVPNDashboard: false,
        showVPNDashboardVariant: 'disabled',
        showThemeSelection: false,
        assistantKillSwitch: false,
        memberships: undefined,
        isB2BTrial: false,
        isB2BDrive: false,
        isGroupOwner: null,
        referralInfo: { refereeRewardAmount: '0', referrerRewardAmount: '0', maxRewardAmount: '0' },
        showMailDashboard: true,
        showMailDashboardVariant: 'disabled',
        showPassDashboard: false,
        showPassDashboardVariant: 'disabled',
        showDriveDashboard: false,
        showDriveDashboardVariant: 'disabled',
        showMeetDashboard: false,
        showMeetDashboardVariant: 'disabled',
        hasPendingInvitations: false,
        permissions: Object.fromEntries(PERMISSIONS.map((p) => [p, false])) as Record<
            (typeof PERMISSIONS)[number],
            boolean
        >,
        flags: { ...defaultFlags, ...flagOverrides },
        ...rest,
    };
}

function getCancelSubscriptionSubsection(result: ReturnType<typeof getAccountAppRoutes>) {
    return result.routes.subscription.subsections.find((s) => s.id === 'cancel-subscription');
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
});
