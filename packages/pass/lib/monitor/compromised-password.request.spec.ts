import { CompressionStream, DecompressionStream } from 'node:stream/web';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';

import {
    checkPasswordCompromised,
    fetchCompromisedBucket,
    getBucketUrl,
    getLastChangeTimestamp,
    hashPassword,
} from './compromised-password.request';

/* jsdom test env (`@proton/jest-env`) forwards `fetch`/`ReadableStream`/etc but not
 * `(De)CompressionStream` — same fix `packages/docs-core/jest.setup.js` uses. */
(global as any).CompressionStream = CompressionStream;
(global as any).DecompressionStream = DecompressionStream;

const KNOWN_PASSWORD = 'password';
const KNOWN_SHA1 = '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8';
const KNOWN_SUFFIX = 'E4C9B93F3F0682250B6CF8331B7EE68FD8';

const gzipText = async (text: string): Promise<Uint8Array<ArrayBuffer>> => {
    const bytes = new TextEncoder().encode(text);
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(bytes);
            controller.close();
        },
    }).pipeThrough(new CompressionStream('gzip'));

    return new Uint8Array(await new Response(stream).arrayBuffer());
};

const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();
(global as any).fetch = fetchMock;

describe('compromised-password.request', () => {
    beforeEach(() => fetchMock.mockClear());

    describe('getBucketUrl', () => {
        test('builds the correct bucket URL from a lowercase hash', () => {
            expect(getBucketUrl(KNOWN_SHA1)).toEqual(
                'https://credential-check.protonweb.com/split/sha1/5B/AA/61/5BAA61.gz'
            );
        });

        test('builds the correct bucket URL from an already-uppercase hash', () => {
            expect(getBucketUrl(KNOWN_SHA1.toUpperCase())).toEqual(
                'https://credential-check.protonweb.com/split/sha1/5B/AA/61/5BAA61.gz'
            );
        });
    });

    describe('hashPassword', () => {
        beforeAll(async () => setupCryptoProxyForTesting());
        afterAll(async () => releaseCryptoProxy());

        test('returns the known SHA1 hex digest', async () => {
            const hash = await hashPassword(KNOWN_PASSWORD);
            expect(hash.toLowerCase()).toEqual(KNOWN_SHA1);
        });
    });

    describe('getLastChangeTimestamp', () => {
        test('parses the bare timestamp response body', async () => {
            fetchMock.mockResolvedValue(new Response('1785243616', { status: 200 }));
            expect(await getLastChangeTimestamp()).toEqual(1785243616);
        });

        test('throws on a non-ok response', async () => {
            fetchMock.mockResolvedValue(new Response('error', { status: 500 }));
            await expect(getLastChangeTimestamp()).rejects.toThrow();
        });

        test('throws on a non-numeric response body', async () => {
            fetchMock.mockResolvedValue(new Response('<html>not found</html>', { status: 200 }));
            await expect(getLastChangeTimestamp()).rejects.toThrow();
        });

        test('throws on an empty response body', async () => {
            fetchMock.mockResolvedValue(new Response('', { status: 200 }));
            await expect(getLastChangeTimestamp()).rejects.toThrow();
        });
    });

    describe('fetchCompromisedBucket', () => {
        test('parses `SUFFIX:COUNT` lines and returns the ETag', async () => {
            const body = await gzipText('AAAA1111:2\nBBBB2222:5\n');
            fetchMock.mockResolvedValue(new Response(body, { status: 200, headers: { ETag: '"v1"' } }));

            const result = await fetchCompromisedBucket(KNOWN_SHA1);
            expect(result).toEqual({ status: 'ok', etag: '"v1"', suffixes: new Set(['AAAA1111', 'BBBB2222']) });
        });

        test('sends If-None-Match and Add-Padding when a prior ETag is given', async () => {
            fetchMock.mockResolvedValue(new Response(null, { status: 304 }));
            await fetchCompromisedBucket(KNOWN_SHA1, '"v1"');

            const [, init] = fetchMock.mock.calls[0];
            const headers = new Headers(init?.headers);
            expect(headers.get('If-None-Match')).toEqual('"v1"');
            expect(headers.get('Add-Padding')).toEqual('true');
        });

        test('returns `not-modified` on 304, without touching the body', async () => {
            fetchMock.mockResolvedValue(new Response(null, { status: 304 }));
            const result = await fetchCompromisedBucket(KNOWN_SHA1, '"v1"');
            expect(result).toEqual({ status: 'not-modified' });
        });

        test('returns an empty set on 404, instead of throwing', async () => {
            fetchMock.mockResolvedValue(new Response('not found', { status: 404 }));
            const result = await fetchCompromisedBucket(KNOWN_SHA1);
            expect(result).toEqual({ status: 'ok', etag: '', suffixes: new Set() });
        });

        test('throws on other non-2xx responses', async () => {
            fetchMock.mockResolvedValue(new Response('error', { status: 500 }));
            await expect(fetchCompromisedBucket(KNOWN_SHA1)).rejects.toThrow();
        });
    });

    describe('checkPasswordCompromised', () => {
        beforeAll(async () => setupCryptoProxyForTesting());
        afterAll(async () => releaseCryptoProxy());

        test('returns compromised: true when the suffix is present in the bucket', async () => {
            const body = await gzipText(`${KNOWN_SUFFIX}:5\n`);
            fetchMock.mockResolvedValue(new Response(body, { status: 200, headers: { ETag: '"v1"' } }));

            expect(await checkPasswordCompromised(KNOWN_PASSWORD)).toEqual({
                status: 'checked',
                compromised: true,
                etag: '"v1"',
            });
        });

        test('returns compromised: false when the suffix is absent from the bucket', async () => {
            const body = await gzipText('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:1\n');
            fetchMock.mockResolvedValue(new Response(body, { status: 200, headers: { ETag: '"v1"' } }));

            expect(await checkPasswordCompromised(KNOWN_PASSWORD)).toEqual({
                status: 'checked',
                compromised: false,
                etag: '"v1"',
            });
        });

        test('returns not-modified when the server confirms the prior ETag is still current', async () => {
            fetchMock.mockResolvedValue(new Response(null, { status: 304 }));
            expect(await checkPasswordCompromised(KNOWN_PASSWORD, '"v1"')).toEqual({ status: 'not-modified' });
        });
    });
});
