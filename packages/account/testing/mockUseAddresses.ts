import type { Address } from '@proton/shared/lib/interfaces';

import * as useAddressesModule from '../addresses/hooks';
import { buildAddress } from './buildAddress';

jest.mock('../addresses/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('../addresses/hooks'),
}));

export const mockUseAddresses = (value: [Address[]?, boolean?] = []) => {
    const [addresses, cached = false] = value;
    const mockedUseAddress = jest.spyOn(useAddressesModule, 'useAddresses');
    mockedUseAddress.mockReturnValue([addresses ?? [buildAddress()], Boolean(cached)]);
    return mockedUseAddress;
};
