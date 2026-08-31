import type { Address } from '@proton/shared/lib/interfaces';

import * as useAddressesModule from '../../addresses/hooks';

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
