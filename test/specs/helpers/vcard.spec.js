import { cleanValue, orderByPref } from '../../../src/helpers/vcard';
import { BOOL_FIELDS } from '../../../src/helpers/vCardFields';

const ADDRESS = ';;Chemin\\; du Pré-Fleuri 3;Plan\\,les\\:Ouates;;1228;CH';
const NAME = 'Yen; Andy;;;';
const PROPERTY1 = new vCard.Property('email', 'riri@pm.me', { pref: 2 });
const PROPERTY2 = new vCard.Property('email', 'fifi@pm.me', { pref: '10' });
const PROPERTY3 = new vCard.Property('email', 'loulou@pm.me');
const PROPERTIES = [PROPERTY1, PROPERTY3, PROPERTY2];
const PROPERTIES_ORDERED = [PROPERTY1, PROPERTY2, PROPERTY3];

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

describe('orderByPref', () => {
    it('should order properties properly', () => {
        expect(orderByPref(PROPERTIES))
            .toEqual(PROPERTIES_ORDERED);
    });
});
