import {
    capitalize,
    getRandomString,
    findLongestMatchingIndex,
    truncate,
    truncateMore,
    getInitials,
    truncatePossiblyQuotedString,
    DEFAULT_TRUNCATE_OMISSION,
} from '../../lib/helpers/string';

describe('string', () => {
    describe('getRandomString', () => {
        // We mock the random generator so the test itself…
        it('should generate a random string of length 16', () => {
            const result = getRandomString(16);
            expect(result).toEqual(jasmine.any(String));
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
            const cases = ['', 'n', 'A', 'NY', 'name', 'once upon a time…'];
            const expected = ['', 'N', 'A', 'NY', 'Name', 'Once upon a time…'];
            expect(cases.map(capitalize)).toEqual(expected);
        });
    });

    describe('getInitials', () => {
        it('should handle empty parameter', () => {
            expect(getInitials()).toEqual('?');
        });

        it('should handle single character', () => {
            expect(getInitials('q')).toEqual('Q');
        });

        it('should handle unique word', () => {
            expect(getInitials('熊猫')).toEqual('熊');
        });

        it('should return 2 first initials and capitalize it', () => {
            expect(getInitials('Lorem ipsum dolor sit amet')).toEqual('LA');
        });

        it('should handle emoji', () => {
            expect(getInitials('🐼 Dog')).toEqual('🐼D');
        });

        it('should keep only character and number', () => {
            expect(getInitials('22 - Name Mame')).toEqual('2M');
        });

        it('should remove undesired characters', () => {
            expect(getInitials('Thomas Anderson (@neo)')).toEqual('TA');
        });
    });

    describe('truncate', () => {
        it('should truncate', () => {
            expect(truncate('', 1)).toEqual('');
            expect(truncate('a', 1)).toEqual('a');
            expect(truncate('ab', 1)).toEqual(DEFAULT_TRUNCATE_OMISSION);
            expect(truncate('abc', 1)).toEqual(DEFAULT_TRUNCATE_OMISSION);
            expect(truncate('abc', 3)).toEqual('abc');
            expect(truncate('abcd', 3)).toEqual(`ab${DEFAULT_TRUNCATE_OMISSION}`);
            expect(truncate('abcd', 4)).toEqual('abcd');
            expect(truncate('abcde', 4)).toEqual(`abc${DEFAULT_TRUNCATE_OMISSION}`);
            expect(truncate('abcde', 8)).toEqual('abcde');
        });
    });

    describe('truncateMore', () => {
        it('should truncate', () => {
            expect(truncateMore({ string: '', charsToDisplayStart: 1 })).toEqual('');
            expect(truncateMore({ string: 'a', charsToDisplayStart: 1 })).toEqual('a');
            expect(truncateMore({ string: 'ab', charsToDisplayStart: 1 })).toEqual('ab');
            expect(truncateMore({ string: 'abc', charsToDisplayStart: 4 })).toEqual('abc');
            expect(truncateMore({ string: 'abcd', charsToDisplayStart: 1 })).toEqual(`a${DEFAULT_TRUNCATE_OMISSION}`);
            expect(truncateMore({ string: 'abcde', charsToDisplayStart: 1 })).toEqual(`a${DEFAULT_TRUNCATE_OMISSION}`);
            expect(truncateMore({ string: '', charsToDisplayEnd: 1 })).toEqual('');
            expect(truncateMore({ string: 'a', charsToDisplayEnd: 1 })).toEqual('a');
            expect(truncateMore({ string: 'ab', charsToDisplayEnd: 1 })).toEqual('ab');
            expect(truncateMore({ string: 'abc', charsToDisplayEnd: 4 })).toEqual('abc');
            expect(truncateMore({ string: 'abcd', charsToDisplayEnd: 1 })).toEqual(`${DEFAULT_TRUNCATE_OMISSION}d`);
            expect(truncateMore({ string: 'abcde', charsToDisplayEnd: 1 })).toEqual(`${DEFAULT_TRUNCATE_OMISSION}e`);
            expect(truncateMore({ string: '12345', charsToDisplayStart: 2, charsToDisplayEnd: 2 })).toEqual('12345');
            expect(truncateMore({ string: '123456789', charsToDisplayStart: 2, charsToDisplayEnd: 3 })).toEqual(
                '12…789'
            );
        });

        it('should truncate in the middle', () => {
            expect(truncateMore({ string: '', charsToDisplay: 1 })).toEqual('');
            expect(truncateMore({ string: 'a', charsToDisplay: 1 })).toEqual('a');
            expect(truncateMore({ string: 'ab', charsToDisplay: 1 })).toEqual(DEFAULT_TRUNCATE_OMISSION);
            expect(truncateMore({ string: 'ab', charsToDisplay: 2 })).toEqual('ab');
            expect(truncateMore({ string: 'abc', charsToDisplay: 4, charsToDisplayStart: 1 })).toEqual('abc');
            expect(truncateMore({ string: 'abc', charsToDisplay: 2 })).toEqual(`a${DEFAULT_TRUNCATE_OMISSION}`);
            expect(truncateMore({ string: 'abc', charsToDisplay: 2, skewEnd: true })).toEqual(`${DEFAULT_TRUNCATE_OMISSION}c`);
            expect(truncateMore({ string: 'abcde', charsToDisplay: 5, charsToDisplayEnd: 4 })).toEqual('abcde');
            expect(truncateMore({ string: '12345', charsToDisplay: 4, skewEnd: true })).toEqual(`1${DEFAULT_TRUNCATE_OMISSION}45`);
            expect(truncateMore({ string: '123456789', charsToDisplay: 5 })).toEqual(`12${DEFAULT_TRUNCATE_OMISSION}89`);
        });
    });

    describe('truncatePossiblyQuotedString', () => {
        it('should truncate', () => {
            expect(truncatePossiblyQuotedString('', 1)).toEqual('');
            expect(truncatePossiblyQuotedString('a', 1)).toEqual('a');
            expect(truncatePossiblyQuotedString('ab', 1)).toEqual(DEFAULT_TRUNCATE_OMISSION);
            expect(truncatePossiblyQuotedString('abc', 4)).toEqual('abc');
            expect(truncatePossiblyQuotedString('"abc"', 4)).toEqual(`"a${DEFAULT_TRUNCATE_OMISSION}"`);
            expect(truncatePossiblyQuotedString('abcd', 3)).toEqual(`a${DEFAULT_TRUNCATE_OMISSION}d`);
            expect(truncatePossiblyQuotedString('abcde', 4)).toEqual(`ab${DEFAULT_TRUNCATE_OMISSION}e`);
            expect(truncatePossiblyQuotedString('"abcde"', 4)).toEqual(`"a${DEFAULT_TRUNCATE_OMISSION}"`);

        });
    });
});
