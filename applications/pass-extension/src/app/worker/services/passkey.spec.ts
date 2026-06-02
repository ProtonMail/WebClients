import type { WasmGeneratePasskeyResponse } from '@protontech/pass-rust-core/worker';
import { WorkerContext } from 'proton-pass-extension/app/worker/context/inject';

import { createPassCoreProxy } from '@proton/pass/lib/core/core.proxy';
import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import type { ItemBuilder } from '@proton/pass/lib/items/item.builder';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { sanitizePasskey } from '@proton/pass/lib/passkeys/utils';
import { sanitizeBuffers } from '@proton/pass/utils/buffer/sanitization';

import { assertValidPasskeyRequest, createPasskeyService } from './passkey';

jest.mock('@proton/pass/lib/core/core.proxy');

const TEST_RP_ID = 'proton.test';
const TEST_CONFIG = { APP_NAME: 'proton-pass-extension', APP_VERSION: '0.0.1' } as any;
const FETCH_OPTIONS = { credentials: 'omit', referrerPolicy: 'no-referrer' };

const createPublicKeyCredentialOptions = (rpId: string, username = 'alice') => ({
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rp: { name: 'Proton Test', id: rpId },
    user: {
        id: new TextEncoder().encode(username),
        name: username,
        displayName: username,
    },
    pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
    ],
    authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: false,
    },
    timeout: 60_000,
    attestation: 'none',
});

const createPublicKeyRequestOptions = (rpId: string, credentialId: number[]) => ({
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    allowCredentials: [{ id: new Uint8Array(credentialId), type: 'public-key' }],
    timeout: 60_000,
    userVerification: 'preferred',
    rpId,
});

type RegisterOptions = { rpId: string; origin?: string; username?: string };
type RegisteredPasskey = {
    item: ItemBuilder<'login'>;
    response: WasmGeneratePasskeyResponse;
    blob: Uint8Array<ArrayBuffer>;
};

const registerTestPasskey = async (
    core: PassCoreProxy,
    { rpId, origin = `https://${rpId}`, username = 'alice' }: RegisterOptions
): Promise<RegisteredPasskey> => {
    const options = createPublicKeyCredentialOptions(rpId, username);
    const request = JSON.stringify(sanitizeBuffers(options));
    const response = await core.generate_passkey(origin, request, true);

    const passkey = sanitizePasskey(response, TEST_CONFIG);
    const item = itemBuilder('login');
    item.get('content').set('passkeys', [passkey]);

    return { item, response, blob: new Uint8Array(response.passkey) };
};

const authenticate = (
    core: PassCoreProxy,
    origin: string,
    blob: Uint8Array<ArrayBuffer>,
    options: ReturnType<typeof createPublicKeyRequestOptions>
) => core.resolve_passkey_challenge(origin, blob, JSON.stringify(sanitizeBuffers(options)), true);

const fetchResponse = (url: string, json: unknown, status = 200) =>
    ({ ok: status === 200, status, url, json: async () => json }) as unknown as Response;

const badJson = async () => {
    throw new SyntaxError('Unexpected token');
};

describe('assertValidPasskeyRequest', () => {
    test('should throw error when domain is not defined', () => {
        const hostname = undefined;
        const tabUrl = new URL('https://example.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: no domain');
    });

    test('should throw error when sender URL is missing', () => {
        const hostname = 'example.com';
        const tabUrl = undefined;
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: unknown sender');
    });

    test('should throw error when domain does not match sender hostname', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('https://malicious.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: domain mistmatch');
    });

    test('should throw error for subdomain mismatch', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('https://sub.example.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: domain mistmatch');
    });

    test('should pass for valid domain and matching sender URL', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('https://example.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should pass for subdomains when they match exactly', () => {
        const hostname = 'sub.example.com';
        const tabUrl = new URL('https://sub.example.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should throw for http protocol on non-localhost', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('http://example.com/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: insecure protocol');
    });

    test('should pass if port in URL correctly', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('https://example.com:8080/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should allow http for localhost', () => {
        const hostname = 'localhost';
        const tabUrl = new URL('http://localhost/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should allow http for localhost with port', () => {
        const hostname = 'localhost';
        const tabUrl = new URL('http://localhost:8000/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should allow https for localhost', () => {
        const hostname = 'localhost';
        const tabUrl = new URL('https://localhost/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).not.toThrow();
    });

    test('should reject http for 127.0.0.1 (not localhost hostname)', () => {
        const hostname = '127.0.0.1';
        const tabUrl = new URL('http://127.0.0.1/path');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow('Invalid request: insecure protocol');
    });

    test('should reject other protocols', () => {
        const hostname = 'example.com';
        const tabUrl = new URL('data:text/html,<html>test</html>');
        expect(() => assertValidPasskeyRequest(hostname, tabUrl)).toThrow();
    });
});

describe('PasskeyService [WASM]', () => {
    let core: PassCoreProxy;
    let registerWebAuthnFetcher: jest.Mock;
    let fetchSpy: jest.SpyInstance;

    beforeAll(async () => {
        /** The wasm namespace export is frozen: `jest.spyOn` cannot redefine its
         * properties. Wrap it in a Proxy in order to register the spy. */
        const coreProxy = createPassCoreProxy({} as any);
        registerWebAuthnFetcher = jest.fn((fn) => coreProxy.register_webauthn_fetcher(fn));

        core = new Proxy(coreProxy, {
            get: (target, prop) => {
                if (prop === 'register_webauthn_fetcher') return registerWebAuthnFetcher;
                return target[prop as keyof PassCoreProxy];
            },
        });

        WorkerContext.set({ service: { core } } as any);
        await createPasskeyService().init();

        /** One spy for the whole suite. `afterEach` resets implementation +
         * call history; `afterAll` restores the original `fetch`. */
        fetchSpy = jest.spyOn(globalThis, 'fetch');
    });

    afterAll(() => {
        WorkerContext.clear();
        fetchSpy.mockRestore();
    });

    afterEach(() => {
        fetchSpy.mockReset();
    });

    test('`init` registers the webauthn fetcher with the rust core', () => {
        expect(registerWebAuthnFetcher).toHaveBeenCalledTimes(1);
        expect(registerWebAuthnFetcher).toHaveBeenCalledWith(expect.any(Function));
    });

    test('`generate_passkey` returns a valid response', async () => {
        const { item, response } = await registerTestPasskey(core, { rpId: TEST_RP_ID });
        const data = item.data;

        expect(response).toMatchObject({
            rp_id: TEST_RP_ID,
            rp_name: 'Proton Test',
            user_name: 'alice',
            user_display_name: 'alice',
        });

        expect(data.content.passkeys).toHaveLength(1);
        expect(data.content.passkeys[0]).toMatchObject({
            rpId: TEST_RP_ID,
            rpName: 'Proton Test',
            userName: 'alice',
        });
    });

    /** When the RPID is the origin's effective domain or a registrable suffix of it,
     * the rust lib must allow the operation without checking `.well-known/webauthn`. */
    describe('same-origin RPID: no `.well-known` fetch', () => {
        const RPID = 'proton.test';
        const REGISTER_ORIGIN = 'https://app.proton.test';

        let blob: Uint8Array<ArrayBuffer>;
        let response: WasmGeneratePasskeyResponse;

        beforeAll(async () => {
            const registered = await registerTestPasskey(core, { rpId: RPID, origin: REGISTER_ORIGIN });
            blob = registered.blob;
            response = registered.response;
        });

        test.each([
            ['https://proton.test', 'apex'],
            ['https://app.proton.test', 'single-level subdomain'],
            ['https://deep.app.proton.test', 'multi-level subdomain'],
        ])('registers from %s (%s)', async (origin) => {
            await expect(registerTestPasskey(core, { rpId: RPID, origin })).resolves.toBeDefined();
            expect(fetchSpy).not.toHaveBeenCalled();
        });

        test.each([
            [`https://${RPID}`, 'apex'],
            [REGISTER_ORIGIN, 'registration origin'],
            ['https://api.proton.test', 'sibling subdomain'],
            ['https://deep.api.proton.test', 'nested subdomain'],
        ])('authenticates from %s (%s)', async (origin) => {
            const options = createPublicKeyRequestOptions(RPID, response.credential_id);
            await expect(authenticate(core, origin, blob, options)).resolves.toBeDefined();
            expect(fetchSpy).not.toHaveBeenCalled();
        });
    });

    /** When the RPID is more specific than the request origin, the rust lib must
     * resolve `https://<rpid>/.well-known/webauthn` and check the request origin
     * against the returned `origins` array. */
    describe('cross-origin RPID: registration via `.well-known`', () => {
        const RPID = 'sub.proton.test';
        const ORIGIN = 'https://www.proton.test';
        const WELL_KNOWN = `https://${RPID}/.well-known/webauthn`;

        test('allows registration when request origin is in `origins`', async () => {
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, { origins: [ORIGIN] }));
            await expect(registerTestPasskey(core, { rpId: RPID, origin: ORIGIN })).resolves.toBeDefined();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects registration when origin is not in `origins`', async () => {
            const origins = ['https://elsewhere.proton.test'];
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, { origins }));
            await expect(registerTestPasskey(core, { rpId: RPID, origin: ORIGIN })).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects registration when `.well-known` is unreachable', async () => {
            fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));
            await expect(registerTestPasskey(core, { rpId: RPID, origin: ORIGIN })).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects registration on a non-2xx `.well-known` response', async () => {
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, {}, 400));
            await expect(registerTestPasskey(core, { rpId: RPID, origin: ORIGIN })).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });
    });

    /** Auth mirrors registration: if the auth origin doesn't suffix-match the RPID,
     * the rust lib must resolve `.well-known/webauthn` and verify the request origin
     * against the returned `origins` array. */
    describe('cross-origin RPID: authentication via `.well-known`', () => {
        const RPID = 'sub.proton.test';
        const RP_ORIGIN = `https://${RPID}`;
        const AUTH_ORIGIN = 'https://www.proton.test';
        const WELL_KNOWN = `${RP_ORIGIN}/.well-known/webauthn`;
        const ALLOWED_ORIGINS = [
            'https://proton.test',
            'https://www.proton.test',
            'https://mail.proton.test',
            'https://account.proton.test',
            RP_ORIGIN,
        ];

        let blob: Uint8Array<ArrayBuffer>;
        let response: WasmGeneratePasskeyResponse;

        const auth = () => {
            const options = createPublicKeyRequestOptions(RPID, response.credential_id);
            return authenticate(core, AUTH_ORIGIN, blob, options);
        };

        /** Register once with matching origin (no fetch — RPID equals origin),
         * then exercise auth from a different origin against varying responses. */
        beforeEach(async () => {
            const registered = await registerTestPasskey(core, { rpId: RPID, origin: RP_ORIGIN });
            blob = registered.blob;
            response = registered.response;
        });

        test('allows authentication when request origin is in `origins`', async () => {
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, { origins: ALLOWED_ORIGINS }));
            await expect(auth()).resolves.toBeDefined();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects when `origins` does not include request origin', async () => {
            const origins = ['https://elsewhere.proton.test'];
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, { origins }));
            await expect(auth()).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects when `origins` is empty', async () => {
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, { origins: [] }));
            await expect(auth()).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects when `origins` field is missing', async () => {
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, {}));
            await expect(auth()).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects when `origins` is not an array', async () => {
            fetchSpy.mockResolvedValueOnce(fetchResponse(WELL_KNOWN, { origins: 'nope' }));
            await expect(auth()).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects on malformed JSON response', async () => {
            fetchSpy.mockResolvedValueOnce({ ok: true, url: WELL_KNOWN, json: badJson } as unknown as Response);
            await expect(auth()).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects on network error', async () => {
            fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));
            await expect(auth()).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });
    });

    /** End-to-end: a passkey registered cross-origin must be usable from every
     * origin listed in `.well-known` (each via fetch) and from the RPID origin
     * itself (no fetch — exact match). */
    describe('cross-origin RPID: related-origins', () => {
        const RPID = 'auth.proton.test';
        const RP_ORIGIN = `https://${RPID}`;
        const WELL_KNOWN = `${RP_ORIGIN}/.well-known/webauthn`;
        const REGISTER_ORIGIN = 'https://www.proton.test';
        const LISTED_ORIGINS = [
            'https://proton.test',
            'https://www.proton.test',
            'https://mail.proton.test',
            'https://account.proton.test',
            RP_ORIGIN,
        ];

        let blob: Uint8Array<ArrayBuffer>;
        let response: WasmGeneratePasskeyResponse;

        beforeAll(async () => {
            fetchSpy.mockResolvedValue(fetchResponse(WELL_KNOWN, { origins: LISTED_ORIGINS }));
            const registered = await registerTestPasskey(core, { rpId: RPID, origin: REGISTER_ORIGIN });
            blob = registered.blob;
            response = registered.response;
        });

        test.each(LISTED_ORIGINS.filter((o) => o !== RP_ORIGIN).map((o) => [o]))(
            'authenticates from %s (listed in `origins`)',
            async (origin) => {
                fetchSpy.mockResolvedValue(fetchResponse(WELL_KNOWN, { origins: LISTED_ORIGINS }));
                const options = createPublicKeyRequestOptions(RPID, response.credential_id);
                await expect(authenticate(core, origin, blob, options)).resolves.toBeDefined();
                expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
            }
        );

        test(`authenticates from ${RP_ORIGIN} (RPID origin, no fetch)`, async () => {
            const options = createPublicKeyRequestOptions(RPID, response.credential_id);
            await expect(authenticate(core, RP_ORIGIN, blob, options)).resolves.toBeDefined();
            expect(fetchSpy).not.toHaveBeenCalled();
        });
    });

    /** Fully cross-domain scenario: RPID and the trusted origins are separate
     * TLDs, so every cross-domain register and authenticate must resolve
     * `.well-known/webauthn` and validate against the `origins` list. */
    describe('cross-origin RPID: unrelated origins', () => {
        const RPID = 'proton.test';
        const WELL_KNOWN = `https://${RPID}/.well-known/webauthn`;
        const TRUSTED = {
            apex: `https://${RPID}`,
            vpn: 'https://protonvpn.test',
            mail: 'https://protonmail.test',
            drive: 'https://protondrive.test',
        };
        const UNTRUSTED = 'https://attacker.test';
        const ORIGINS_LIST = Object.values(TRUSTED);

        beforeEach(() => {
            fetchSpy.mockResolvedValue(fetchResponse(WELL_KNOWN, { origins: ORIGINS_LIST }));
        });

        test.each([
            [TRUSTED.apex, TRUSTED.vpn],
            [TRUSTED.vpn, TRUSTED.apex],
            [TRUSTED.vpn, TRUSTED.mail],
            [TRUSTED.mail, TRUSTED.drive],
            [TRUSTED.drive, TRUSTED.vpn],
        ])('register on %s → authenticate from %s', async (registerOrigin, authOrigin) => {
            const { blob, response } = await registerTestPasskey(core, { rpId: RPID, origin: registerOrigin });
            const options = createPublicKeyRequestOptions(RPID, response.credential_id);
            await expect(authenticate(core, authOrigin, blob, options)).resolves.toBeDefined();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects registration from a cross-domain origin not in `origins`', async () => {
            await expect(registerTestPasskey(core, { rpId: RPID, origin: UNTRUSTED })).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });

        test('rejects authentication from a cross-domain origin not in `origins`', async () => {
            const { blob, response } = await registerTestPasskey(core, { rpId: RPID, origin: TRUSTED.vpn });
            const options = createPublicKeyRequestOptions(RPID, response.credential_id);
            await expect(authenticate(core, UNTRUSTED, blob, options)).rejects.toThrow();
            expect(fetchSpy).toHaveBeenCalledWith(WELL_KNOWN, FETCH_OPTIONS);
        });
    });
});
