import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import type { SharedStore } from '@proton/redux-shared-store/sharedStore';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import { buildUser } from '@proton/shared/testing/buildUser';
import familyPlanBackground from '@proton/styles/assets/img/onboarding/familyPlan.svg';

import { shouldDisplayFamilyAccountTourStep } from './FamilyAccountTourStep';

jest.mock('@proton/account/user', () => ({
    ...jest.requireActual('@proton/account/user'),
    userThunk: jest.fn(() => 'user'),
}));
jest.mock('@proton/account/organization', () => ({
    ...jest.requireActual('@proton/account/organization'),
    organizationThunk: jest.fn(() => 'organization'),
}));
jest.mock('@proton/account/allSubscriptions', () => ({
    ...jest.requireActual('@proton/account/allSubscriptions'),
    allSubscriptionsThunk: jest.fn(() => 'allSubscriptions'),
}));

const preloadUrls = [familyPlanBackground];

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
    return jest.fn((action: string) => Promise.resolve(values[action])) as unknown as SharedStore['dispatch'];
};

describe('shouldDisplayFamilyAccountTourStep', () => {
    it('displays for the admin of a Family subscription without other members', async () => {
        expect(await shouldDisplayFamilyAccountTourStep(buildDispatch({ subscriptionPlans: [PLANS.FAMILY] }))).toEqual({
            canDisplay: true,
            preloadUrls,
        });
    });

    it.each([PLANS.DUO, PLANS.VISIONARY, PLANS.BUNDLE, PLANS.MAIL] as const)(
        'does not display for %s',
        async (plan) => {
            expect(await shouldDisplayFamilyAccountTourStep(buildDispatch({ subscriptionPlans: [plan] }))).toEqual({
                canDisplay: false,
                preloadUrls,
            });
        }
    );

    it('does not display without a subscription', async () => {
        expect(await shouldDisplayFamilyAccountTourStep(buildDispatch({ subscriptionPlans: [] }))).toEqual({
            canDisplay: false,
            preloadUrls,
        });
    });

    it('displays when one of several subscriptions is Family', async () => {
        expect(
            await shouldDisplayFamilyAccountTourStep(buildDispatch({ subscriptionPlans: [PLANS.PASS, PLANS.FAMILY] }))
        ).toEqual({ canDisplay: true, preloadUrls });
    });

    it('does not display for a non-admin user', async () => {
        expect(
            await shouldDisplayFamilyAccountTourStep(
                buildDispatch({ isAdmin: false, subscriptionPlans: [PLANS.FAMILY] })
            )
        ).toEqual({ canDisplay: false, preloadUrls });
    });

    it('does not display once other members joined', async () => {
        expect(
            await shouldDisplayFamilyAccountTourStep(
                buildDispatch({ usedMembers: 2, subscriptionPlans: [PLANS.FAMILY] })
            )
        ).toEqual({ canDisplay: false, preloadUrls });
    });
});
