import { PLANS } from '@proton/payments';
import type { Subscription } from '@proton/shared/lib/interfaces';
import format from '@proton/shared/lib/subscription/format';

describe('Subscription Format', () => {
    let subscription: Subscription;
    let upcoming: Subscription;

    beforeEach(() => {
        subscription = {
            ID: 'k2ou1ckjSusQvcOkMvMYo5_9tO93iG-5l0ycRA2wxWXkgR_3uW086eI8xit5qENSOes9nPbjIvUjkn8FdpZPrw==',
            InvoiceID: 'EodtkjoLzxaZpTfWOMEEsfqQuKftg11lPzfDuMxQFnX2sagjugYRm8AZ7O6N3K9mJdbLN_t0dbEMWuhs-EhSLQ==',
            External: 0,
            Cycle: 1,
            PeriodStart: 1669038950,
            PeriodEnd: 1671630950,
            CreateTime: 1669038951,
            CouponCode: null,
            Currency: 'CHF',
            Amount: 499,
            Discount: 0,
            RenewDiscount: 0,
            RenewAmount: 499,
            Plans: [
                {
                    ID: 'Wb4NAqmiuqoA7kCHE28y92bBFfN8jaYQCLxHRAB96yGj-bh9SxguXC48_WSU-fRUjdAr-lx95c6rFLplgXyXYA==',
                    Type: 1,
                    Name: PLANS.MAIL,
                    Title: 'Mail Plus',
                    MaxDomains: 1,
                    MaxAddresses: 10,
                    MaxCalendars: 25,
                    MaxSpace: 16106127360,
                    MaxMembers: 1,
                    MaxVPN: 0,
                    MaxTier: 0,
                    Services: 1,
                    Features: 1,
                    State: 1,
                    Cycle: 1,
                    Currency: 'CHF',
                    Amount: 499,
                    Quantity: 1,
                    Offer: 'default',
                },
            ],
            Renew: 1,
        };

        upcoming = {
            ID: 'klHlWI9EqPULc0sWO_C36DM8eHJ1H1bzIo4EmX-HG_VbDfS67gMvCt_5mhHFwHh9n02aNoux8qj4bUZOaebRUg==',
            InvoiceID: 'EodtkjoLzxaZpTfWOMEEsfqQuKftg11lPzfDuMxQFnX2sagjugYRm8AZ7O6N3K9mJdbLN_t0dbEMWuhs-EhSLQ==',
            Cycle: 12,
            External: 0,
            PeriodStart: 1671630950,
            PeriodEnd: 1703166950,
            CreateTime: 1669039317,
            CouponCode: 'BUNDLE',
            Currency: 'CHF',
            Amount: 499,
            Discount: 0,
            RenewDiscount: 0,
            RenewAmount: 4788,
            Plans: [
                {
                    ID: 'Wb4NAqmiuqoA7kCHE28y92bBFfN8jaYQCLxHRAB96yGj-bh9SxguXC48_WSU-fRUjdAr-lx95c6rFLplgXyXYA==',
                    Type: 1,
                    Name: PLANS.MAIL,
                    Title: 'Mail Plus',
                    MaxDomains: 1,
                    MaxAddresses: 10,
                    MaxCalendars: 25,
                    MaxSpace: 16106127360,
                    MaxMembers: 1,
                    MaxVPN: 0,
                    MaxTier: 0,
                    Services: 1,
                    Features: 1,
                    State: 1,
                    Cycle: 12,
                    Currency: 'CHF',
                    Amount: 4788,
                    Quantity: 1,
                    Offer: 'default',
                },
            ],
            Renew: 1,
        };
    });

    it('should add isManagedByMozilla property', () => {
        const result = format(subscription, undefined);
        expect(result.isManagedByMozilla).toBeDefined();
    });

    it('should not add upcoming property if it is not specified', () => {
        const result = format(subscription, undefined);
        expect(result.UpcomingSubscription).not.toBeDefined();
    });

    it('should add upcoming property if it is the second parameter', () => {
        const result = format(subscription, upcoming);
        expect(result.UpcomingSubscription).toBeDefined();
    });
});
