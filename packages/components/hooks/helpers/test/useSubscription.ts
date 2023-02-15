import { getSubscription } from '@proton/shared/lib/api/payments';
import { addApiMock } from '@proton/testing';

export const subscriptionDefaultResponse = {
    Code: 1000,
    Subscription: {
        ID: 'tKBxSXXdM4nTaNiGVfC_jnCpLsyR42iHAYK2WUoOuUX3hwedVDnseP4C_etGetdTjWhXVvwi4jgrhA5YVhn8_A==',
        InvoiceID: 'OA_Au351hvFThNyVvBk0GvbsBLK6N5sAJ5FHTDXGBvucyugf3ToBqirajcUrnMW7Kuen23V2mb-I-rpf9DsQRg==',
        Cycle: 12,
        PeriodStart: 1676033382,
        PeriodEnd: 1707569382,
        CreateTime: 1676033386,
        CouponCode: null,
        Currency: 'CHF',
        Amount: 11988,
        Discount: 0,
        RenewDiscount: 0,
        RenewAmount: 11988,
        Plans: [
            {
                ID: 'vl-JevUsz3GJc18CC1VOs-qDKqoIWlLiUePdrzFc72-BtxBPHBDZM7ayn8CNQ59Sk4XjDbwwBVpdYrPIFtOvIw==',
                ParentMetaPlanID:
                    'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
                Type: 1,
                Name: 'bundle2022',
                Title: 'Proton Unlimited',
                MaxDomains: 3,
                MaxAddresses: 15,
                MaxCalendars: 25,
                MaxSpace: 536870912000,
                MaxMembers: 1,
                MaxVPN: 10,
                MaxTier: 2,
                Services: 7,
                Features: 1,
                State: 1,
                Cycle: 12,
                Currency: 'CHF',
                Amount: 11988,
                Quantity: 1,
            },
        ],
        Renew: 1,
        External: 0,
    },
    UpcomingSubscription: null,
};

export function mockSubscriptionApi(subscription: typeof subscriptionDefaultResponse = subscriptionDefaultResponse) {
    addApiMock(getSubscription().url, () => subscription);
}
