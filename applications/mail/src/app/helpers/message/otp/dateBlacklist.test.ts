import { dateBlacklist } from './dateBlacklist';

describe('dateBlacklist', () => {
    // 2026-05-29 UTC
    const timestamp = Date.UTC(2026, 4, 29) / 1000;

    it('includes common date permutations of the send date', () => {
        const set = dateBlacklist(timestamp);
        expect(set.has('20260529')).toBe(true); // YYYYMMDD
        expect(set.has('29052026')).toBe(true); // DDMMYYYY
        expect(set.has('05292026')).toBe(true); // MMDDYYYY
        expect(set.has('2026')).toBe(true); // bare year
        expect(set.has('0529')).toBe(true); // MMDD
        expect(set.has('2905')).toBe(true); // DDMM
    });

    it('does not include an unrelated candidate', () => {
        expect(dateBlacklist(timestamp).has('123456')).toBe(false);
    });

    it('drops permutations shorter than 4 digits', () => {
        // "5" + "29" => "529" (len 3) is generated but filtered out by the length bound.
        expect(dateBlacklist(timestamp).has('529')).toBe(false);
    });

    it('derives the date in UTC', () => {
        // Midnight UTC on 2026-01-01 — the UTC calendar day, not a local-time shift.
        const set = dateBlacklist(Date.UTC(2026, 0, 1) / 1000);
        expect(set.has('20260101')).toBe(true);
    });

    it('returns an empty set for a zero timestamp', () => {
        expect(dateBlacklist(0).size).toBe(0);
    });

    it('returns an empty set for non-finite timestamps', () => {
        expect(dateBlacklist(NaN).size).toBe(0);
        expect(dateBlacklist(Infinity).size).toBe(0);
    });
});
