import * as useAddressesModule from '@proton/account/addresses/hooks';
import type { Address } from '@proton/shared/lib/interfaces';

export const mockUseAddresses = (value: [Address[]?, boolean?] = []) => {
    const [addresses, cached = false] = value;
    const mockedUseAddresses = vi.spyOn(useAddressesModule, 'useAddresses');
    mockedUseAddresses.mockReturnValue([addresses ?? [], Boolean(cached)]);
    return mockedUseAddresses;
};

export const mockUseGetAddresses = (value: Address[] = []) => {
    const mockedUseAddresses = vi.spyOn(useAddressesModule, 'useGetAddresses');
    mockedUseAddresses.mockReturnValue(vi.fn(async () => value ?? []));
    return mockedUseAddresses;
};
