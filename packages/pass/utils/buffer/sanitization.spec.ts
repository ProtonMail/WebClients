import { sanitizeBuffers } from './sanitization';

const byteArray = crypto.getRandomValues(new Uint8Array({ length: 32 }));
const base64 = byteArray.toBase64();

describe('sanitizeBuffers', () => {
    test('should convert typed arrays', () => {
        expect(sanitizeBuffers(byteArray.buffer)).toEqual(base64);
        expect(sanitizeBuffers(byteArray)).toEqual(base64);
    });

    test('should handle arrays', () => {
        expect(sanitizeBuffers([])).toEqual([]);
        expect(sanitizeBuffers([byteArray])).toEqual([base64]);
        expect(sanitizeBuffers([[byteArray], []])).toEqual([[base64], []]);
    });

    test('should handle objects', () => {
        expect(sanitizeBuffers({ array: byteArray })).toEqual({ array: base64 });
        expect(sanitizeBuffers({})).toEqual({});

        const nested = sanitizeBuffers({ a: { b: { c: { d: byteArray } } } });
        expect(nested).toEqual({ a: { b: { c: { d: base64 } } } });
    });

    test('should leave non-byte array values unchanged', () => {
        expect(sanitizeBuffers('foo')).toEqual('foo');
        expect(sanitizeBuffers(42)).toEqual(42);
        expect(sanitizeBuffers(true)).toEqual(true);
    });
});
