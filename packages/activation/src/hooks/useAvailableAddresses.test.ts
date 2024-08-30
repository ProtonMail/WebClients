import { renderHook } from '@testing-library/react-hooks';

import { useAddresses } from '@proton/components';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';

import { generateMockAddress, generateMockAddressArray } from '../tests/data/addresses';
import useAvailableAddresses from './useAvailableAddresses';

jest.mock('@proton/components/hooks/useAddresses');
const mockUseAddresses = useAddresses as jest.MockedFunction<any>;

describe('useAvailableAddresses', () => {
    it('Should return empty addresses', () => {
        mockUseAddresses.mockReturnValue([[], false]);

        const { result } = renderHook(() => useAvailableAddresses());
        expect(result.current).toStrictEqual({ availableAddresses: [], defaultAddress: undefined, loading: false });
    });

    it('Should return available addresses with active keys', () => {
        const activeAddresses = generateMockAddressArray(2, true);
        const disabledAddress = generateMockAddress(3, false);
        mockUseAddresses.mockReturnValue([[...activeAddresses, disabledAddress], false]);

        const { result } = renderHook(() => useAvailableAddresses());
        expect(result.current.availableAddresses).toHaveLength(2);
        expect(result.current).toStrictEqual({
            availableAddresses: activeAddresses,
            defaultAddress: activeAddresses[0],
            loading: false,
        });
    });

    it('Should return available addresses and filter external addresses', () => {
        const activeAddresses = generateMockAddressArray(2, true);
        const externalAddress = generateMockAddress(3, true, ADDRESS_TYPE.TYPE_EXTERNAL);
        mockUseAddresses.mockReturnValue([[...activeAddresses, externalAddress], false]);

        const { result } = renderHook(() => useAvailableAddresses());
        expect(result.current.availableAddresses).toHaveLength(2);
        expect(result.current).toStrictEqual({
            availableAddresses: activeAddresses,
            defaultAddress: activeAddresses[0],
            loading: false,
        });
    });
});
