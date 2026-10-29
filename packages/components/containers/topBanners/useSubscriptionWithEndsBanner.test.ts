import { renderHook } from '@testing-library/react-hooks';

import { PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { APPS } from '@proton/shared/lib/constants';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';

import { useSubscriptionWithEndsBanner } from './useSubscriptionWithEndsBanner';

jest.mock('@proton/app-context/useConfig', () => ({
    __esModule: true,
    useConfig: jest.fn(),
}));

jest.mock('../../hooks/useShowVPNDashboard', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../hooks/accounts/useShowDashboard', () => ({
    __esModule: true,
    default: jest.fn(),
    useShowDriveDashboard: jest.fn(),
}));

const mockUseConfig = require('@proton/app-context/useConfig').useConfig as jest.Mock;
const mockUseShowVPNDashboard = require('../../hooks/useShowVPNDashboard').default as jest.Mock;
const mockUseShowDashboard = require('../../hooks/accounts/useShowDashboard').default as jest.Mock;
const mockUseShowDriveDashboard = require('../../hooks/accounts/useShowDashboard').useShowDriveDashboard as jest.Mock;

const NOW = new Date('2026-01-01');
const IN_15_DAYS = new Date('2026-01-16').getTime() / 1000;
const IN_20_DAYS = new Date('2026-01-21').getTime() / 1000;
const IN_120_DAYS = new Date('2026-05-01').getTime() / 1000;

const ending = (plan: PLANS, PeriodEnd: number, override: Partial<Subscription> = {}) =>
    buildSubscription(plan, { ID: `${plan}-ending`, Renew: Renew.Disabled, PeriodEnd, ...override });

const renewing = (plan: PLANS, PeriodEnd: number) =>
    buildSubscription(plan, { ID: `${plan}-renewing`, Renew: Renew.Enabled, PeriodEnd });

const getBannerSubscriptionID = (
    subscriptions: Subscription[],
    app: (typeof APPS)[keyof typeof APPS] = APPS.PROTONACCOUNT
) => renderHook(() => useSubscriptionWithEndsBanner(app, subscriptions)).result.current?.ID;

describe('useSubscriptionWithEndsBanner', () => {
    beforeAll(() => jest.useFakeTimers().setSystemTime(NOW));
    afterAll(() => jest.useRealTimers());

    beforeEach(() => {
        mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONACCOUNT });
        mockUseShowVPNDashboard.mockReturnValue({ showVPNDashboard: false });
        mockUseShowDashboard.mockReturnValue({ showDashboard: false });
        mockUseShowDriveDashboard.mockReturnValue({ showDashboard: false });
    });

    describe('app guard', () => {
        it('returns undefined when APP_NAME is not proton-account or vpn settings', () => {
            mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONMAIL });
            expect(getBannerSubscriptionID([ending(PLANS.BUNDLE, IN_15_DAYS)], APPS.PROTONMAIL)).toBeUndefined();
        });

        it.each([APPS.PROTONACCOUNT, APPS.PROTONVPN_SETTINGS] as const)(
            'returns the ending subscription for %s',
            (app) => {
                mockUseConfig.mockReturnValue({ APP_NAME: app });
                expect(getBannerSubscriptionID([ending(PLANS.BUNDLE, IN_15_DAYS)], app)).toBe('bundle2022-ending');
            }
        );
    });

    describe('dashboard guard', () => {
        it('returns undefined when showVPNDashboard is true', () => {
            mockUseShowVPNDashboard.mockReturnValue({ showVPNDashboard: true });
            expect(getBannerSubscriptionID([ending(PLANS.BUNDLE, IN_15_DAYS)])).toBeUndefined();
        });

        it('returns undefined when showDashboard is true', () => {
            mockUseShowDashboard.mockReturnValue({ showDashboard: true });
            expect(getBannerSubscriptionID([ending(PLANS.BUNDLE, IN_15_DAYS)])).toBeUndefined();
        });

        it('returns undefined when showDriveDashboard is true', () => {
            mockUseShowDriveDashboard.mockReturnValue({ showDashboard: true });
            expect(getBannerSubscriptionID([ending(PLANS.BUNDLE, IN_15_DAYS)])).toBeUndefined();
        });
    });

    describe('single subscription', () => {
        it.each([
            { name: 'no subscriptions (free user or member)', subscriptions: [], expectedID: undefined },
            {
                name: 'a renewing subscription',
                subscriptions: [renewing(PLANS.BUNDLE, IN_15_DAYS)],
                expectedID: undefined,
            },
            {
                name: 'an ending trial',
                subscriptions: [ending(PLANS.BUNDLE, IN_15_DAYS, { IsTrial: true })],
                expectedID: undefined,
            },
            {
                name: 'an ending subscription without a period end',
                subscriptions: [ending(PLANS.BUNDLE, 0)],
                expectedID: undefined,
            },
            {
                name: 'an ending subscription',
                subscriptions: [ending(PLANS.BUNDLE, IN_15_DAYS)],
                expectedID: 'bundle2022-ending',
            },
            {
                name: 'mailpro2022 ending in more than 30 days',
                subscriptions: [ending(PLANS.MAIL_PRO, IN_120_DAYS)],
                expectedID: undefined,
            },
            {
                name: 'mailpro2022 ending within 30 days',
                subscriptions: [ending(PLANS.MAIL_PRO, IN_15_DAYS)],
                expectedID: 'mailpro2022-ending',
            },
            {
                name: 'a non-targeted plan ending in more than 30 days',
                subscriptions: [ending(PLANS.BUNDLE, IN_120_DAYS)],
                expectedID: 'bundle2022-ending',
            },
        ] as const)('returns $expectedID for $name', ({ subscriptions, expectedID }) => {
            expect(getBannerSubscriptionID([...subscriptions])).toBe(expectedID);
        });
    });

    describe('several subscriptions', () => {
        it.each([
            {
                name: 'two ending subscriptions, soonest second',
                subscriptions: [ending(PLANS.MAIL, IN_20_DAYS), ending(PLANS.DRIVE, IN_15_DAYS)],
                expectedID: 'drive2022-ending',
            },
            {
                name: 'one renewing, then one ending',
                subscriptions: [renewing(PLANS.MAIL, IN_15_DAYS), ending(PLANS.DRIVE, IN_20_DAYS)],
                expectedID: 'drive2022-ending',
            },
            {
                name: 'an ending trial that ends sooner than an ending paid subscription',
                subscriptions: [ending(PLANS.PASS, IN_15_DAYS, { IsTrial: true }), ending(PLANS.MAIL, IN_20_DAYS)],
                expectedID: 'mail2022-ending',
            },
            {
                name: 'mailpro2022 ending sooner but in more than 30 days, then another plan ending later',
                subscriptions: [ending(PLANS.MAIL_PRO, IN_120_DAYS - 86400), ending(PLANS.BUNDLE, IN_120_DAYS)],
                expectedID: 'bundle2022-ending',
            },
            {
                name: 'two renewing subscriptions',
                subscriptions: [renewing(PLANS.MAIL, IN_15_DAYS), renewing(PLANS.DRIVE, IN_20_DAYS)],
                expectedID: undefined,
            },
        ] as const)('returns $expectedID for $name', ({ subscriptions, expectedID }) => {
            expect(getBannerSubscriptionID([...subscriptions])).toBe(expectedID);
        });
    });
});
