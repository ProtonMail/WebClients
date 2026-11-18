import { renderHook } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { useFlag } from '@proton/unleash/useFlag';

import useActiveBreakpoint from '../../../hooks/useActiveBreakpoint';
import useBusySlotsAvailable from './useBusySlotsAvailable';

vi.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('../../../hooks/useActiveBreakpoint', () => ({
    __esModule: true,
    default: vi.fn(),
}));

const renderBusySlotsAvailable = ({
    subscriptionPlans,
    viewer = {},
    loadingEntitlements = false,
    isFlagEnabled = true,
    isSmallViewport = false,
    view,
}: {
    subscriptionPlans: CataloguedPlan[];
    viewer?: Partial<typeof organizationMember>;
    loadingEntitlements?: boolean;
    isFlagEnabled?: boolean;
    isSmallViewport?: boolean;
    view?: VIEWS;
}) => {
    vi.mocked(useFlag).mockReturnValue(isFlagEnabled);
    vi.mocked(useActiveBreakpoint).mockReturnValue({
        viewportWidth: { '<=small': isSmallViewport },
    } as ReturnType<typeof useActiveBreakpoint>);
    vi.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans, ...viewer }),
        loadingEntitlements,
    ]);

    return renderHook(() => useBusySlotsAvailable(view)).result.current;
};

describe('useBusySlotsAvailable', () => {
    it.each([PLANS.FAMILY, PLANS.BUNDLE_PRO_2024, PLANS.MAIL_PRO] as const)('returns true for %s', (plan) => {
        expect(renderBusySlotsAvailable({ subscriptionPlans: [plan] })).toBe(true);
    });

    it.each([PLANS.FAMILY, PLANS.BUNDLE_PRO_2024] as const)(
        'returns true for a member of a %s organization',
        (plan) => {
            expect(renderBusySlotsAvailable({ subscriptionPlans: [plan], viewer: organizationMember })).toBe(true);
        }
    );

    it.each([PLANS.MAIL, PLANS.VPN_BUSINESS] as const)('returns false for %s', (plan) => {
        expect(renderBusySlotsAvailable({ subscriptionPlans: [plan] })).toBe(false);
    });

    it('returns false when Mail Plus sits next to VPN Business', () => {
        expect(renderBusySlotsAvailable({ subscriptionPlans: [PLANS.MAIL, PLANS.VPN_BUSINESS] })).toBe(false);
    });

    it('returns false while entitlements load', () => {
        expect(renderBusySlotsAvailable({ subscriptionPlans: [PLANS.FAMILY], loadingEntitlements: true })).toBe(false);
    });

    it('returns false when the feature flag is off', () => {
        expect(renderBusySlotsAvailable({ subscriptionPlans: [PLANS.FAMILY], isFlagEnabled: false })).toBe(false);
    });

    it('returns false on a small viewport', () => {
        expect(renderBusySlotsAvailable({ subscriptionPlans: [PLANS.FAMILY], isSmallViewport: true })).toBe(false);
    });

    it('returns false in the month view', () => {
        expect(renderBusySlotsAvailable({ subscriptionPlans: [PLANS.FAMILY], view: VIEWS.MONTH })).toBe(false);
    });
});
