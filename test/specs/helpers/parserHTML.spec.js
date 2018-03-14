import { toText } from '../../../src/helpers/parserHTML';

describe('toText', () => {
    it('should not escape single underline', () => {
        const string = 'MONO_TLS_PROVIDER';
        expect(toText(string)).toEqual(string);
    });

    it('should not escape multiple underlines', () => {
        const string = '___';
        expect(toText(string)).toEqual(string);
    });
});
