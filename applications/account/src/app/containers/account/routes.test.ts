import type { Subscription } from '@proton/payments';
import { Renew, hasCancellablePlan, isCancellableOnlyViaSupport } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { buildUser } from '@proton/testing/builders/user';

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

function buildDefaultParams(overrides?: Record<string, any>) {
    return {
        app: APPS.PROTONMAIL,
        user: buildUser(),
        subscription: { Renew: Renew.Enabled } as Subscription,
        isDataRecoveryAvailable: false,
        isRecoveryContactsEnabled: false,
        isSessionRecoveryAvailable: false,
        isReferralProgramEnabled: false,
        recoveryNotification: undefined,
        organization: undefined,
        showVPNDashboard: false,
        showVPNDashboardVariant: 'disabled' as const,
        showThemeSelection: false,
        assistantKillSwitch: false,
        memberships: undefined,
        isZoomIntegrationEnabled: false,
        isProtonMeetIntegrationEnabled: false,
        isB2BTrial: false,
        referralInfo: { refereeRewardAmount: '0', referrerRewardAmount: '0', maxRewardAmount: '0' },
        canDisplayNonPrivateEmailPhone: false,
        showMailDashboard: true,
        showMailDashboardVariant: 'disabled' as const,
        showPassDashboard: false,
        showPassDashboardVariant: 'disabled' as const,
        showDriveDashboard: false,
        showDriveDashboardVariant: 'disabled' as const,
        showMeetDashboard: false,
        showMeetDashboardVariant: 'disabled' as const,
        hasPendingInvitations: false,
        isOLESEnabled: false,
        ...overrides,
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
