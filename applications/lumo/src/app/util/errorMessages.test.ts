import { getExceededTierErrorTitle } from './errorMessages';

describe('getExceededTierErrorTitle', () => {
    it('names Lite when only the Lite pool is exhausted', () => {
        const title = getExceededTierErrorTitle({ lite: 0, max: 20 }, 'lumo-lite');

        expect(title).toContain('Lumo 2.0 Lite');
        expect(title).not.toContain('Lumo 2.0 Max');
    });

    it('names Max when only the Max pool is exhausted', () => {
        const title = getExceededTierErrorTitle({ lite: 100, max: 0 }, 'lumo-max');

        expect(title).toContain('Lumo 2.0 Max');
        expect(title).not.toContain('Lumo 2.0 Lite');
    });

    it('names Apertus when its shared Lite pool is exhausted', () => {
        const title = getExceededTierErrorTitle({ lite: 0, max: 20 }, 'apertus-15');

        expect(title).toContain('Apertus 1.5');
    });
});
