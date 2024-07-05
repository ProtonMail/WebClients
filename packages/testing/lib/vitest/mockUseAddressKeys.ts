import * as useAddressKeysModule from '@proton/account/addressKeys/hooks';
import { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';

export const mockUseAddressKeys = (value: [{ address: Address; keys: DecryptedAddressKey[] }[]?, boolean?] = []) => {
    const [keys, cached = false] = value;
    const mockedUseAddressKeys = vi.spyOn(useAddressKeysModule, 'useAddressesKeys');
    mockedUseAddressKeys.mockReturnValue([keys ?? [], Boolean(cached)]);
    return mockedUseAddressKeys;
};

export const mockUseGetAddressKeys = (value?: ReturnType<typeof useAddressKeysModule.useGetAddressKeys>) => {
    const mockedUseGetAddressKeys = vi.spyOn(useAddressKeysModule, 'useGetAddressKeys');
    mockedUseGetAddressKeys.mockReturnValue(value ?? vi.fn());
    return mockedUseGetAddressKeys;
};
