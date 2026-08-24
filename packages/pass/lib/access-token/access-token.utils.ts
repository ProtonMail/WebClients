import type { PatMonitorListEntryOutput } from '../../types';
import { getErrorMessage } from '../../utils/errors/get-error-message';
import { logger } from '../../utils/logger';
import { UNIX_HOUR } from '../../utils/time/constants';
import { getEpoch } from '../../utils/time/epoch';
import { PassCrypto } from '../crypto';
import type { DecodedPatMonitorPayload, DecodedPatMonitorRecord } from './access-token.types';

export const PAT_PRODUCT = 'pass';

/** The string a user pastes into the Pass CLI (or its env var).
 * Format: `<server-issued-token>::<urlsafe-base64-no-pad(raw-key)>` */
export const buildAccessTokenEnvVar = (token: string, rawKey: Uint8Array<ArrayBuffer>): string =>
    `${token}::${rawKey.toBase64({ alphabet: 'base64url', omitPadding: true })}`;

/** Decodes a single audit record of an agent action made via a PAT. `Action` is the
 * server-defined `EventType` enum (numeric); `Payload` is a base64-encoded AES-GCM ciphertext
 * (AAD = "proton.pass.payload") that decrypts to a serialized `ActionPayload` protobuf. */
export const decodePatRecord = async (
    record: PatMonitorListEntryOutput,
    rawPatKey: Uint8Array<ArrayBuffer>
): Promise<DecodedPatMonitorRecord> => {
    const encodedPayload = record.Payload;
    if (!encodedPayload) return { ...record, decodedPayload: null };

    try {
        const decoded = await PassCrypto.openActionPayload({ encodedPayload, rawPatKey });
        if (!decoded) return { ...record, decodedPayload: null };

        const decodedPayload: DecodedPatMonitorPayload =
            decoded.kind === 'agent-action'
                ? {
                      kind: 'agent-action',
                      reason: decoded.agentAction.reason,
                      vaultName: decoded.agentAction.vaultName,
                      itemName: decoded.agentAction.itemName,
                      folderName: decoded.agentAction.folderName,
                  }
                : { kind: 'unknown' };
        return { ...record, decodedPayload };
    } catch (e) {
        /* Decryption / proto-decode failure for a single record shouldn't
         * abort the whole page — surface it as a `decode-error` so the UI
         * can flag the row and the dev tools log shows the cause. */
        const error = getErrorMessage(e);
        logger.error(`[Saga::AccessToken] record decode failure`, error);
        return { ...record, decodedPayload: { kind: 'decode-error', error } };
    }
};

export type TokenStatus = 'active' | 'expiring' | 'expired';

export const getTokenStatus = (expireTime: number): TokenStatus => {
    const now = getEpoch();
    if (expireTime < now) return 'expired';
    if (expireTime - now <= UNIX_HOUR) return 'expiring';
    return 'active';
};
