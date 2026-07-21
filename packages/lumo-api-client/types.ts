/* Minimal in-package type subset needed by @proton/lumo-api-client.
 *
 * This is a self-contained copy of the small set of app-wide aliases and guards
 * that the client relies on, so the package does not import from the lumo app.
 * Backend-aligned API types live in `./types-api`.
 */
import { type EncryptedWireTurn, type UnencryptedWireTurn, type WireTurn, isWireTurn } from './types-api';

// *** Turn aliases ***
// Turn types are defined in types-api as WireTurn (matching backend schema).
export type Turn = WireTurn;
export type EncryptedTurn = EncryptedWireTurn;
export type UnencryptedTurn = UnencryptedWireTurn;
export const isTurn = isWireTurn;

// *** Various string aliases ***
export type Base64 = string;
export type AdString = string;

// *** Ids ***
export type Uuid = string;
export type RequestId = Uuid;

// *** Status ***
export type Status = 'succeeded' | 'failed';

// EncryptedData represents a blob that contains encrypted data which we are in position to decrypt.
// Compatibility note: It is now represented by a single string `iv || data`,
// but in the past, it was { iv, data }, so our codepath needs to handle this too.
export type OldEncryptedData = { iv: Base64; data: Base64 };
export type EncryptedData = Base64 | OldEncryptedData;

export function isOldEncryptedData(obj: any): obj is OldEncryptedData {
    return typeof obj === 'object' && obj !== null && typeof obj.iv === 'string' && typeof obj.data === 'string';
}
