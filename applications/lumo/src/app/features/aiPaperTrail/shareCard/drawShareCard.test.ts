import { privacyTypeLabel } from '../reportTypes';

describe('privacyTypeLabel', () => {
    it('maps exposure scores to canonical privacy types', () => {
        expect(privacyTypeLabel(0)).toBe('Privacy maxxing');
        expect(privacyTypeLabel(20)).toBe('Privacy maxxing');
        expect(privacyTypeLabel(21)).toBe('Hard to read');
        expect(privacyTypeLabel(40)).toBe('Hard to read');
        expect(privacyTypeLabel(41)).toBe('Leaving receipts');
        expect(privacyTypeLabel(60)).toBe('Leaving receipts');
        expect(privacyTypeLabel(61)).toBe('Easy to profile');
        expect(privacyTypeLabel(80)).toBe('Easy to profile');
        expect(privacyTypeLabel(81)).toBe('Digital oversharing');
        expect(privacyTypeLabel(100)).toBe('Digital oversharing');
    });
});
