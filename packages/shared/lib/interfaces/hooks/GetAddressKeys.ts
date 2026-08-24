import type { DecryptedAddressKey } from '..';

export type GetAddressKeys = (id: string) => Promise<DecryptedAddressKey[]>;
