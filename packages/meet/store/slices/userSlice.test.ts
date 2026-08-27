import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { ADDON_NAMES, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { ORGANIZATION_FLAGS, PRODUCT_BIT, USER_ROLES } from '@proton/shared/lib/constants';
import type { Organization, User, UserModel } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import type { MeetState } from '../rootReducer';
import { selectSubscriptionStatus } from './userSlice';

const NOW = new Date('2025-06-15T12:00:00Z');

const createdDaysAgo = (days: number) => Math.floor(NOW.getTime() / 1000) - (days * 86400 + 3600);

const getUser = ({
    daysSinceCreation = 30,
    subscribed = 0,
    isMember = false,
}: { daysSinceCreation?: number; subscribed?: number; isMember?: boolean } = {}) =>
    formatUser({
        ID: 'user-id',
        CreateTime: createdDaysAgo(daysSinceCreation),
        Role: isMember ? USER_ROLES.MEMBER_ROLE : USER_ROLES.FREE_ROLE,
        Subscribed: subscribed,
    } as User);

const getSubscription = (...plans: (PLANS | ADDON_NAMES)[]) =>
    ({ Plans: plans.map((Name) => ({ Name })) }) as unknown as Subscription;

const getState = ({
    user,
    subscription,
    organization,
}: {
    user?: UserModel;
    subscription?: Subscription | typeof FREE_SUBSCRIPTION;
    organization?: Partial<Organization>;
} = {}) =>
    ({
        user: { value: user },
        subscription: { value: subscription },
        organization: { value: organization },
    }) as unknown as MeetState;

describe('selectSubscriptionStatus', () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    // Covers guests and the window before the user model lands, so a paid user can see the upsell flash.
    it('upsells when there is no user to decide on', () => {
        expect(selectSubscriptionStatus(getState())).toEqual({
            isPaidUser: false,
            isSubUser: false,
            hasSubscriptionWithoutMeet: false,
            canUpsell: true,
            isLoading: false,
        });
    });

    it('upsells to a free user whose account is past the grace period', () => {
        expect(selectSubscriptionStatus(getState({ user: getUser({ daysSinceCreation: 30 }) }))).toEqual({
            isPaidUser: false,
            isSubUser: false,
            hasSubscriptionWithoutMeet: false,
            canUpsell: true,
            isLoading: true,
        });
    });

    describe('grace period after account creation', () => {
        it.each([0, 1, 2])('holds the upsell back on day %i', (daysSinceCreation) => {
            expect(selectSubscriptionStatus(getState({ user: getUser({ daysSinceCreation }) })).canUpsell).toBe(false);
        });

        it.each([3, 4])('upsells from day 3 on, here day %i', (daysSinceCreation) => {
            expect(selectSubscriptionStatus(getState({ user: getUser({ daysSinceCreation }) })).canUpsell).toBe(true);
        });
    });

    describe('plans that include Meet', () => {
        it.each([PLANS.VISIONARY, PLANS.BUNDLE_PRO_2024, PLANS.BUNDLE_BIZ_2025])(
            'treats %s as a paid Meet subscription',
            (plan) => {
                expect(
                    selectSubscriptionStatus(getState({ user: getUser(), subscription: getSubscription(plan) }))
                ).toEqual({
                    isPaidUser: true,
                    isSubUser: false,
                    hasSubscriptionWithoutMeet: false,
                    canUpsell: false,
                    isLoading: false,
                });
            }
        );

        it('treats a Proton employee organization as paid, whatever the subscription says', () => {
            expect(
                selectSubscriptionStatus(
                    getState({
                        user: getUser(),
                        subscription: getSubscription(PLANS.MAIL),
                        organization: { Flags: ORGANIZATION_FLAGS.PROTON },
                    })
                )
            ).toEqual({
                isPaidUser: true,
                isSubUser: false,
                hasSubscriptionWithoutMeet: false,
                canUpsell: false,
                isLoading: false,
            });
        });

        it('does not pick up a plan it does not know about, such as Meet Business', () => {
            expect(
                selectSubscriptionStatus(
                    getState({ user: getUser(), subscription: getSubscription(PLANS.MEET_BUSINESS) })
                ).isPaidUser
            ).toBe(false);
        });
    });

    describe('Meet addon, which the plan checks cannot see', () => {
        it('counts the Meet bit in Subscribed, even with no subscription of their own', () => {
            expect(selectSubscriptionStatus(getState({ user: getUser({ subscribed: PRODUCT_BIT.MEET }) }))).toEqual({
                isPaidUser: true,
                isSubUser: false,
                hasSubscriptionWithoutMeet: false,
                canUpsell: false,
                isLoading: true,
            });
        });

        it('counts a Mail Pro subscription carrying the Meet addon', () => {
            expect(
                selectSubscriptionStatus(
                    getState({
                        user: getUser({ subscribed: PRODUCT_BIT.MAIL | PRODUCT_BIT.MEET }),
                        subscription: getSubscription(PLANS.MAIL_PRO, ADDON_NAMES.MEET_MAIL_PRO),
                    })
                )
            ).toEqual({
                isPaidUser: true,
                isSubUser: false,
                hasSubscriptionWithoutMeet: false,
                canUpsell: false,
                isLoading: false,
            });
        });

        it('counts a member whose organization bought them the addon', () => {
            expect(
                selectSubscriptionStatus(getState({ user: getUser({ isMember: true, subscribed: PRODUCT_BIT.MEET }) }))
            ).toEqual({
                isPaidUser: true,
                isSubUser: true,
                hasSubscriptionWithoutMeet: false,
                canUpsell: false,
                isLoading: true,
            });
        });

        it('leaves a paying user without the Meet bit unpaid', () => {
            expect(
                selectSubscriptionStatus(
                    getState({
                        user: getUser({ subscribed: PRODUCT_BIT.MAIL }),
                        subscription: getSubscription(PLANS.MAIL_PRO),
                    })
                )
            ).toEqual({
                isPaidUser: false,
                isSubUser: false,
                hasSubscriptionWithoutMeet: true,
                canUpsell: true,
                isLoading: false,
            });
        });
    });

    describe('subscription without Meet', () => {
        it('points a paying user without Meet at the add-on instead of the upsell', () => {
            expect(
                selectSubscriptionStatus(getState({ user: getUser(), subscription: getSubscription(PLANS.MAIL) }))
            ).toEqual({
                isPaidUser: false,
                isSubUser: false,
                hasSubscriptionWithoutMeet: true,
                canUpsell: true,
                isLoading: false,
            });
        });

        it('reports no subscription for a user with a Meet plan', () => {
            expect(
                selectSubscriptionStatus(
                    getState({ user: getUser(), subscription: getSubscription(PLANS.VISIONARY, PLANS.MAIL) })
                ).hasSubscriptionWithoutMeet
            ).toBe(false);
        });
    });

    /**
     * The app reaches this state for every free user: App.tsx keeps a useSubscription()
     * alive, and the thunk stores FREE_SUBSCRIPTION for anyone it cannot fetch for.
     */
    describe('free user, whose subscription slice holds the free placeholder', () => {
        it('upsells to them', () => {
            expect(
                selectSubscriptionStatus(getState({ user: getUser(), subscription: FREE_SUBSCRIPTION })).canUpsell
            ).toBe(true);
        });

        it('does not count the placeholder as a subscription, so the banner offers the plan over the add-on', () => {
            expect(selectSubscriptionStatus(getState({ user: getUser(), subscription: FREE_SUBSCRIPTION }))).toEqual({
                isPaidUser: false,
                isSubUser: false,
                hasSubscriptionWithoutMeet: false,
                canUpsell: true,
                isLoading: false,
            });
        });

        it('holds the upsell back while they are still inside the grace period', () => {
            expect(
                selectSubscriptionStatus(
                    getState({ user: getUser({ daysSinceCreation: 1 }), subscription: FREE_SUBSCRIPTION })
                ).canUpsell
            ).toBe(false);
        });
    });

    describe('isLoading, which mirrors the loading flag of useSubscription', () => {
        it('waits while the subscription of a signed-in user is still on its way', () => {
            expect(selectSubscriptionStatus(getState({ user: getUser() })).isLoading).toBe(true);
        });

        it('stops waiting once the free placeholder lands', () => {
            expect(
                selectSubscriptionStatus(getState({ user: getUser(), subscription: FREE_SUBSCRIPTION })).isLoading
            ).toBe(false);
        });

        it('stops waiting once a real subscription lands', () => {
            expect(
                selectSubscriptionStatus(getState({ user: getUser(), subscription: getSubscription(PLANS.MAIL) }))
                    .isLoading
            ).toBe(false);
        });

        /**
         * Guests never dispatch the subscription thunk, so waiting on one would hide
         * their upsell for good.
         */
        it('has nothing to wait for without a user', () => {
            expect(selectSubscriptionStatus(getState()).isLoading).toBe(false);
        });
    });

    describe('organization members', () => {
        it('never upsells to a member, since they cannot buy for themselves', () => {
            expect(selectSubscriptionStatus(getState({ user: getUser({ isMember: true }) }))).toEqual({
                isPaidUser: false,
                isSubUser: true,
                hasSubscriptionWithoutMeet: false,
                canUpsell: false,
                isLoading: true,
            });
        });

        it('keeps a member on a Meet plan paid', () => {
            expect(
                selectSubscriptionStatus(
                    getState({
                        user: getUser({ isMember: true }),
                        subscription: getSubscription(PLANS.BUNDLE_BIZ_2025),
                    })
                )
            ).toEqual({
                isPaidUser: true,
                isSubUser: true,
                hasSubscriptionWithoutMeet: false,
                canUpsell: false,
                isLoading: false,
            });
        });
    });
});
