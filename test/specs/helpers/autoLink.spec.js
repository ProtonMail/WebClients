import autoLink from '../../../src/helpers/autoLink';

const getLink = (nr) => `<a href="tel:${nr}">${nr}</a>`;

describe('autoLink', () => {
    it('should not add a link for non-numbers', () => {
        const string = '123-456-789';
        expect(autoLink(string)).toEqual(string);
    });

    it('should not add a link for attributes', () => {
        const string = 'http://pgp.mit.edu/pks/lookup?search=0x351397973898F9B3';
        expect(autoLink(string)).toEqual(string);
    });

    const runNrTests = (nr) => {
        it('should not add a link for a tags', () => {
            const string = `<a href="">${nr}</a>`;
            expect(autoLink(string)).toEqual(string);
        });

        it('should be idempotent', () => {
            const value = autoLink(autoLink(nr));
            expect(value).toEqual(getLink(nr));
        });

        it('should properly add a link', () => {
            const value = autoLink(nr);
            expect(value).toEqual(getLink(nr));
        });

        it('should add a link for a complicated sentence', () => {
            const input = `hello this is my number ${nr}`;
            const expectation = `hello this is my number ${getLink(nr)}`;
            expect(autoLink(input)).toEqual(expectation);
        });

        it('should add a link for a complicated sentence in the middle', () => {
            const input = `hello this is my number ${nr} great huh`;
            const expectation = `hello this is my number ${getLink(nr)} great huh`;
            expect(autoLink(input)).toEqual(expectation);
        });

        it('should add multiple links for complicated sentences', () => {
            const input = `hello this is my first number ${nr} and this is my 2nd number ${nr} great huh`;
            const expectation = `hello this is my first number ${getLink(nr)} and this is my 2nd number ${getLink(nr)} great huh`;
            expect(autoLink(input)).toEqual(expectation);
        });

        it('should add a link for a complicated sentence with newline', () => {
            const input = `hello\n${nr} great huh`;
            const expectation = `hello\n${getLink(nr)} great huh`;
            expect(autoLink(input)).toEqual(expectation);
        });

        it('should add a link for html', () => {
            const input = `hello <a href="test">this</a> is my number <div>${nr}</div>`;
            const expectation = `hello <a href="test">this</a> is my number <div>${getLink(nr)}</div>`;
            expect(autoLink(input)).toEqual(expectation);
        });
    };

    [
        '123-456-789-1234',
        '0766500065',
        '+33699112233',
        '+41699112233'
    ].forEach(runNrTests);
});

