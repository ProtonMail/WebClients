import { extractChevrons, htmlEntities, replaceLineBreaks, toUnsignedString, ucFirst } from './string';

describe('toUnsignedString', () => {
    it('should convert integer to unsigned string', () => {
        const value = 1000;
        const result = toUnsignedString(value, 1);

        expect(result).not.toContain('-');
        expect(result.length).toEqual(10);
        expect(result).toEqual('1111101000');
    });
});

describe('ucFirst', () => {
    it('should uppercase the first character in a string', () => {
        const string = 'hello welcome at Proton';
        const expected = 'Hello welcome at Proton';

        expect(ucFirst(string)).toEqual(expected);
    });
});

describe('extractChevrons', () => {
    it('should extract chevrons from string', () => {
        const string1 = '<address@pm.me>';
        const string2 = 'Address <address@pm.me>';
        const string3 = 'no chevrons here';

        expect(extractChevrons(string1)).toEqual('address@pm.me');
        expect(extractChevrons(string2)).toEqual('address@pm.me');
        expect(extractChevrons(string3)).toEqual('');
    });
});

describe('htmlEntities', () => {
    it('should add HTML entities in string', () => {
        const string = 'chevrons=<> and=& quote=" rest should be okay#@!$%^*()_-';
        const expected = 'chevrons=&lt;&gt; and=&amp; quote=&quot; rest should be okay#@!$%^*()_-';

        expect(htmlEntities(string)).toEqual(expected);
    });
});

describe('replaceLineBreaks', () => {
    it('should replace line breaks from string', () => {
        const string = `<div>Hello\nHow\rare\r\nyou?</div>`;
        const expected = `<div>Hello<br />How<br />are<br />you?</div>`;

        expect(replaceLineBreaks(string)).toEqual(expected);
    });
});
