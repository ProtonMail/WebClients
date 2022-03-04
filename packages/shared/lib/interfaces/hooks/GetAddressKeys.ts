import { getDecryptedAddressKeys } from '../../keys';

export type GetAddressKeys = (id: string) => ReturnType<typeof getDecryptedAddressKeys>;
