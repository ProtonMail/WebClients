import { cleanValue } from '../../../src/helpers/vcard';
import { BOOL_FIELDS } from '../../../src/helpers/vCardFields';

const ADDRESS = ';;Chemin\\; du Pré-Fleuri 3;Plan\\,les\\:Ouates;;1228;CH';
const NAME = 'Yen; Andy;;;';

describe('cleanValue', () => {
    it('shoud parse address', () => {
        expect(cleanValue(ADDRESS, 'adr'))
            .toEqual(['', '', 'Chemin; du Pré-Fleuri 3', 'Plan,les:Ouates', '', '1228', 'CH']);
    });

    it('shoud parse name', () => {
        expect(cleanValue(NAME, 'n'))
            .toEqual(['Yen', ' Andy', '', '', '']);
    });

    it('shoud parse boolean', () => {
        expect(cleanValue('False   ', BOOL_FIELDS[0]))
            .toEqual(false);
    });

    it('should parse string', () => {
        expect(cleanValue('A\\;n\\:dy\\, Yen', 'fn'))
            .toEqual('A;n:dy, Yen');
    });
});
