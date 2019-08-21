import { capitalize, getRandomString, getInitial } from '../../lib/helpers/string';

describe('string', () => {
    describe('getRandomString', () => {
        // We mock the random generator so the test itself...
        it('should generate a random string of length 16', () => {
            const result = getRandomString(16);
            expect(result).toEqual('ABCDEFGHIJKLMNOP');
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
});
