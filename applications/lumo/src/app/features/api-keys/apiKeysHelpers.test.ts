import { getBalanceEstimate, getSpendingLimitSummary, toCurrencyBaseUnits } from './apiKeysHelpers';

describe('toCurrencyBaseUnits', () => {
    it('converts whole credits to cents', () => {
        expect(toCurrencyBaseUnits(15, 'USD')).toBe(1500);
    });

    it('keeps fractional credits', () => {
        expect(toCurrencyBaseUnits(5.558, 'USD')).toBeCloseTo(555.8);
    });

    it('follows the currency decimals', () => {
        expect(toCurrencyBaseUnits(15, 'JPY')).toBe(15);
    });
});

describe('getBalanceEstimate', () => {
    it('counts the whole days the balance lasts at the average daily spend', () => {
        expect(getBalanceEstimate(25, 5)).toBe('About 5 days left at current usage');
        expect(getBalanceEstimate(29, 5)).toBe('About 5 days left at current usage');
    });

    it('warns when less than a day is left', () => {
        expect(getBalanceEstimate(4, 5)).toBe('Less than one day left at current usage');
    });

    it('has no estimate without spend', () => {
        expect(getBalanceEstimate(25, 0)).toBe('Usage estimate unavailable');
    });
});

describe('getSpendingLimitSummary', () => {
    it('says there is no limit when it is off, even above the amount', () => {
        expect(getSpendingLimitSummary(300, { enabled: false, limit: 250 }, 'USD')).toEqual({
            isOverLimit: false,
            text: 'No monthly spending limit',
        });
    });

    it('shows the spend against the limit', () => {
        expect(getSpendingLimitSummary(147.37, { enabled: true, limit: 250 }, 'USD')).toEqual({
            isOverLimit: false,
            text: 'Monthly spending limit: $147.37 of $250.00 used (59%)',
        });
    });

    it('pauses requests once the limit is reached', () => {
        expect(getSpendingLimitSummary(250, { enabled: true, limit: 250 }, 'USD')).toEqual({
            isOverLimit: true,
            text: 'Monthly spending limit reached. API requests are paused until next month.',
        });
    });
});
