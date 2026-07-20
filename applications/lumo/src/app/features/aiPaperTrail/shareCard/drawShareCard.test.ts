import { privacyTypeLabel } from './drawShareCard';

describe('privacyTypeLabel', () => {
    it('maps exposure scores to readable privacy types', () => {
        expect(privacyTypeLabel(80)).toBe('Easy to read');
        expect(privacyTypeLabel(55)).toBe('Somewhat readable');
        expect(privacyTypeLabel(25)).toBe('Hard to read');
    });
});
