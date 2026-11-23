import { formatCredits } from './apiTokenPricing';

describe('formatCredits', () => {
    it('counts credits without a currency', () => {
        expect(formatCredits(25)).toBe('25 credits');
        expect(formatCredits(1)).toBe('1 credit');
        expect(formatCredits(0)).toBe('0 credits');
    });

    it('keeps up to two decimals', () => {
        expect(formatCredits(4.9999659)).toBe('5 credits');
        expect(formatCredits(4.99)).toBe('4.99 credits');
        expect(formatCredits(0.25)).toBe('0.25 credits');
        expect(formatCredits(5.558)).toBe('5.56 credits');
    });

    it('picks singular or plural from the rounded amount', () => {
        expect(formatCredits(0.999)).toBe('1 credit');
        expect(formatCredits(1.001)).toBe('1 credit');
        expect(formatCredits(1.5)).toBe('1.5 credits');
    });

    it('groups thousands', () => {
        expect(formatCredits(12500)).toBe('12,500 credits');
    });
});
