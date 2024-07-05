import * as useUserKeysModule from '@proton/account/userKeys/hooks';
import { DecryptedKey } from '@proton/shared/lib/interfaces';

export const mockUseUserKeys = (value: [DecryptedKey[]?, boolean?] = []) => {
    const [keys, cached = false] = value;
    const mockedUseUserKeys = vi.spyOn(useUserKeysModule, 'useUserKeys');
    mockedUseUserKeys.mockReturnValue([keys ?? [], Boolean(cached)]);
    return mockedUseUserKeys;
};

export const mockUseGetUserKeys = (value: DecryptedKey[] = []) => {
    const mockedUseGetUser = vi.spyOn(useUserKeysModule, 'useGetUserKeys');
    mockedUseGetUser.mockReturnValue(vi.fn(async () => value));
    return mockedUseGetUser;
};
