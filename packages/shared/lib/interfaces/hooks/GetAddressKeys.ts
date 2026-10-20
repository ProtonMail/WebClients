import type { DecryptedAddressKey } from '../Key';

export type GetAddressKeys = (id: string) => Promise<DecryptedAddressKey[]>;
