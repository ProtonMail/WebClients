import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import { PLANS_MAP } from '@proton/testing/data';

import { notHigherThanAvailableOnBackend } from './notHigherThanAvailableOnBackend';

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
