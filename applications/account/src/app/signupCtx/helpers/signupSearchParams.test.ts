import { CYCLE } from '@proton/payments';

import { getCycle, getReferrerName } from './signupSearchParams';

describe('getCycle', () => {
    it('should return undefined for empty search params', () => {
        const searchParams = new URLSearchParams();

        expect(getCycle(searchParams)).toBeUndefined();
    });

    it('should return undefined for empty cycle parameter', () => {
        const key = 'cycle';
        const searchParams = new URLSearchParams(`${key}=`);

        expect(getCycle(searchParams, key)).toBeUndefined();
    });

    it('should return undefined for non-numeric cycle parameter', () => {
        const key = 'cycle';
        const searchParams = new URLSearchParams(`${key}=invalid`);

        expect(getCycle(searchParams, key)).toBeUndefined();
    });

    it('should return undefined for numeric values not in CYCLE enum', () => {
        const key = 'cycle';
        const searchParams = new URLSearchParams(`${key}=999`);

        expect(getCycle(searchParams, key)).toBeUndefined();
    });

    it('should return valid cycle for CYCLE.MONTHLY (1)', () => {
        const key = 'cycle';
        const searchParams = new URLSearchParams(`${key}=1`);

        expect(getCycle(searchParams, key)).toBe(CYCLE.MONTHLY);
    });

    it('should return valid cycle for CYCLE.YEARLY (12)', () => {
        const key = 'cycle';
        const searchParams = new URLSearchParams(`${key}=12`);

        expect(getCycle(searchParams, key)).toBe(CYCLE.YEARLY);
    });

    it('should handle multiple parameters and return the correct one', () => {
        const key = 'cycle';
        const searchParams = new URLSearchParams(`plan=plus&${key}=12&currency=USD`);

        expect(getCycle(searchParams)).toBe(CYCLE.YEARLY);
    });

    describe('default keys to `cycle`, and `billing`', () => {
        it('should check cycle parameter by default', () => {
            const searchParams = new URLSearchParams('cycle=1');

            expect(getCycle(searchParams)).toBe(CYCLE.MONTHLY);
        });

        it('should check billing parameter when cycle is not present', () => {
            const searchParams = new URLSearchParams('billing=12');

            expect(getCycle(searchParams)).toBe(CYCLE.YEARLY);
        });

        it('should prioritize cycle over billing when both are present', () => {
            const searchParams1 = new URLSearchParams('cycle=1&billing=12');
            expect(getCycle(searchParams1)).toBe(CYCLE.MONTHLY);

            const searchParams2 = new URLSearchParams('billing=12&cycle=1');
            expect(getCycle(searchParams2)).toBe(CYCLE.MONTHLY);
        });

        it('should return undefined when neither cycle nor billing have valid values', () => {
            const searchParams = new URLSearchParams('cycle=invalid&billing=999');

            expect(getCycle(searchParams)).toBeUndefined();
        });

        it('should use billing when cycle is empty', () => {
            const searchParams = new URLSearchParams('cycle=&billing=12');

            expect(getCycle(searchParams)).toBe(CYCLE.YEARLY);
        });
    });

    describe('getCycle with multiple keys', () => {
        it('should return undefined when none of the keys have valid values', () => {
            const key1 = 'key1';
            const key2 = 'key2';
            const searchParams = new URLSearchParams(`${key1}=invalid&${key2}=999`);

            expect(getCycle(searchParams, [key1, key2])).toBeUndefined();
        });

        it('should return value from first key that has a valid cycle', () => {
            const key1 = 'key1';
            const key2 = 'key2';

            const searchParams1 = new URLSearchParams(`${key1}=1&${key2}=12`);
            expect(getCycle(searchParams1, [key1, key2])).toBe(CYCLE.MONTHLY);

            const searchParams2 = new URLSearchParams(`${key2}=12&${key1}=1`);
            expect(getCycle(searchParams2, [key1, key2])).toBe(CYCLE.MONTHLY);
        });

        it('should return value from second key when first key is invalid', () => {
            const key1 = 'key1';
            const key2 = 'key2';
            const searchParams = new URLSearchParams(`${key1}=invalid&${key2}=12`);

            expect(getCycle(searchParams, [key1, key2])).toBe(CYCLE.YEARLY);
        });

        it('should return value from second key when first key is missing', () => {
            const key1 = 'key1';
            const key2 = 'key2';
            const searchParams = new URLSearchParams(`${key2}=1`);

            expect(getCycle(searchParams, [key1, key2])).toBe(CYCLE.MONTHLY);
        });

        it('should handle empty string values and continue to next key', () => {
            const key1 = 'key1';
            const key2 = 'key2';
            const searchParams = new URLSearchParams(`${key1}=&${key2}=12`);

            expect(getCycle(searchParams, [key1, key2])).toBe(CYCLE.YEARLY);
        });

        it('should work with single key in array format', () => {
            const key1 = 'key1';
            const searchParams = new URLSearchParams(`${key1}=1`);

            expect(getCycle(searchParams, [key1])).toBe(CYCLE.MONTHLY);
        });
    });
});

describe('getReferrerName', () => {
    it('should return undefined for empty search params', () => {
        const searchParams = new URLSearchParams();

        expect(getReferrerName(searchParams)).toBeUndefined();
    });

    it('should return undefined for empty referrerName parameter', () => {
        const key = 'referrerName';
        const searchParams = new URLSearchParams(`${key}=`);

        expect(getReferrerName(searchParams, key)).toBeUndefined();
    });

    it('should return the referrer name when present', () => {
        const key = 'referrerName';
        const searchParams = new URLSearchParams(`${key}=John Doe`);

        expect(getReferrerName(searchParams, key)).toBe('John Doe');
    });

    it('should handle special characters in referrer name', () => {
        const key = 'referrerName';
        const searchParams = new URLSearchParams(`${key}=John%20Doe`);

        expect(getReferrerName(searchParams, key)).toBe('John Doe');
    });

    it('should handle multiple parameters and return the correct one', () => {
        const key = 'referrerName';
        const searchParams = new URLSearchParams(`plan=plus&${key}=Jane Smith&currency=USD`);

        expect(getReferrerName(searchParams, key)).toBe('Jane Smith');
    });
});
