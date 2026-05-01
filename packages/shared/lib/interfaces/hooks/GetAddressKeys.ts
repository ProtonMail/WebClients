import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces';

export type GetAddressKeys = (id: string) => Promise<DecryptedAddressKey[]>;
