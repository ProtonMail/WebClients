import { Logical } from '../Logical';
import { normalizeName } from './normalizeName';

describe('normalizeName', () => {
    it('lowercase and convert # to -', () => {
        expect(normalizeName({ Name: 'DE#96', Tier: 2 } as Logical)).toBe('de-96');
    });
    it('add free if Tier is 0', () => {
        expect(normalizeName({ Name: 'DE#96', Tier: 0 } as Logical)).toBe('de-free-96');
    });
    it('keep free if already in the name', () => {
        expect(normalizeName({ Name: 'DE-FREE#96', Tier: 0 } as Logical)).toBe('de-free-96');
    });
    it('pad with zero if number less than ten', () => {
        expect(normalizeName({ Name: 'DE#6', Tier: 2 } as Logical)).toBe('de-06');
    });
    it('suffix with free non standard names', () => {
        expect(normalizeName({ Name: 'DE#PARTNER', Tier: 0 } as Logical)).toBe('de-partner-free');
    });
    it('empty stay empty whatever the tier', () => {
        expect(normalizeName({ Name: '', Tier: 0 } as Logical)).toBe('');
        expect(normalizeName({ Name: '', Tier: 2 } as Logical)).toBe('');
    });
});
