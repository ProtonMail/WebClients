import { getFeatureLines } from './features';

describe('getFeatureLines', () => {
    it('returns one feature per line', () => {
        expect(getFeatureLines('2TB of storage\n2 user accounts')).toEqual(['2TB of storage', '2 user accounts']);
    });

    it('trims surrounding whitespace from each feature', () => {
        expect(getFeatureLines('  2TB of storage \t\n 2 user accounts')).toEqual(['2TB of storage', '2 user accounts']);
    });

    it('skips empty and whitespace-only lines', () => {
        expect(getFeatureLines('\n2TB of storage\n\n   \n2 user accounts\n')).toEqual([
            '2TB of storage',
            '2 user accounts',
        ]);
    });

    it('strips the carriage return from CRLF line endings', () => {
        expect(getFeatureLines('2TB of storage\r\n2 user accounts\r\n')).toEqual(['2TB of storage', '2 user accounts']);
    });

    it('returns a single feature for a body with no line breaks', () => {
        expect(getFeatureLines('All premium features')).toEqual(['All premium features']);
    });

    it('returns an empty list for a blank body', () => {
        expect(getFeatureLines('')).toEqual([]);
        expect(getFeatureLines(' \n \n')).toEqual([]);
    });
});
