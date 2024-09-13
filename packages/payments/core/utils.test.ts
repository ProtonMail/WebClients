import { BillingPlatform, ChargebeeEnabled, type Subscription, type User } from '@proton/shared/lib/interfaces';

import {
    isOnSessionMigration,
    isSplittedUser,
    onSessionMigrationChargebeeStatus,
    onSessionMigrationPaymentsVersion,
} from './utils';

describe('isOnSessionMigration', () => {
    it.each([
        {
            billingPlatform: BillingPlatform.Proton,
        },
        {
            billingPlatform: undefined,
        },
        {
            billingPlatform: BillingPlatform.Chargebee,
        },
    ])('should return false when user is ChargebeeAllowed', ({ billingPlatform }) => {
        expect(isOnSessionMigration(ChargebeeEnabled.CHARGEBEE_ALLOWED, billingPlatform)).toBe(false);
    });

    it.each([
        {
            billingPlatform: BillingPlatform.Proton,
        },
        {
            billingPlatform: undefined,
        },
        {
            billingPlatform: BillingPlatform.Chargebee,
        },
    ])('should return false when user is InhouseForced', ({ billingPlatform }) => {
        expect(isOnSessionMigration(ChargebeeEnabled.INHOUSE_FORCED, billingPlatform)).toBe(false);
    });

    it.each([
        {
            chargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED,
        },
        {
            chargebeeUser: ChargebeeEnabled.CHARGEBEE_ALLOWED,
        },
        {
            chargebeeUser: ChargebeeEnabled.INHOUSE_FORCED,
        },
    ])('should return false when billing platform is Chargebee', ({ chargebeeUser }) => {
        expect(isOnSessionMigration(chargebeeUser, BillingPlatform.Chargebee)).toBe(false);
    });

    it.each([
        {
            chargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED,
        },
        {
            chargebeeUser: ChargebeeEnabled.CHARGEBEE_ALLOWED,
        },
        {
            chargebeeUser: ChargebeeEnabled.INHOUSE_FORCED,
        },
    ])('should return false when billing platform is undefined', ({ chargebeeUser }) => {
        expect(isOnSessionMigration(chargebeeUser, undefined)).toBe(false);
    });

    it('should return true when user is ChargebeeForced and billing platform is Proton', () => {
        expect(isOnSessionMigration(ChargebeeEnabled.CHARGEBEE_FORCED, BillingPlatform.Proton)).toBe(true);
    });
});

describe('onSessionMigrationChargebeeStatus', () => {
    it('should return InhouseForced when on session migration is enabled', () => {
        expect(
            onSessionMigrationChargebeeStatus(
                { ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED } as User,
                {
                    BillingPlatform: BillingPlatform.Proton,
                } as Subscription
            )
        ).toBe(ChargebeeEnabled.INHOUSE_FORCED);
    });

    it.each([
        {
            chargebeeUser: ChargebeeEnabled.CHARGEBEE_ALLOWED,
            billingPlatform: BillingPlatform.Proton,
        },
        {
            chargebeeUser: ChargebeeEnabled.CHARGEBEE_ALLOWED,
            billingPlatform: undefined,
        },
        {
            chargebeeUser: ChargebeeEnabled.CHARGEBEE_ALLOWED,
            billingPlatform: BillingPlatform.Chargebee,
        },
        {
            chargebeeUser: ChargebeeEnabled.INHOUSE_FORCED,
            billingPlatform: BillingPlatform.Proton,
        },
        {
            chargebeeUser: ChargebeeEnabled.INHOUSE_FORCED,
            billingPlatform: undefined,
        },
        {
            chargebeeUser: ChargebeeEnabled.INHOUSE_FORCED,
            billingPlatform: BillingPlatform.Chargebee,
        },
        {
            chargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED,
            billingPlatform: BillingPlatform.Chargebee,
        },
        {
            chargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED,
            billingPlatform: undefined,
        },
    ])('should return user.ChargebeeUser property otherwise', ({ chargebeeUser, billingPlatform }) => {
        expect(
            onSessionMigrationChargebeeStatus(
                { ChargebeeUser: chargebeeUser } as User,
                {
                    BillingPlatform: billingPlatform,
                } as Subscription
            )
        ).toBe(chargebeeUser);
    });
});

describe('onSessionMigrationPaymentsVersion', () => {
    it('should return v4 when on session migration is enabled', () => {
        expect(
            onSessionMigrationPaymentsVersion(
                { ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED } as User,
                {
                    BillingPlatform: BillingPlatform.Proton,
                } as Subscription
            )
        ).toBe('v4');
    });

    it.each([
        {
            billingPlatform: BillingPlatform.Chargebee,
        },
        {
            billingPlatform: undefined,
        },
    ])('should return v5 in other CHARGEBEE_FORCED cases', ({ billingPlatform }) => {
        expect(
            onSessionMigrationPaymentsVersion(
                { ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED } as User,
                {
                    BillingPlatform: billingPlatform,
                } as Subscription
            )
        ).toBe('v5');
    });

    it.each([
        {
            billingPlatform: BillingPlatform.Proton,
        },
        {
            billingPlatform: undefined,
        },
        {
            billingPlatform: BillingPlatform.Chargebee,
        },
    ])('should return v5 if ChargebeeAllowed', ({ billingPlatform }) => {
        expect(
            onSessionMigrationPaymentsVersion(
                { ChargebeeUser: ChargebeeEnabled.CHARGEBEE_ALLOWED } as User,
                {
                    BillingPlatform: billingPlatform,
                } as Subscription
            )
        ).toBe('v5');
    });

    // returns v4 for InhouseForced
    it.each([
        {
            billingPlatform: BillingPlatform.Proton,
        },
        {
            billingPlatform: undefined,
        },
        {
            billingPlatform: BillingPlatform.Chargebee,
        },
    ])('should return v4 if InhouseForced', ({ billingPlatform }) => {
        expect(
            onSessionMigrationPaymentsVersion(
                { ChargebeeUser: ChargebeeEnabled.INHOUSE_FORCED } as User,
                {
                    BillingPlatform: billingPlatform,
                } as Subscription
            )
        ).toBe('v4');
    });
});

describe('isSplittedUser', () => {
    it.each([
        {
            ChargebeeUserExists: true as any,
            BillingPlatform: BillingPlatform.Proton,
        },
        {
            ChargebeeUserExists: 1 as any,
            BillingPlatform: BillingPlatform.Proton,
        },
        {
            ChargebeeUserExists: 1,
            BillingPlatform: BillingPlatform.Proton,
        },
        {
            ChargebeeUserExists: 1,
            BillingPlatform: 0,
        },
    ])(
        'should be splitted if BillingPlatform is proton and CB customer exists',
        ({ ChargebeeUserExists, BillingPlatform }) => {
            expect(isSplittedUser(ChargebeeEnabled.CHARGEBEE_FORCED, ChargebeeUserExists, BillingPlatform)).toBe(true);
        }
    );

    it.each([
        {
            ChargebeeUserExists: 0,
            BillingPlatform: BillingPlatform.Proton,
        },
        {
            ChargebeeUserExists: 0,
            BillingPlatform: 0,
        },
        {
            ChargebeeUserExists: 1,
            BillingPlatform: BillingPlatform.Chargebee,
        },
    ])(
        'should not be splitted if BillingPlatform is not proton or CB customer does not exist',
        ({ ChargebeeUserExists, BillingPlatform }) => {
            expect(isSplittedUser(ChargebeeEnabled.CHARGEBEE_FORCED, ChargebeeUserExists, BillingPlatform)).toBe(false);
        }
    );

    it('should not be splitted if subscription is undefined', () => {
        expect(isSplittedUser(ChargebeeEnabled.CHARGEBEE_FORCED, 1, undefined)).toBe(false);
    });

    it('should not be splitted if subscription is free', () => {
        expect(isSplittedUser(ChargebeeEnabled.CHARGEBEE_FORCED, 1, undefined)).toBe(false);
    });
});
