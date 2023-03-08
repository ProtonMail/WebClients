import { fireEvent, screen, waitFor } from '@testing-library/dom';

import useAvailableAddresses from '@proton/activation/src/hooks/useAvailableAddresses';
import { generateMockAddressArray } from '@proton/activation/src/tests/data/addresses';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import CustomizeMailImportModalAddresses from './CustomizeMailImportModalAddresses';

jest.mock('@proton/activation/src/hooks/useAvailableAddresses');
const mockUseAvailableAddresses = useAvailableAddresses as jest.MockedFunction<any>;

const addresses = generateMockAddressArray(3, true);

describe('CustomizeMailImportModalAddresses', () => {
    it('Should render simple field when one available address', async () => {
        mockUseAvailableAddresses.mockReturnValue({
            availableAddresses: addresses,
            loading: false,
            defaultAddress: addresses[0],
        });
        const onSubmit = jest.fn();

        easySwitchRender(<CustomizeMailImportModalAddresses selectedAddressID={addresses[0].ID} onChange={onSubmit} />);

        const select = screen.getByTestId('CustomizeModal:addressSelect');
        fireEvent.click(select);

        await waitFor(() => screen.getAllByTestId('CustomizeModal:addressRow'));
        const options = screen.getAllByTestId('CustomizeModal:addressRow');
        expect(options).toHaveLength(options.length);

        fireEvent.click(options[1]);

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith({ ...addresses[1] });
    });
});
