import { CYCLE } from '@proton/payments';

import { getCycle } from './signupSearchParams';

describe('getCycle', () => {
    it('should return undefined for empty search params', () => {
        const searchParams = new URLSearchParams();
        expect(getCycle(searchParams)).toBeUndefined();
    });

    it('should return undefined for empty cycle parameter', () => {
        const searchParams = new URLSearchParams('cycle=');
        expect(getCycle(searchParams)).toBeUndefined();
    });

    it('should return undefined for non-numeric cycle parameter', () => {
        const searchParams = new URLSearchParams('cycle=invalid');
        expect(getCycle(searchParams)).toBeUndefined();
    });

    it('should return undefined for numeric values not in CYCLE enum', () => {
        const searchParams = new URLSearchParams('cycle=999');
        expect(getCycle(searchParams)).toBeUndefined();
    });

    it('should return valid cycle for CYCLE.MONTHLY (1)', () => {
        const searchParams = new URLSearchParams('cycle=1');
        expect(getCycle(searchParams)).toBe(CYCLE.MONTHLY);
    });

    it('should return valid cycle for CYCLE.YEARLY (12)', () => {
        const searchParams = new URLSearchParams('cycle=12');
        expect(getCycle(searchParams)).toBe(CYCLE.YEARLY);
    });

    it('should use custom key parameter', () => {
        const key = 'customCycleKey';
        const searchParams = new URLSearchParams(`${key}=1`);
        expect(getCycle(searchParams, key)).toBe(CYCLE.MONTHLY);
    });

    it('should handle multiple parameters and return the correct one', () => {
        const searchParams = new URLSearchParams('plan=plus&cycle=12&currency=USD');
        expect(getCycle(searchParams)).toBe(CYCLE.YEARLY);
    });
});
