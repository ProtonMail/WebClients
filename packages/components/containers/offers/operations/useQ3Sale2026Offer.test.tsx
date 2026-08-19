import { Route, Router } from 'react-router';

import { renderHook } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { CYCLE, PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import ConfigProvider from '../../config/Provider';
import useOfferFlags from '../hooks/useOfferFlags';
import { configuration as duoToFamilyConfig } from './q3Sale2026DuoToFamily/configuration';
import { useOffer as useDuoToFamily } from './q3Sale2026DuoToFamily/useOffer';
import { configuration as familyMonthlyToYearlyConfig } from './q3Sale2026FamilyMonthlyToYearly/configuration';
import { useOffer as useFamilyMonthlyToYearly } from './q3Sale2026FamilyMonthlyToYearly/useOffer';
import { configuration as freeToUnlimitedConfig } from './q3Sale2026FreeToUnlimited/configuration';
import { useOffer as useFreeToUnlimited } from './q3Sale2026FreeToUnlimited/useOffer';
import { configuration as plusToUnlimitedConfig } from './q3Sale2026PlusToUnlimited/configuration';
import { useOffer as usePlusToUnlimited } from './q3Sale2026PlusToUnlimited/useOffer';
import { configuration as unlimitedToDuoConfig } from './q3Sale2026UnlimitedToDuo/configuration';
import { useOffer as useUnlimitedToDuo } from './q3Sale2026UnlimitedToDuo/useOffer';

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.Mock;

jest.mock('@proton/account/subscription/hooks');
const mockUseSubscription = useSubscription as jest.Mock;

jest.mock('@proton/components/payments/client-extensions', () => ({
    __esModule: true,
    useAutomaticCurrency: jest.fn(),
}));
const mockUseAutomaticCurrency = useAutomaticCurrency as jest.Mock;

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.Mock;

jest.mock('../hooks/useOfferFlags', () => ({
    __esModule: true,
    default: jest.fn(),
}));
const mockUseOfferFlags = useOfferFlags as jest.Mock;

const DRIVE_CONFIG = {
    APP_NAME: APPS.PROTONDRIVE,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

const history = createMemoryHistory({ initialEntries: ['/'] });

const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <ConfigProvider config={DRIVE_CONFIG}>
            <Router history={history}>
                <Route path="/">{children}</Route>
            </Router>
        </ConfigProvider>
    );
};

const buildSubscription = (plan: PLANS, cycle: CYCLE = CYCLE.YEARLY) => {
    return {
        Cycle: cycle,
        Plans: [{ Type: PLAN_TYPES.PLAN, Name: plan }],
    } as unknown as Subscription;
};

/**
 * Each entry pairs an operation's hook with a subscription that makes it eligible, so `isEligible` is
 * asserted as a real signal rather than trivially false for every offer.
 */
const offerHooks = [
    {
        name: 'free-to-unlimited',
        useOffer: useFreeToUnlimited,
        plan: undefined,
        isPaid: false,
        ref: 'offer_26_sep_free_unlimited_drive_web',
        configuration: freeToUnlimitedConfig,
    },
    {
        name: 'plus-to-unlimited',
        useOffer: usePlusToUnlimited,
        plan: PLANS.MAIL,
        isPaid: true,
        ref: 'offer_26_sep_mail_plus_unlimited_drive_web',
        configuration: plusToUnlimitedConfig,
    },
    {
        name: 'unlimited-to-duo',
        useOffer: useUnlimitedToDuo,
        plan: PLANS.BUNDLE,
        isPaid: true,
        ref: 'offer_26_sep_unlimited_duo_drive_web',
        configuration: unlimitedToDuoConfig,
    },
    {
        name: 'duo-to-family',
        useOffer: useDuoToFamily,
        plan: PLANS.DUO,
        isPaid: true,
        ref: 'offer_26_sep_duo_family_drive_web',
        configuration: duoToFamilyConfig,
    },
    {
        name: 'family-monthly-to-yearly',
        useOffer: useFamilyMonthlyToYearly,
        plan: PLANS.FAMILY,
        cycle: CYCLE.MONTHLY,
        isPaid: true,
        ref: 'offer_26_sep_family_family12_drive_web',
        configuration: familyMonthlyToYearlyConfig,
    },
];

type LoadingSource = 'user' | 'subscription' | 'currency' | 'offerFlags';

const setupMocks = ({
    plan,
    cycle = CYCLE.YEARLY,
    isPaid = true,
    replayFlag = false,
    loadingSource,
}: {
    plan?: PLANS;
    cycle?: CYCLE;
    isPaid?: boolean;
    replayFlag?: boolean;
    /** Marks exactly one dependency as loading, so each one is proven to reach `isLoading` on its own. */
    loadingSource?: LoadingSource;
} = {}) => {
    mockUseUser.mockReturnValue([
        { isDelinquent: false, canPay: true, isPaid, isFree: !isPaid } as UserModel,
        loadingSource === 'user',
    ]);
    mockUseSubscription.mockReturnValue([
        plan ? buildSubscription(plan, cycle) : undefined,
        loadingSource === 'subscription',
    ]);
    mockUseAutomaticCurrency.mockReturnValue(['EUR', loadingSource === 'currency']);
    mockUseFlag.mockReturnValue(replayFlag);
    mockUseOfferFlags.mockReturnValue({ isActive: true, loading: loadingSource === 'offerFlags' });
};

describe('useQ3Sale2026Offer', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it.each(offerHooks)('$name resolves its tracking ref in full', ({ useOffer, plan, cycle, isPaid, ref }) => {
        setupMocks({ plan, cycle, isPaid });

        const { result } = renderHook(() => useOffer(), { wrapper });

        expect(result.current.config.deals[0].ref).toBe(ref);
    });

    it.each(offerHooks)(
        '$name does not fall back to its static ref',
        ({ useOffer, plan, cycle, isPaid, configuration }) => {
            setupMocks({ plan, cycle, isPaid });

            const { result } = renderHook(() => useOffer(), { wrapper });

            // Every static fallback is the mail variant, so resolution running is what makes these differ.
            expect(result.current.config.deals[0].ref).not.toBe(configuration.deals[0].ref);
        }
    );

    it.each(offerHooks)(
        '$name reports eligible and valid for its target audience',
        ({ useOffer, plan, cycle, isPaid }) => {
            setupMocks({ plan, cycle, isPaid });

            const { result } = renderHook(() => useOffer(), { wrapper });

            expect(result.current.isEligible).toBe(true);
            expect(result.current.isValid).toBe(true);
            expect(result.current.isLoading).toBe(false);
        }
    );

    // One case per dependency: asserting them together would still pass if `isLoading` dropped one.
    const loadingSources: LoadingSource[] = ['user', 'subscription', 'currency', 'offerFlags'];
    const loadingCases = offerHooks.flatMap((offer) => {
        return loadingSources.map((loadingSource) => {
            return { ...offer, loadingSource };
        });
    });

    it.each(loadingCases)(
        '$name reports loading while $loadingSource loads',
        ({ useOffer, plan, cycle, isPaid, loadingSource }) => {
            setupMocks({ plan, cycle, isPaid, loadingSource });

            const { result } = renderHook(() => useOffer(), { wrapper });

            expect(result.current.isLoading).toBe(true);
        }
    );

    describe('replayAutoPopUp', () => {
        it.each([true, false])('free-to-unlimited puts the flag value %s on its config', (replayFlag) => {
            setupMocks({ isPaid: false, replayFlag });

            const { result } = renderHook(() => useFreeToUnlimited(), { wrapper });

            expect(result.current.config.replayAutoPopUp).toBe(replayFlag);
        });

        // The other four never opt into a replay, so the key must be absent rather than false: an own
        // property of false would still read as "this offer supports replays, currently off".
        it.each(offerHooks.filter(({ name }) => name !== 'free-to-unlimited'))(
            '$name has no replayAutoPopUp key even when the flag is on',
            ({ useOffer, plan, cycle, isPaid }) => {
                setupMocks({ plan, cycle, isPaid, replayFlag: true });

                const { result } = renderHook(() => useOffer(), { wrapper });

                expect('replayAutoPopUp' in result.current.config).toBe(false);
            }
        );
    });
});
