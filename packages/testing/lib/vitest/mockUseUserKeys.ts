import * as useUserKeysModule from '@proton/account/userKeys/hooks';
import { DecryptedKey } from '@proton/shared/lib/interfaces';

export const mockUseUserKey = (value: [DecryptedKey[]?, boolean?] = []) => {
    const [keys, cached = false] = value;
    const mockedUseUser = vi.spyOn(useUserKeysModule, 'useUserKeys');
    mockedUseUser.mockReturnValue([keys ?? [], Boolean(cached)]);
    return mockedUseUser;
};
