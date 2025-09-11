import { CYCLE, PLANS } from '@proton/payments';
import { encodeBase64URL } from '@proton/shared/lib/helpers/encoding';

import { decodeSubscriptionCookieData } from './decoding';
import { encodeFreeSubscriptionData, encodePaidSubscriptionData } from './encoding';

describe('decodeSubscriptionCookieData', () => {
    describe('valid paid subscription data', () => {
        it('should decode paid subscription data correctly', () => {
            const testCases = [
                { planName: PLANS.MAIL, cycle: CYCLE.MONTHLY },
                { planName: PLANS.MAIL, cycle: CYCLE.YEARLY },
                { planName: PLANS.DRIVE, cycle: CYCLE.MONTHLY },
                { planName: PLANS.VPN, cycle: CYCLE.YEARLY },
                { planName: PLANS.BUNDLE, cycle: CYCLE.TWO_YEARS },
            ];

            testCases.forEach(({ planName, cycle }) => {
                const encoded = encodePaidSubscriptionData({ planName, cycle });
                const decoded = decodeSubscriptionCookieData(encoded);

                expect(decoded).toEqual({
                    type: 'paid',
                    planName,
                    cycle,
                });
            });
        });

        it('should decode manually created paid subscription data', () => {
            // Manually create encoded data to test specific format
            const rawData = {
                t: 'p' as const,
                p: PLANS.MAIL,
                c: CYCLE.YEARLY,
            };
            const encoded = encodeBase64URL(JSON.stringify(rawData));
            const decoded = decodeSubscriptionCookieData(encoded);

            expect(decoded).toEqual({
                type: 'paid',
                planName: PLANS.MAIL,
                cycle: CYCLE.YEARLY,
            });
        });
    });

    describe('valid free subscription data', () => {
        it('should decode free subscription data without history', () => {
            const originalData = {
                hasHadSubscription: false,
            };

            const encoded = encodeFreeSubscriptionData(originalData);
            const decoded = decodeSubscriptionCookieData(encoded);

            expect(decoded).toEqual({
                type: 'free',
                hasHadSubscription: false,
            });
        });

        it('should decode free subscription data with history', () => {
            const originalData = {
                hasHadSubscription: true,
            };

            const encoded = encodeFreeSubscriptionData(originalData);
            const decoded = decodeSubscriptionCookieData(encoded);

            expect(decoded).toEqual({
                type: 'free',
                hasHadSubscription: true,
            });
        });
    });

    describe('error handling', () => {
        it('should return null for invalid base64URL input', () => {
            const invalidBase64 = 'invalid-base64-string!@#$%';
            const result = decodeSubscriptionCookieData(invalidBase64);
            expect(result).toBeNull();
        });

        it('should return null for non-JSON data', () => {
            const nonJson = encodeBase64URL('not-valid-json');
            const result = decodeSubscriptionCookieData(nonJson);
            expect(result).toBeNull();
        });

        it('should return null for empty string', () => {
            const result = decodeSubscriptionCookieData('');
            expect(result).toBeNull();
        });

        it('should return null for null/undefined encoded data', () => {
            // TypeScript would prevent this, but testing runtime behavior
            const result1 = decodeSubscriptionCookieData(null as any);
            const result2 = decodeSubscriptionCookieData(undefined as any);
            expect(result1).toBeNull();
            expect(result2).toBeNull();
        });
    });

    describe('invalid data structure', () => {
        it('should return null for missing type field', () => {
            const invalidData = { p: PLANS.MAIL, c: CYCLE.MONTHLY };
            const encoded = encodeBase64URL(JSON.stringify(invalidData));
            const result = decodeSubscriptionCookieData(encoded);
            expect(result).toBeNull();
        });

        it('should return null for unknown type', () => {
            const invalidData = { t: 'unknown', p: PLANS.MAIL, c: CYCLE.MONTHLY };
            const encoded = encodeBase64URL(JSON.stringify(invalidData));
            const result = decodeSubscriptionCookieData(encoded);
            expect(result).toBeNull();
        });

        it('should return null for paid data with missing fields', () => {
            // Missing plan
            const missingPlan = { t: 'p', c: CYCLE.MONTHLY };
            const encodedMissingPlan = encodeBase64URL(JSON.stringify(missingPlan));
            expect(decodeSubscriptionCookieData(encodedMissingPlan)).toBeNull();

            // Missing cycle
            const missingCycle = { t: 'p', p: PLANS.MAIL };
            const encodedMissingCycle = encodeBase64URL(JSON.stringify(missingCycle));
            expect(decodeSubscriptionCookieData(encodedMissingCycle)).toBeNull();
        });

        it('should return null for free data with missing fields', () => {
            const missingHistory = { t: 'f' };
            const encoded = encodeBase64URL(JSON.stringify(missingHistory));
            const result = decodeSubscriptionCookieData(encoded);
            expect(result).toBeNull();
        });

        it('should return null for invalid plan names', () => {
            const invalidPlan = { t: 'p', p: 'invalid-plan', c: CYCLE.MONTHLY };
            const encoded = encodeBase64URL(JSON.stringify(invalidPlan));
            const result = decodeSubscriptionCookieData(encoded);
            expect(result).toBeNull();
        });

        it('should return null for invalid cycle values', () => {
            const testCases = [
                { t: 'p', p: PLANS.MAIL, c: 'invalid' },
                { t: 'p', p: PLANS.MAIL, c: 999 },
                { t: 'p', p: PLANS.MAIL, c: -1 },
                { t: 'p', p: PLANS.MAIL, c: null },
                { t: 'p', p: PLANS.MAIL, c: undefined },
            ];

            testCases.forEach((invalidData) => {
                const encoded = encodeBase64URL(JSON.stringify(invalidData));
                const result = decodeSubscriptionCookieData(encoded);
                expect(result).toBeNull();
            });
        });

        it('should return null for invalid subscription history values', () => {
            const testCases = [
                { t: 'f', h: 'invalid' },
                { t: 'f', h: '2' },
                { t: 'f', h: 2 },
                { t: 'f', h: null },
                { t: 'f', h: undefined },
                { t: 'f', h: true },
            ];

            testCases.forEach((invalidData) => {
                const encoded = encodeBase64URL(JSON.stringify(invalidData));
                const result = decodeSubscriptionCookieData(encoded);
                expect(result).toBeNull();
            });
        });

        it('should return null for non-object data', () => {
            const testCases = ['string', 123, true, [], null];

            testCases.forEach((invalidData) => {
                const encoded = encodeBase64URL(JSON.stringify(invalidData));
                const result = decodeSubscriptionCookieData(encoded);
                expect(result).toBeNull();
            });
        });
    });

    describe('edge cases', () => {
        it('should handle extra properties in valid data structures', () => {
            // Paid data with extra properties
            const paidWithExtra = {
                t: 'p' as const,
                p: PLANS.MAIL,
                c: CYCLE.MONTHLY,
                extraProp: 'should-be-ignored',
            };
            const encodedPaid = encodeBase64URL(JSON.stringify(paidWithExtra));
            const decodedPaid = decodeSubscriptionCookieData(encodedPaid);

            expect(decodedPaid).toEqual({
                type: 'paid',
                planName: PLANS.MAIL,
                cycle: CYCLE.MONTHLY,
            });

            // Free data with extra properties
            const freeWithExtra = {
                t: 'f' as const,
                h: '1' as const,
                extraProp: 'should-be-ignored',
            };
            const encodedFree = encodeBase64URL(JSON.stringify(freeWithExtra));
            const decodedFree = decodeSubscriptionCookieData(encodedFree);

            expect(decodedFree).toEqual({
                type: 'free',
                hasHadSubscription: true,
            });
        });

        it('should handle valid cycles', () => {
            const validCycles = [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS];

            validCycles.forEach((cycle) => {
                const data = { t: 'p' as const, p: PLANS.MAIL, c: cycle };
                const encoded = encodeBase64URL(JSON.stringify(data));
                const decoded = decodeSubscriptionCookieData(encoded);

                expect(decoded).toEqual({
                    type: 'paid',
                    planName: PLANS.MAIL,
                    cycle,
                });
            });
        });

        it('should handle all valid plan names', () => {
            const validPlans = Object.values(PLANS);

            validPlans.forEach((planName) => {
                const data = { t: 'p' as const, p: planName, c: CYCLE.MONTHLY };
                const encoded = encodeBase64URL(JSON.stringify(data));
                const decoded = decodeSubscriptionCookieData(encoded);

                expect(decoded).toEqual({
                    type: 'paid',
                    planName,
                    cycle: CYCLE.MONTHLY,
                });
            });
        });
    });
});
