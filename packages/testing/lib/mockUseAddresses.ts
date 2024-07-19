import * as useAddressesModule from '@proton/account/addresses/hooks';
import type { Address } from '@proton/shared/lib/interfaces';

import { buildAddress } from '../builders/address';

export const mockUseAddresses = (value: [Address[]?, boolean?] = []) => {
    const [addresses, cached = false] = value;
    const mockedUseAddress = jest.spyOn(useAddressesModule, 'useAddresses');
    mockedUseAddress.mockReturnValue([addresses ?? [buildAddress()], Boolean(cached)]);
    return mockedUseAddress;
};
