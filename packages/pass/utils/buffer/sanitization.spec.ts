import { sanitizeBuffers, sanitizeBuffersB64 } from './sanitization';

const bytes = crypto.getRandomValues(new Uint8Array({ length: 32 }));
const arr = Array.from(bytes);
const b64 = bytes.toBase64();

describe('sanitizeBuffersB64', () => {
    test('should convert typed arrays', () => {
        expect(sanitizeBuffersB64(bytes.buffer)).toEqual(b64);
        expect(sanitizeBuffersB64(bytes)).toEqual(b64);
    });

    test('should handle arrays', () => {
        expect(sanitizeBuffersB64([])).toEqual([]);
        expect(sanitizeBuffersB64([bytes])).toEqual([b64]);
        expect(sanitizeBuffersB64([[bytes], []])).toEqual([[b64], []]);
    });

    test('should handle objects', () => {
        expect(sanitizeBuffersB64({ array: bytes })).toEqual({ array: b64 });
        expect(sanitizeBuffersB64({})).toEqual({});

        const nested = sanitizeBuffersB64({ a: { b: { c: { d: bytes } } } });
        expect(nested).toEqual({ a: { b: { c: { d: b64 } } } });
    });

    test('should leave non-byte array values unchanged', () => {
        expect(sanitizeBuffersB64('foo')).toEqual('foo');
        expect(sanitizeBuffersB64(42)).toEqual(42);
        expect(sanitizeBuffersB64(true)).toEqual(true);
    });
});

describe('sanitizeBuffers', () => {
    test('should convert typed arrays', () => {
        expect(sanitizeBuffers(bytes.buffer)).toEqual(arr);
        expect(sanitizeBuffers(bytes)).toEqual(arr);
    });

    test('should handle arrays', () => {
        expect(sanitizeBuffers([])).toEqual([]);
        expect(sanitizeBuffers([bytes])).toEqual([arr]);
        expect(sanitizeBuffers([[bytes], []])).toEqual([[arr], []]);
    });

    test('should handle objects', () => {
        expect(sanitizeBuffers({ array: bytes })).toEqual({ array: arr });
        expect(sanitizeBuffers({})).toEqual({});

        const nested = sanitizeBuffers({ a: { b: { c: { d: bytes } } } });
        expect(nested).toEqual({ a: { b: { c: { d: arr } } } });
    });

    test('should leave non-byte array values unchanged', () => {
        expect(sanitizeBuffers('foo')).toEqual('foo');
        expect(sanitizeBuffers(42)).toEqual(42);
        expect(sanitizeBuffers(true)).toEqual(true);
    });
});
