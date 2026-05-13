import { buildAccessTokenEnvVar, decodePatRecord } from '@proton/pass/lib/access-token/access-token.utils';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { encryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { PatMonitorListEntryOutput } from '@proton/pass/types';
import { EventType2, PassEncryptionTag } from '@proton/pass/types';
import { ActionPayload } from '@proton/pass/types/protobuf/action-payload-v1';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';

const createActionOutput = (encryptedPayload?: string): PatMonitorListEntryOutput => ({
    PatMonitorRecordID: uniqueId(),
    VaultID: uniqueId(),
    Action: EventType2.ITEM_CREATE,
    ActionTime: getEpoch(),
    Payload: encryptedPayload,
});

const createEncryptedAction = async (
    content: ActionPayload
): Promise<{
    action: PatMonitorListEntryOutput;
    rawPatKey: Uint8Array<ArrayBuffer>;
}> => {
    const action = createActionOutput();
    const actionPayload = ActionPayload.create(content);
    const payload = ActionPayload.toBinary(actionPayload) as Uint8Array<ArrayBuffer>;
    const rawPatKey = generateKey();
    const patKey = await importSymmetricKey(rawPatKey);
    const encrypted = await encryptData(patKey, payload, PassEncryptionTag.ActionPayload);
    action.Payload = encrypted.toBase64();

    return { action, rawPatKey };
};

describe('`buildAccessTokenEnvVar`', () => {
    test('should format env var correctly', () => {
        const rawPatKey = generateKey();
        const envVar = buildAccessTokenEnvVar('mytoken', rawPatKey);
        const [token, key] = envVar.split('::');
        expect(token).toEqual('mytoken');
        expect(key).toMatch(/^[A-Za-z0-9_-]+$/); // b64-url encoded
    });
});

describe('`decodePatRecord`', () => {
    beforeEach(() => exposePassCrypto(createPassCrypto()));

    test('should handle missing `Payload`', async () => {
        const rawPatKey = generateKey();
        const action = createActionOutput();
        const decoded = await decodePatRecord(action, rawPatKey);
        expect(decoded).toEqual({ ...action, decodedPayload: null });
    });

    test('should handle `agent-action` kind', async () => {
        const { action, rawPatKey } = await createEncryptedAction({
            content: {
                oneofKind: 'agentAction',
                agentAction: {
                    reason: 'test',
                    vaultName: 'test-vault',
                    itemName: '',
                    folderName: '',
                },
            },
        });

        const decoded = await decodePatRecord(action, rawPatKey);

        expect(decoded).toStrictEqual({
            decodedPayload: {
                folderName: '',
                itemName: '',
                kind: 'agent-action',
                reason: 'test',
                vaultName: 'test-vault',
            },
            ...action,
        });
    });

    test('should handle `unknown` kind', async () => {
        const { action, rawPatKey } = await createEncryptedAction({ content: { oneofKind: 'unsupported-yet' } } as any);
        const decoded = await decodePatRecord(action, rawPatKey);
        expect(decoded).toStrictEqual({ decodedPayload: { kind: 'unknown' }, ...action });
    });

    test('should handle decode errors', async () => {
        const { action, rawPatKey } = await createEncryptedAction({
            content: {
                oneofKind: 'agentAction',
                agentAction: {
                    reason: 'test',
                    vaultName: 'test-vault',
                    itemName: '',
                    folderName: '',
                },
            },
        });

        action.Payload = 'CORRUPTED-GARBAGE';
        const decoded = await decodePatRecord(action, rawPatKey);

        expect(decoded).toStrictEqual({
            decodedPayload: { kind: 'decode-error', error: expect.any(String) },
            ...action,
        });
    });
});
