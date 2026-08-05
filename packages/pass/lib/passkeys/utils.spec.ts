import type { WasmGeneratePasskeyResponse } from '@protontech/pass-rust-core/worker';

import { intoPasskeyCreateBridgeResponse } from './utils';

const mockResponse: WasmGeneratePasskeyResponse = {
    credential: {
        id: 'credential-id',
        raw_id: [1, 2, 3],
        authenticator_attachment: 'cross-platform',
        client_extension_results: { credProps: undefined },
        type: 'public-key',
        response: {
            client_data_json: [4, 5, 6],
            authenticator_data: [7, 8, 9],
            public_key: [10, 11, 12],
            public_key_algorithm: -7,
            attestation_object: [13, 14, 15],
            transports: undefined,
        },
    },
    passkey: [16, 17, 18],
    key_id: 'key-id',
    domain: 'proton.me',
    rp_id: 'proton.me',
    rp_name: 'Proton',
    user_name: 'alice',
    user_display_name: 'Alice',
    user_id: [19, 20, 21],
    credential_id: [22, 23, 24],
    user_handle: [25, 26, 27],
    client_data_hash: [28, 29, 30],
    attestation_object: [31, 32, 33],
};

describe('intoPasskeyCreateBridgeResponse', () => {
    test('returns only the WebAuthn credential payload', () => {
        expect(intoPasskeyCreateBridgeResponse(mockResponse)).toEqual({ credential: mockResponse.credential });
    });

    test('does not expose internal passkey signing state', () => {
        const bridgeResponse = intoPasskeyCreateBridgeResponse(mockResponse);

        expect(bridgeResponse).not.toHaveProperty('passkey');
        expect(bridgeResponse).not.toHaveProperty('key_id');
        expect(bridgeResponse).not.toHaveProperty('client_data_hash');
        expect(bridgeResponse).not.toHaveProperty('attestation_object');
    });
});
