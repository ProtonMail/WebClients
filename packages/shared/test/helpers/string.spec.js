import { capitalize, getRandomString, getInitial, findLongestMatchingIndex, truncate } from '../../lib/helpers/string';

describe('string', () => {
    describe('getRandomString', () => {
        // We mock the random generator so the test itself...
        it('should generate a random string of length 16', () => {
            const result = getRandomString(16);
            expect(result).toEqual('ABCDEFGHIJKLMNOP');
        });
    });

    describe('longest match', () => {
        it('should get the longest matching string', () => {
            const x = ['14:00', '14:30'];
            expect(findLongestMatchingIndex(x, '14')).toBe(0);
            expect(findLongestMatchingIndex(x, '14:35')).toBe(1);
            expect(findLongestMatchingIndex(x, '14:30')).toBe(1);
            expect(findLongestMatchingIndex(x, '13:35')).toBe(0);
            expect(findLongestMatchingIndex(x, '23:35')).toBe(-1);
            expect(findLongestMatchingIndex()).toBe(-1);
        });
    });

    describe('capitalize', () => {
        it('should return empty string for non-string arguments', () => {
            const cases = [0, [], {}];
            const expected = ['', '', ''];
            expect(cases.map(capitalize)).toEqual(expected);
        });
        it('should capitalize strings as expected', () => {
            const cases = ['', 'n', 'A', 'NY', 'name', 'once upon a time...'];
            const expected = ['', 'N', 'A', 'NY', 'Name', 'Once upon a time...'];
            expect(cases.map(capitalize)).toEqual(expected);
        });
    });

    describe('getInitial', () => {
        it('should handle empty parameter', () => {
            expect(getInitial()).toEqual('');
        });

        it('should handle uniq word', () => {
            expect(getInitial('熊猫')).toEqual('熊');
        });

        it('should return 2 first initials and capitalize it', () => {
            expect(getInitial('Lorem ipsum dolor sit amet')).toEqual('LI');
        });

        it('should handle emoji', () => {
            expect(getInitial('🐼')).toEqual('🐼');
        });
    });

    describe('truncate', () => {
        it('should truncate', () => {
            expect(truncate('', 1)).toEqual('');
            expect(truncate('a', 1)).toEqual('a');
            expect(truncate('ab', 1)).toEqual('...');
            expect(truncate('abc', 1)).toEqual('...');
            expect(truncate('abc', 3)).toEqual('abc');
            expect(truncate('abcd', 3)).toEqual('...');
            expect(truncate('abcd', 4)).toEqual('abcd');
            expect(truncate('abcde', 4)).toEqual('a...');
            expect(truncate('abcde', 8)).toEqual('abcde');
        });
    });
});
