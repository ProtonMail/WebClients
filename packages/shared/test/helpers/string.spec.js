import { getRandomString } from '../../lib/helpers/string';

describe('string', () => {
    it('should generate a random string of length 16', () => {
        const result = getRandomString(16);
        expect(result).toEqual('ABCDEFGHIJKLMNOP');
    });
});
