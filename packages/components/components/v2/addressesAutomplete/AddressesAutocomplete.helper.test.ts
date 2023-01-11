import { clearValue, splitBySeparator } from './AddressesAutocomplete.helper';

describe('splitBySeparator', () => {
    it('should omit separators present at the beginning and the end', () => {
        const input = ',plus@debye.proton.black, visionary@debye.proton.black; pro@debye.proton.black,';
        const result = splitBySeparator(input);
        expect(result).toEqual(['plus@debye.proton.black', 'visionary@debye.proton.black', 'pro@debye.proton.black']);
    });

    it('should omit empty values', () => {
        const input = 'plus@debye.proton.black, visionary@debye.proton.black, iamblueuser@gmail.com,,';
        const result = splitBySeparator(input);
        expect(result).toEqual(['plus@debye.proton.black', 'visionary@debye.proton.black', 'iamblueuser@gmail.com']);
    });
});

describe('clearValue', () => {
    it('should trim the value', () => {
        const input = ' panda@proton.me ';
        const result = clearValue(input);
        expect(result).toEqual('panda@proton.me');
    });

    it('should remove surrounding chevrons', () => {
        const input = '<panda@proton.me>';
        const result = clearValue(input);
        expect(result).toEqual('panda@proton.me');
    });

    it('should keep chevrons when needed', () => {
        const input = 'Panda <panda@proton.me>';
        const result = clearValue(input);
        expect(result).toEqual('Panda <panda@proton.me>');
    });
});
