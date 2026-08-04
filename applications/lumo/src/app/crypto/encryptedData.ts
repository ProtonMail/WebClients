export type Base64 = string;

// EncryptedData represents a blob that contains encrypted data which we are in position to decrypt.
// Compatibility note: It is now represented by a single string `iv || data`,
// but in the past, it was { iv, data }, so our codepath needs to handle this too.
export type OldEncryptedData = { iv: Base64; data: Base64 };
export type EncryptedData = Base64 | OldEncryptedData;

export function isOldEncryptedData(obj: unknown): obj is OldEncryptedData {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof (obj as OldEncryptedData).iv === 'string' &&
        typeof (obj as OldEncryptedData).data === 'string'
    );
}

export type AdString = string;
