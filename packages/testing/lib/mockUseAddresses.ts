import * as useAddressesModule from '@proton/components/hooks/useAddresses';
import { Address } from '@proton/shared/lib/interfaces';

import { buildAddress } from '../builders/address';

export const mockUseAddresses = (value: [Address[]?, boolean?, any?] = []) => {
    const [addresses, cached, miss = jest.fn()] = value;
    const mockedUseAddress = jest.spyOn(useAddressesModule, 'default');
    mockedUseAddress.mockReturnValue([addresses ?? [buildAddress()], Boolean(cached), miss]);
    return mockedUseAddress;
};
