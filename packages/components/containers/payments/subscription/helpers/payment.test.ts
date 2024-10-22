import { PLANS } from '@proton/payments';
import { CYCLE, FREE_SUBSCRIPTION } from '@proton/shared/lib/constants';
import { Renew } from '@proton/shared/lib/interfaces';
import { PLANS_MAP, subscriptionMock, upcomingSubscriptionMock } from '@proton/testing/data';

import {
    countriesWithStates,
    getBillingAddressStatus,
    notHigherThanAvailableOnBackend,
    subscriptionExpires,
} from './payment';

describe('subscriptionExpires()', () => {
    it('should handle the case when subscription is not loaded yet', () => {
        expect(subscriptionExpires()).toEqual({
            subscriptionExpiresSoon: false,
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should handle the case when subscription is free', () => {
        expect(subscriptionExpires(FREE_SUBSCRIPTION as any)).toEqual({
            subscriptionExpiresSoon: false,
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should handle non-expiring subscription', () => {
        expect(subscriptionExpires(subscriptionMock)).toEqual({
            subscriptionExpiresSoon: false,
            planName: 'Proton Unlimited',
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should handle expiring subscription', () => {
        expect(
            subscriptionExpires({
                ...subscriptionMock,
                Renew: Renew.Disabled,
            })
        ).toEqual({
            subscriptionExpiresSoon: true,
            planName: 'Proton Unlimited',
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: subscriptionMock.PeriodEnd,
        });
    });

    it('should handle the case when the upcoming subscription expires', () => {
        expect(
            subscriptionExpires({
                ...subscriptionMock,
                UpcomingSubscription: {
                    ...upcomingSubscriptionMock,
                    Renew: Renew.Disabled,
                },
            })
        ).toEqual({
            subscriptionExpiresSoon: true,
            planName: 'Proton Unlimited',
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: upcomingSubscriptionMock.PeriodEnd,
        });
    });

    it('should handle the case when the upcoming subscription does not expire', () => {
        expect(
            subscriptionExpires({
                ...subscriptionMock,
                UpcomingSubscription: {
                    ...upcomingSubscriptionMock,
                    Renew: Renew.Enabled,
                },
            })
        ).toEqual({
            subscriptionExpiresSoon: false,
            planName: 'Proton Unlimited',
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });
});

describe('notHigherThanAvailableOnBackend', () => {
    it('should return current cycle if plan does not exist in the planIDs', () => {
        expect(notHigherThanAvailableOnBackend({}, PLANS_MAP, CYCLE.MONTHLY)).toEqual(CYCLE.MONTHLY);
    });

    it('should return current cycle if plan does not exist in the plansMap', () => {
        expect(notHigherThanAvailableOnBackend({ [PLANS.MAIL]: 1 }, {}, CYCLE.MONTHLY)).toEqual(CYCLE.MONTHLY);
    });

    it.each([CYCLE.MONTHLY, CYCLE.THIRTY, CYCLE.YEARLY, CYCLE.FIFTEEN, CYCLE.EIGHTEEN, CYCLE.TWO_YEARS, CYCLE.THIRTY])(
        'should return current cycle if it is not higher than available on backend',
        (cycle) => {
            expect(notHigherThanAvailableOnBackend({ [PLANS.VPN2024]: 1 }, PLANS_MAP, cycle)).toEqual(cycle);
        }
    );

    it.each([
        {
            plan: PLANS.MAIL,
            cycle: CYCLE.THIRTY,
            expected: CYCLE.TWO_YEARS,
        },
        {
            plan: PLANS.MAIL,
            cycle: CYCLE.TWO_YEARS,
            expected: CYCLE.TWO_YEARS,
        },
        {
            plan: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            expected: CYCLE.YEARLY,
        },
        {
            plan: PLANS.WALLET,
            cycle: CYCLE.TWO_YEARS,
            expected: CYCLE.YEARLY,
        },
        {
            plan: PLANS.WALLET,
            cycle: CYCLE.YEARLY,
            expected: CYCLE.YEARLY,
        },
    ])('should cap cycle if the backend does not have available higher cycles', ({ plan, cycle, expected }) => {
        expect(notHigherThanAvailableOnBackend({ [plan]: 1 }, PLANS_MAP, cycle)).toEqual(expected);
    });
});

describe('isBillingAddressValid', () => {
    it.each(['DE', 'FR', 'CH', 'GB'])(
        'should return true for regular countries without State condition - %s',
        (CountryCode) => {
            expect(getBillingAddressStatus({ CountryCode })).toEqual({ valid: true });
        }
    );

    it('should return false if CountryCode is not specified', () => {
        expect(getBillingAddressStatus({} as any)).toEqual({ valid: false, reason: 'missingCountry' });
        expect(getBillingAddressStatus({ CountryCode: '' })).toEqual({ valid: false, reason: 'missingCountry' });
        expect(getBillingAddressStatus({ CountryCode: null } as any)).toEqual({
            valid: false,
            reason: 'missingCountry',
        });
        expect(getBillingAddressStatus({ CountryCode: undefined } as any)).toEqual({
            valid: false,
            reason: 'missingCountry',
        });
    });

    it.each(countriesWithStates)(
        'should return false if CountryCode is specified but state is not - %s',
        (CountryCode) => {
            expect(getBillingAddressStatus({ CountryCode })).toEqual({ valid: false, reason: 'missingState' });
            expect(getBillingAddressStatus({ CountryCode, State: null })).toEqual({
                valid: false,
                reason: 'missingState',
            });
            expect(getBillingAddressStatus({ CountryCode, State: undefined })).toEqual({
                valid: false,
                reason: 'missingState',
            });
            expect(getBillingAddressStatus({ CountryCode, State: '' })).toEqual({
                valid: false,
                reason: 'missingState',
            });
        }
    );

    it('should return true if CountryCode and State are specified', () => {
        expect(getBillingAddressStatus({ CountryCode: 'US', State: 'AL' })).toEqual({ valid: true });
        expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'NL' })).toEqual({ valid: true });
    });
});
