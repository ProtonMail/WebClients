import { DecryptedKey } from '../Key';

export type GetAddressKeys = (id: string) => Promise<DecryptedKey[]>;
