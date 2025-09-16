import { PLANS } from '@proton/payments';

import shouldShowMail from './shouldShowMail';

describe('shouldShowMail', () => {
    describe('plan combinations', () => {
        const dataSet = [
            // Mail plans should return true
            {
                plan: PLANS.MAIL_BUSINESS,
                expected: true,
            },
            {
                plan: PLANS.BUNDLE_PRO_2024,
                expected: true,
            },
            {
                plan: PLANS.VISIONARY,
                expected: true,
            },
            // Non-mail plans should return false
            {
                plan: PLANS.FREE,
                expected: false,
            },
            {
                plan: PLANS.VPN_BUSINESS,
                expected: false,
            },
            {
                plan: PLANS.PASS_PRO,
                expected: false,
            },
            // Undefined plan should return true
            {
                plan: undefined,
                expected: true,
            },
        ];

        it.each(dataSet)('returns $expected for plan=$plan', ({ plan, expected }) => {
            const result = shouldShowMail(plan);

            expect(result).toBe(expected);
        });
    });
});
