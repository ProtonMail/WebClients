import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { getUser } from '@proton/shared/lib/api/user';
import type { Address as tsAddress, KeySalt as tsKeySalt, User as tsUser } from '@proton/shared/lib/interfaces';

import type { AuthCacheResult } from './interface';

export const syncUser = async (cache: AuthCacheResult): Promise<tsUser> => {
    const user = await cache.api<{ User: tsUser }>(getUser()).then(({ User }) => User);
    cache.data.user = user;
    return user;
};

export const syncAddresses = async (cache: AuthCacheResult): Promise<tsAddress[]> => {
    const addresses = await getAllAddresses(cache.api);
    cache.data.addresses = addresses;
    return addresses;
};

export const syncSalts = async (cache: AuthCacheResult): Promise<tsKeySalt[]> => {
    const salts = await cache.api<{ KeySalts: tsKeySalt[] }>(getKeySalts()).then(({ KeySalts }) => KeySalts);
    cache.data.salts = salts;
    return salts;
};
