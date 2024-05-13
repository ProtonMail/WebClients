import * as useAddressKeysModule from '@proton/account/addressKeys/hooks';
import { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';

export const mockUseAddressKeys = (value: [{ address: Address; keys: DecryptedAddressKey[] }[]?, boolean?] = []) => {
    const [keys, cached = false] = value;
    const mockedUseUser = vi.spyOn(useAddressKeysModule, 'useAddressesKeys');
    mockedUseUser.mockReturnValue([keys ?? [], Boolean(cached)]);
    return mockedUseUser;
};

export const mockUseGetAddressKeys = (value?: ReturnType<typeof useAddressKeysModule.useGetAddressKeys>) => {
    const mockedUseUser = vi.spyOn(useAddressKeysModule, 'useGetAddressKeys');
    mockedUseUser.mockReturnValue(value ?? vi.fn());
    return mockedUseUser;
};
