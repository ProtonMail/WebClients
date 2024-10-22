import { PLANS } from '@proton/payments';
import type { Plan } from '@proton/shared/lib/interfaces';

import { plans, subscriptionBundlePro } from '../__mocks__/data';
import { getUpsellAmountAndSavings } from './getUpsellAmountAndSavings';

const currency = 'CHF';

const upsellPlan: Plan = {
    ID: 'fT-fHNQexHafNYev4Qz49aetYhhjFOJCD8E8GYYOMY6o0U9WwINhnI76D9k7f6WB8_GaMISfd3a_cxe6vEUGxw==',
    ParentMetaPlanID: 'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
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
    Pricing: {
        '1': 499,
        '12': 4788,
        '24': 8376,
    },
    DefaultPricing: {
        '1': 499,
        '12': 4788,
        '24': 8376,
    },
    PeriodEnd: {
        '1': 1731059547,
        '12': 1759917147,
        '24': 1791453147,
    },
    Currency: 'CHF',
    Quantity: 1,
    Offers: [],
    Cycle: 1,
    Amount: 499,
};

describe('getUpsellAmountAndSavings', () => {
    it('given currency, plans, subscription, and upsell plan, should return correct upsell amount and savings', () => {
        const result = getUpsellAmountAndSavings({ currency, plans, subscription: subscriptionBundlePro, upsellPlan });

        expect(result).toEqual([399, '60%']);
    });
});
