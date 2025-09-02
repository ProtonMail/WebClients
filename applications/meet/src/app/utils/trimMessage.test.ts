import { trimMessage } from './trim-message';

describe('trimMessage', () => {
    it('should trim message', () => {
        const message = '   Hello, world!   ';
        const result = trimMessage(message);
        expect(result).toBe('Hello, world!');
    });
});
