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
    const autoTopUp = { enabled: true, amount: 50 };

    it('has no summary while automatic top-up is off', () => {
        expect(
            getSpendingLimitSummary(0, { ...autoTopUp, enabled: false }, { enabled: true, limit: 250 }, 'USD')
        ).toBeUndefined();
    });

    it('says automatic top-ups have no limit when it is off', () => {
        expect(getSpendingLimitSummary(300, autoTopUp, { enabled: false, limit: 250 }, 'USD')).toEqual({
            isLimitReached: false,
            text: 'No monthly limit on automatic top-ups',
        });
    });

    it('shows the credits bought automatically against the limit', () => {
        expect(getSpendingLimitSummary(150, autoTopUp, { enabled: true, limit: 250 }, 'USD')).toEqual({
            isLimitReached: false,
            text: 'Monthly spending limit: $150.00 of $250.00 bought automatically (60%)',
        });
    });

    it('counts the limit as reached once the next top-up would exceed it', () => {
        expect(getSpendingLimitSummary(201, autoTopUp, { enabled: true, limit: 250 }, 'USD')).toEqual({
            isLimitReached: true,
            text: 'Monthly spending limit reached. Automatic top-ups are paused until next month.',
        });
    });

    it('allows a last top-up that lands exactly on the limit', () => {
        expect(getSpendingLimitSummary(200, autoTopUp, { enabled: true, limit: 250 }, 'USD')?.isLimitReached).toBe(
            false
        );
    });
});
