/**
 * Normalizes an email the way it is indexed in the address attributes (`from`, `to`, `cc`, `bcc`), so that
 * indexing and exact matching in queries agree.
 */
export const normalizeIndexedEmail = (email: string | undefined) => {
    return (email ?? '').trim().toLowerCase();
};
