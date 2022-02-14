import { DecryptedKey } from '../Key';
import { RequireSome } from '../utils';

export type GetAddressKeys = (id: string) => Promise<RequireSome<DecryptedKey, 'Flags'>[]>;
