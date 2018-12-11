import { keys } from '../../../src/helpers/csvFormat';

const DEFAULT_VALUE = 'panda-value';
const DEFAULT_TYPE = 'panda-type';
const DEFAULT_NOTE_VALUE = `
panda
panda
panda
`;

describe('keys.note', () => {
    it('should extract note', () => {
        expect(keys.note({
            notes: DEFAULT_NOTE_VALUE,
            note: DEFAULT_NOTE_VALUE
        })).toEqual([
            { value: DEFAULT_NOTE_VALUE },
            { value: DEFAULT_NOTE_VALUE }
        ]);
    });
});

describe('keys.adr', () => {
    it('should extract adr', () => {
        expect(keys.adr({
            'home address': DEFAULT_VALUE,
            'home address 2': DEFAULT_VALUE,
            'home city': DEFAULT_VALUE,
            'home state': DEFAULT_VALUE,
            'home zipcode': DEFAULT_VALUE,
            'home country': DEFAULT_VALUE,
            'address 1 - formatted': DEFAULT_VALUE,
            'address 1 - type': DEFAULT_TYPE,
            'address 2 - formatted': DEFAULT_VALUE,
            'address 2 - type': DEFAULT_TYPE,
            'address 3 - formatted': DEFAULT_VALUE,
            'address 3 - type': DEFAULT_TYPE
        })).toEqual([
            {
                value: `;${DEFAULT_VALUE};${DEFAULT_VALUE};${DEFAULT_VALUE};${DEFAULT_VALUE};${DEFAULT_VALUE};${DEFAULT_VALUE}`,
                parameter: 'home'
            },
            {
                value: DEFAULT_VALUE,
                parameter: DEFAULT_TYPE
            },
            {
                value: DEFAULT_VALUE,
                parameter: DEFAULT_TYPE
            },
            {
                value: DEFAULT_VALUE,
                parameter: DEFAULT_TYPE
            }
        ]);
    });
});

describe('keys.bday', () => {
    it('should extract bday', () => {
        expect(keys.bday({
            birthday: DEFAULT_VALUE,
            'birth year': DEFAULT_VALUE,
            'birth month': DEFAULT_VALUE,
            'birth day': DEFAULT_VALUE
        })).toEqual([
            { value: DEFAULT_VALUE },
            { value: `${DEFAULT_VALUE}-${DEFAULT_VALUE}-${DEFAULT_VALUE}` }
        ]);
    });
});

describe('keys.email', () => {
    it('should extract email', () => {
        expect(keys.email({
            'e-mail address': DEFAULT_VALUE,
            'e-mail 2 address': DEFAULT_VALUE,
            'e-mail 3 address': DEFAULT_VALUE,
            'email': DEFAULT_VALUE,
            'alternate email 1': DEFAULT_VALUE,
            'alternate email 2': DEFAULT_VALUE,
            'primary email': DEFAULT_VALUE,
            'secondary email': DEFAULT_VALUE,
            'e-mail 1 - value': DEFAULT_VALUE,
            'e-mail 1 - type': DEFAULT_TYPE,
            'e-mail 2 - value': DEFAULT_VALUE,
            'e-mail 2 - type': DEFAULT_TYPE,
            'e-mail 3 - value': DEFAULT_VALUE,
            'e-mail 3 - type': DEFAULT_TYPE
        })).toEqual([
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            {
                value: DEFAULT_VALUE,
                parameter: DEFAULT_TYPE
            },
            {
                value: DEFAULT_VALUE,
                parameter: DEFAULT_TYPE
            },
            {
                value: DEFAULT_VALUE,
                parameter: DEFAULT_TYPE
            }
        ]);
    });
});

describe('keys.fn', () => {
    it('should extract fn', () => {
        expect(keys.fn({
            first: DEFAULT_VALUE,
            name: DEFAULT_VALUE,
            middle: DEFAULT_VALUE,
            last: DEFAULT_VALUE,
            'first name': DEFAULT_VALUE,
            'middle name': DEFAULT_VALUE,
            'last name': DEFAULT_VALUE
        })).toEqual([
            { value: `${DEFAULT_VALUE} ${DEFAULT_VALUE} ${DEFAULT_VALUE} ${DEFAULT_VALUE} ${DEFAULT_VALUE} ${DEFAULT_VALUE} ${DEFAULT_VALUE}` }
        ]);
    });
});

describe('keys.tel', () => {
    it('should extract tel', () => {
        expect(keys.tel({
            'primary phone': DEFAULT_VALUE,
            'other phone': DEFAULT_VALUE,
            'radio phone': DEFAULT_VALUE,
            other: DEFAULT_VALUE,
            'yahoo phone': DEFAULT_VALUE,
            'phone 1 - value': DEFAULT_VALUE,
            'phone 1 - type': DEFAULT_TYPE,
            'phone 2 - value': DEFAULT_VALUE,
            'phone 2 - type': DEFAULT_TYPE,
            'phone 3 - value': DEFAULT_VALUE,
            'phone 3 - type': DEFAULT_TYPE
        })).toEqual([
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            { value: DEFAULT_VALUE },
            {
                value: DEFAULT_VALUE,
                parameter: DEFAULT_TYPE
            },
            {
                value: DEFAULT_VALUE,
                parameter: DEFAULT_TYPE
            },
            {
                value: DEFAULT_VALUE,
                parameter: DEFAULT_TYPE
            }
        ]);
    });
});