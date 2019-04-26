import { getDomain } from '../../../src/helpers/url';

const urls = [
    'https://www.npmjs.com/package/extract-domain',
    'http://www.example.com:80/path/to/myfile.html?key1=value1&key2=value2#SomewhereInTheDocument',
    'https://npmjs.com/package/extract-domain',
    'http://example.com:80/path/to/myfile.html?key1=value1&key2=value2#SomewhereInTheDocument',
    'http://www.so.many.sub.domains.example.com:80/path/to/myfile.html?key1=value1&key2=value2#SomewhereInTheDocument',
    'http://user:password@example.com:80/path/to/myfile.html?key1=value1&key2=value2#SomewhereInTheDocument',
    'ftp://example.org/resource.txt',
    'http://www.npmjs.com',
    'http://www.npmjs.com?query=test',
    'http://www.npmjs.com#fragment',
    'this.is.my@email.com',
    'test@something.com'
];

const expected = [
    'npmjs.com',
    'example.com',
    'npmjs.com',
    'example.org',
    'email.com',
    'something.com'
];

describe('getDomain', () => {
    it('should extract given domain from url', () => {
        expect(getDomain(urls[0])).toBe(expected[0]);
        expect(getDomain(urls[1])).toBe(expected[1]);
        expect(getDomain(urls[7])).toBe(expected[0]);
        expect(getDomain(urls[8])).toBe(expected[0]);
        expect(getDomain(urls[10])).toBe(expected[4]);
    });

    it('should return empty string if it is not a url', () => {
        expect(getDomain('/i.am/just.astring//7test')).toBe('');
    });

    it('should throw syntax error exception if the argument is not string nor array', () => {
        try {
            getDomain({});
        } catch (e) {
            expect(e.name).toBe('TypeError');
            expect(e.message).toBe('The given URL is not a string. Please verify your string.');
        }
    });
});
