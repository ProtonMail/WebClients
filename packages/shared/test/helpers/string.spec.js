import { getRandomString } from '../../lib/helpers/string';

describe('string', () => {
    // We mock the random generator so the test itself...
    it('should generate a random string of length 16', () => {
        const result = getRandomString(16);
        expect(result).toEqual('ABCDEFGHIJKLMNOP');
    });
});
