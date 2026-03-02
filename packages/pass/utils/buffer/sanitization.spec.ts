import {
    sanitizeBuffers,
    sanitizeBuffersB64,
    sanitizeBuffersB64URL,
    uint8ArrayToB64,
    uint8ArrayToB64URL,
} from './sanitization';

const bytes = crypto.getRandomValues(new Uint8Array({ length: 32 }));
const arr = Array.from(bytes);
const b64 = bytes.toBase64();
const b64url = bytes.toBase64({ alphabet: 'base64url', omitPadding: true });

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

describe('sanitizeBuffersB64URL', () => {
    test('should convert typed arrays', () => {
        expect(sanitizeBuffersB64URL(bytes.buffer)).toEqual(b64url);
        expect(sanitizeBuffersB64URL(bytes)).toEqual(b64url);
    });

    test('should handle arrays', () => {
        expect(sanitizeBuffersB64URL([])).toEqual([]);
        expect(sanitizeBuffersB64URL([bytes])).toEqual([b64url]);
        expect(sanitizeBuffersB64URL([[bytes], []])).toEqual([[b64url], []]);
    });

    test('should handle objects', () => {
        expect(sanitizeBuffersB64URL({ array: bytes })).toEqual({ array: b64url });
        expect(sanitizeBuffersB64URL({})).toEqual({});

        const nested = sanitizeBuffersB64URL({ a: { b: { c: { d: bytes } } } });
        expect(nested).toEqual({ a: { b: { c: { d: b64url } } } });
    });

    test('should leave non-byte array values unchanged', () => {
        expect(sanitizeBuffersB64URL('foo')).toEqual('foo');
        expect(sanitizeBuffersB64URL(42)).toEqual(42);
        expect(sanitizeBuffersB64URL(true)).toEqual(true);
    });
});

describe('base64 fallback equivalence', () => {
    const samples = Array.from({ length: 50 }, () => crypto.getRandomValues(new Uint8Array({ length: 32 })));

    test('uint8ArrayToB64 matches Uint8Array.toBase64', () => {
        for (const sample of samples) expect(uint8ArrayToB64(sample)).toEqual(sample.toBase64());
    });

    test('uint8ArrayToB64URL matches Uint8Array.toBase64', () => {
        const alphabet = 'base64url';
        for (const sample of samples) {
            const a = uint8ArrayToB64URL(sample);
            const b = sample.toBase64({ alphabet, omitPadding: true });
            expect(a).toEqual(b);
        }
    });

    test('equivalence holds for edge-case buffer lengths', () => {
        for (let len = 0; len <= 4; len++) {
            const buf = crypto.getRandomValues(new Uint8Array({ length: len }));
            expect(uint8ArrayToB64(buf)).toEqual(buf.toBase64());
            expect(uint8ArrayToB64URL(buf)).toEqual(buf.toBase64({ alphabet: 'base64url', omitPadding: true }));
        }
    });
});
