import { listToString } from '../../../src/helpers/arrayHelper';

describe('listToString', async () => {

    it('should handle an empty array', async () => {
        const combined = listToString([ ]);
        expect(combined).toBe('');
    });

    it('should leave a single string alone', async () => {
        const combined = listToString([ 'abcdefghijklmnop' ]);
        expect(combined).toBe('abcdefghijklmnop');
    });

    it('should combine two strings correctly', async() => {
       const combined = listToString(['peppie', 'kokkie']);
       expect(combined).toBe('peppie and kokkie');
    });

    it('should do commas correctly', async () => {
        const combined = listToString(['Rembrandt', 'Vermeer', 'van Gogh', 'Mondriaan']);
        expect(combined).toBe('Rembrandt, Vermeer, van Gogh and Mondriaan');
    });

    it('should handle nesting correctly', async () => {
        const combined = listToString([
                listToString(['Bassie', 'Adriaan'], 'en'),
                listToString(['de Baron', 'B100', 'Vlugge Japie'], 'en')],
            'tegen');
        expect(combined).toBe('Bassie en Adriaan tegen de Baron, B100 en Vlugge Japie');
    });

});
