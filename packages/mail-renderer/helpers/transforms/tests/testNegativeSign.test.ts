import { startsByANegativeSign } from '../transformStyleAttributes';

describe('startsByANegativeSign', () => {
    it('should return true in these cases', () => {
        const test1 = startsByANegativeSign('-42px');
        expect(test1).toBe(true);

        const test2 = startsByANegativeSign(' -666ex'); // spaces accepted
        expect(test2).toBe(true);

        const test3 = startsByANegativeSign('-0.5pt'); // decimal accepted
        expect(test3).toBe(true);
    });

    it('should return false in these cases', () => {
        const test1 = startsByANegativeSign('100px'); // no negative
        expect(test1).toBe(false);

        const test2 = startsByANegativeSign('--var-name'); // no number
        expect(test2).toBe(false);

        const test3 = startsByANegativeSign('plop -12px'); // -12 not at the beginning
        expect(test3).toBe(false);
    });
});
