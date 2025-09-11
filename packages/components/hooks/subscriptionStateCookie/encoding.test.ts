import { CYCLE, PLANS } from '@proton/payments';
import { decodeBase64URL } from '@proton/shared/lib/helpers/encoding';

import { encodeFreeSubscriptionData, encodePaidSubscriptionData } from './encoding';

describe('encodePaidSubscriptionData', () => {
    it('should produce consistent output for same inputs', () => {
        const testCases: { input: { planName: PLANS; cycle: CYCLE }; expected: string }[] = [
            {
                input: { planName: PLANS.MAIL, cycle: CYCLE.MONTHLY },
                expected: 'eyJ0IjoicCIsInAiOiJtYWlsMjAyMiIsImMiOjF9',
            },
            {
                input: { planName: PLANS.MAIL, cycle: CYCLE.YEARLY },
                expected: 'eyJ0IjoicCIsInAiOiJtYWlsMjAyMiIsImMiOjEyfQ',
            },
        ];

        for (const testCase of testCases) {
            const result = encodePaidSubscriptionData(testCase.input);
            expect(result).toEqual(testCase.expected);
        }
    });

    it('should produce different output for different inputs', () => {
        const result1 = encodePaidSubscriptionData({
            planName: PLANS.MAIL,
            cycle: CYCLE.MONTHLY,
        });

        const result2 = encodePaidSubscriptionData({
            planName: PLANS.DRIVE,
            cycle: CYCLE.MONTHLY,
        });

        const result3 = encodePaidSubscriptionData({
            planName: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
        });

        expect(result1).not.toBe(result2);
        expect(result1).not.toBe(result3);
        expect(result2).not.toBe(result3);
    });

    it('should produce valid base64URL encoded strings', () => {
        const result = encodePaidSubscriptionData({
            planName: PLANS.MAIL,
            cycle: CYCLE.MONTHLY,
        });

        // Base64URL should not contain +, /, or = characters
        expect(result).not.toMatch(/[+/=]/);

        // Should be decodable without throwing
        expect(() => decodeBase64URL(result)).not.toThrow();
    });

    it('should always include type "p" for paid subscriptions', () => {
        const result = encodePaidSubscriptionData({
            planName: PLANS.MAIL,
            cycle: CYCLE.MONTHLY,
        });

        const decoded = JSON.parse(decodeBase64URL(result));
        expect(decoded.t).toBe('p');
    });

    it('should create the exact expected data structure', () => {
        const result = encodePaidSubscriptionData({
            planName: PLANS.MAIL,
            cycle: CYCLE.MONTHLY,
        });

        const decoded = JSON.parse(decodeBase64URL(result));

        // Check all required properties exist
        expect(decoded).toHaveProperty('t');
        expect(decoded).toHaveProperty('p');
        expect(decoded).toHaveProperty('c');

        // Check property types
        expect(typeof decoded.t).toBe('string');
        expect(typeof decoded.p).toBe('string');
        expect(typeof decoded.c).toBe('number');

        // Check exact values
        expect(decoded.t).toBe('p');
        expect(decoded.p).toBe(PLANS.MAIL);
        expect(decoded.c).toBe(1);

        // Ensure no extra properties
        expect(Object.keys(decoded)).toEqual(['t', 'p', 'c']);
    });
});

describe('encodeFreeSubscriptionData', () => {
    it('should set h to 1 if hasHadSubscription is true', () => {
        const result = encodeFreeSubscriptionData({
            hasHadSubscription: true,
        });

        const decoded = JSON.parse(decodeBase64URL(result));

        expect(decoded.h).toBe('1');
    });

    it('should set h to 0 if hasHadSubscription is false', () => {
        const result = encodeFreeSubscriptionData({
            hasHadSubscription: false,
        });

        const decoded = JSON.parse(decodeBase64URL(result));

        expect(decoded.h).toBe('0');
    });

    it('should produce valid base64URL encoded strings', () => {
        const result = encodeFreeSubscriptionData({
            hasHadSubscription: true,
        });

        // Base64URL should not contain +, /, or = characters
        expect(result).not.toMatch(/[+/=]/);

        // Should be decodable without throwing
        expect(() => decodeBase64URL(result)).not.toThrow();
    });

    it('should always include type "f" for paid subscriptions', () => {
        const result = encodeFreeSubscriptionData({
            hasHadSubscription: true,
        });

        const decoded = JSON.parse(decodeBase64URL(result));
        expect(decoded.t).toBe('f');
    });

    it('should create the exact expected data structure', () => {
        const result = encodeFreeSubscriptionData({
            hasHadSubscription: true,
        });

        const decoded = JSON.parse(decodeBase64URL(result));

        // Check all required properties exist
        expect(decoded).toHaveProperty('t');
        expect(decoded).toHaveProperty('h');

        // Check property types
        expect(typeof decoded.t).toBe('string');
        expect(typeof decoded.h).toBe('string');

        // Check exact values
        expect(decoded.t).toBe('f');
        expect(decoded.h).toBe('1');

        // Ensure no extra properties
        expect(Object.keys(decoded)).toEqual(['t', 'h']);
    });
});
