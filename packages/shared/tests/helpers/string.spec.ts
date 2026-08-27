import {
    DEFAULT_TRUNCATE_OMISSION,
    findLongestMatchingIndex,
    getHashCode,
    getInitials,
    removeHTMLComments,
    truncateMore,
    truncatePossiblyQuotedString,
} from '../../lib/helpers/string';

describe('string', () => {
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

        it('should remove emoji', () => {
            expect(getInitials('🐼 Panda')).toEqual('P');
            expect(getInitials('Panda 🐼')).toEqual('P');
            expect(getInitials('🐼 Panda 🐼')).toEqual('P');
        });

        it('should keep only character and number', () => {
            expect(getInitials('22 - Name Mame')).toEqual('2M');
        });

        it('should remove undesired characters', () => {
            expect(getInitials('Thomas Anderson (@neo)')).toEqual('TN');
        });

        it('should work also with email address', () => {
            expect(getInitials('invitation2@pm.gg')).toEqual('I');
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
            expect(truncateMore({ string: 'abc', charsToDisplay: 2, skewEnd: true })).toEqual(
                `${DEFAULT_TRUNCATE_OMISSION}c`
            );
            expect(truncateMore({ string: 'abcde', charsToDisplay: 5, charsToDisplayEnd: 4 })).toEqual('abcde');
            expect(truncateMore({ string: '12345', charsToDisplay: 4, skewEnd: true })).toEqual(
                `1${DEFAULT_TRUNCATE_OMISSION}45`
            );
            expect(truncateMore({ string: '123456789', charsToDisplay: 5 })).toEqual(
                `12${DEFAULT_TRUNCATE_OMISSION}89`
            );
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

    describe('removeHTMLComments', () => {
        it('should remove comments', () => {
            expect(removeHTMLComments('')).toEqual('');
            expect(removeHTMLComments('a')).toEqual('a');
            expect(removeHTMLComments('<!-- a -->')).toEqual('');
            expect(removeHTMLComments('<!-- a -->b')).toEqual('b');
            expect(removeHTMLComments('a<!-- b -->')).toEqual('a');
            expect(removeHTMLComments('a<!-- b -->c')).toEqual('ac');
            expect(removeHTMLComments('a<!-- b -->c<!-- d -->')).toEqual('ac');
            expect(removeHTMLComments('a<!-- b -->c<!-- d -->e')).toEqual('ace');
            expect(removeHTMLComments('a<!-- b -->c<!-- d -->e<!-- f -->')).toEqual('ace');
            expect(removeHTMLComments('a<!-- b -->c<!-- d -->e<!-- f -->g')).toEqual('aceg');
            expect(removeHTMLComments('a<!-- b -->c<!-- d -->e<!-- f -->g<!-- h -->')).toEqual('aceg');
            expect(removeHTMLComments('a<!-- b -->c<!-- d -->e<!-- f -->g<!-- h -->i')).toEqual('acegi');
            expect(removeHTMLComments('<a href="#">a<!-- b -->c<!-- d -->e<!-- f -->g<!-- h --></a>')).toEqual(
                '<a href="#">aceg</a>'
            );
            expect(removeHTMLComments('<a href="#">a<!-- b -->c<!-- d -->e<!-- f -->g<!-- h -->i</a>')).toEqual(
                '<a href="#">acegi</a>'
            );
        });
    });

    describe('getHashCode', () => {
        it('should compute correct value', () => {
            expect(getHashCode('')).toEqual(0);
            expect(getHashCode('hello world')).toEqual(1794106052);
        });
    });
});
