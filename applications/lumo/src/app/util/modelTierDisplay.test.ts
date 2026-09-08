import { getModelDisplayName } from './modelTierDisplay';

describe('getModelDisplayName', () => {
    it('returns full tier labels by default', () => {
        expect(getModelDisplayName('lumo-max')).toBe('Lumo 2.0 Max');
        expect(getModelDisplayName('lumo-lite')).toBe('Lumo 2.0 Lite');
        expect(getModelDisplayName('apertus-15')).toBe('Apertus 1.5');
    });

    it('supports compact lite and apertus flag labels', () => {
        expect(getModelDisplayName('lumo-lite', { liteLabel: 'short' })).toBe('Lumo Lite');
        expect(getModelDisplayName('apertus-15', { withFlag: true })).toBe('Apertus 1.5 🇨🇭');
    });
});
