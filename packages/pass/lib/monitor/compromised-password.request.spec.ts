import { CompressionStream, DecompressionStream } from 'node:stream/web';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';

import {
    fetchCompromisedBucket,
    getBucketUrl,
    hashPassword,
    isPasswordCompromised,
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

    describe('fetchCompromisedBucket', () => {
        test('parses `SUFFIX:COUNT` lines into a set of suffixes', async () => {
            const body = await gzipText('AAAA1111:2\nBBBB2222:5\n');
            fetchMock.mockResolvedValue(new Response(body, { status: 200 }));

            const suffixes = await fetchCompromisedBucket(KNOWN_SHA1);
            expect(suffixes).toEqual(new Set(['AAAA1111', 'BBBB2222']));
        });

        test('returns an empty set on 404, instead of throwing', async () => {
            fetchMock.mockResolvedValue(new Response('not found', { status: 404 }));
            const suffixes = await fetchCompromisedBucket(KNOWN_SHA1);
            expect(suffixes).toEqual(new Set());
        });

        test('throws on other non-2xx responses', async () => {
            fetchMock.mockResolvedValue(new Response('error', { status: 500 }));
            await expect(fetchCompromisedBucket(KNOWN_SHA1)).rejects.toThrow();
        });
    });

    describe('isPasswordCompromised', () => {
        beforeAll(async () => setupCryptoProxyForTesting());
        afterAll(async () => releaseCryptoProxy());

        test('returns true when the suffix is present in the bucket', async () => {
            const body = await gzipText(`${KNOWN_SUFFIX}:5\n`);
            fetchMock.mockResolvedValue(new Response(body, { status: 200 }));

            expect(await isPasswordCompromised(KNOWN_PASSWORD)).toBe(true);
        });

        test('returns false when the suffix is absent from the bucket', async () => {
            const body = await gzipText('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:1\n');
            fetchMock.mockResolvedValue(new Response(body, { status: 200 }));

            expect(await isPasswordCompromised(KNOWN_PASSWORD)).toBe(false);
        });
    });
});
