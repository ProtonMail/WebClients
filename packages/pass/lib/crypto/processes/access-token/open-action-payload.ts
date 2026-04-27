import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import { ActionPayload, type AgentAccessItem } from '@proton/pass/types/protobuf/action-payload-v1';

export type DecryptedActionPayload =
    | { kind: 'agent-access-item'; agentAccessItem: AgentAccessItem }
    | { kind: 'unknown' };

/** Mirrors the Pass CLI rust `decrypt_monitor_payload`:
 *   1) base64-decode the wire payload
 *   2) AES-GCM decrypt with the raw PAT key (AAD = "proton.pass.payload")
 *   3) protobuf-decode as ActionPayload
 *
 * Returns `null` if the input is empty/invalid — the caller (UI) decides
 * how to render records that don't carry a decrypted payload. */
export const openActionPayload = async (
    encodedPayload: string,
    rawPatKey: Uint8Array<ArrayBuffer>
): Promise<DecryptedActionPayload | null> => {
    if (!encodedPayload) return null;

    const encrypted = Uint8Array.fromBase64(encodedPayload) as Uint8Array<ArrayBuffer>;
    const patKey = await importSymmetricKey(rawPatKey);
    const decrypted = await decryptData(patKey, encrypted, PassEncryptionTag.ActionPayload);

    const message = ActionPayload.fromBinary(decrypted);
    switch (message.content.oneofKind) {
        case 'agentAccessItem':
            return { kind: 'agent-access-item', agentAccessItem: message.content.agentAccessItem };
        default:
            return { kind: 'unknown' };
    }
};
