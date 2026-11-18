import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import type { SharedStore } from '@proton/redux-shared-store/sharedStore';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import { buildUser } from '@proton/shared/testing/buildUser';
import duoPlanBackground from '@proton/styles/assets/img/onboarding/duoPlan.svg';

import { shouldDisplayDuoAccountTourStep } from './DuoAccountTourStep';

vi.mock('@proton/account/user', async () => ({
    ...(await vi.importActual('@proton/account/user')),
    userThunk: vi.fn(() => 'user'),
}));
vi.mock('@proton/account/organization', async () => ({
    ...(await vi.importActual('@proton/account/organization')),
    organizationThunk: vi.fn(() => 'organization'),
}));
vi.mock('@proton/account/allSubscriptions', async () => ({
    ...(await vi.importActual('@proton/account/allSubscriptions')),
    allSubscriptionsThunk: vi.fn(() => 'allSubscriptions'),
}));

const preloadUrls = [duoPlanBackground];

const buildDispatch = ({
    isAdmin = true,
    usedMembers = 1,
    subscriptionPlans,
}: {
    isAdmin?: boolean;
    usedMembers?: number;
    subscriptionPlans: PLANS[];
}) => {
    const values: Record<string, unknown> = {
        user: buildUser({ isAdmin }),
        organization: { UsedMembers: usedMembers } as OrganizationExtended,
        allSubscriptions: subscriptionPlans.map((plan) => buildSubscription(plan)),
    };
    return vi.fn((action: string) => Promise.resolve(values[action])) as unknown as SharedStore['dispatch'];
};

describe('shouldDisplayDuoAccountTourStep', () => {
    it('displays for the admin of a Duo subscription without other members', async () => {
        expect(await shouldDisplayDuoAccountTourStep(buildDispatch({ subscriptionPlans: [PLANS.DUO] }))).toEqual({
            canDisplay: true,
            preloadUrls,
        });
    });

    it.each([PLANS.FAMILY, PLANS.VISIONARY, PLANS.BUNDLE, PLANS.MAIL] as const)(
        'does not display for %s',
        async (plan) => {
            expect(await shouldDisplayDuoAccountTourStep(buildDispatch({ subscriptionPlans: [plan] }))).toEqual({
                canDisplay: false,
                preloadUrls,
            });
        }
    );

    it('does not display without a subscription', async () => {
        expect(await shouldDisplayDuoAccountTourStep(buildDispatch({ subscriptionPlans: [] }))).toEqual({
            canDisplay: false,
            preloadUrls,
        });
    });

    it('displays when one of several subscriptions is Duo', async () => {
        expect(
            await shouldDisplayDuoAccountTourStep(buildDispatch({ subscriptionPlans: [PLANS.PASS, PLANS.DUO] }))
        ).toEqual({ canDisplay: true, preloadUrls });
    });

    it('does not display for a non-admin user', async () => {
        expect(
            await shouldDisplayDuoAccountTourStep(buildDispatch({ isAdmin: false, subscriptionPlans: [PLANS.DUO] }))
        ).toEqual({ canDisplay: false, preloadUrls });
    });

    it('does not display once other members joined', async () => {
        expect(
            await shouldDisplayDuoAccountTourStep(buildDispatch({ usedMembers: 2, subscriptionPlans: [PLANS.DUO] }))
        ).toEqual({ canDisplay: false, preloadUrls });
    });
});
