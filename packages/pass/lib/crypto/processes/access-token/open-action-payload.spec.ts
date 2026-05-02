import { encryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import { ActionPayload } from '@proton/pass/types/protobuf/action-payload-v1';

import { openActionPayload } from './open-action-payload';

const encryptPayload = async (rawPatKey: Uint8Array<ArrayBuffer>, message: ActionPayload): Promise<string> => {
    const patKey = await importSymmetricKey(rawPatKey);
    const plaintext = ActionPayload.toBinary(message) as Uint8Array<ArrayBuffer>;
    const encrypted = await encryptData(patKey, plaintext, PassEncryptionTag.ActionPayload);
    return encrypted.toBase64();
};

describe('openActionPayload crypto process', () => {
    test('should return null for an empty encoded payload', async () => {
        const result = await openActionPayload('', generateKey());
        expect(result).toBeNull();
    });

    test('should decrypt and return an agent-action payload', async () => {
        const rawPatKey = generateKey();
        const agentAction = { reason: 'test-reason', vaultName: 'vault', itemName: '', folderName: '' };
        const message = ActionPayload.create({ content: { oneofKind: 'agentAction', agentAction } });
        const encoded = await encryptPayload(rawPatKey, message);
        const result = await openActionPayload(encoded, rawPatKey);

        expect(result).toEqual({ kind: 'agent-action', agentAction });
    });

    test('should return unknown kind for an ActionPayload with no content', async () => {
        const rawPatKey = generateKey();
        const message = ActionPayload.create({ content: { oneofKind: undefined } });
        const encoded = await encryptPayload(rawPatKey, message);
        const result = await openActionPayload(encoded, rawPatKey);

        expect(result).toEqual({ kind: 'unknown' });
    });
});
