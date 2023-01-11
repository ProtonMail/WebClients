import { fireEvent, screen, waitFor } from '@testing-library/dom';

import { mockAddresses } from '@proton/activation/tests/data/addresses';
import { easySwitchRender } from '@proton/activation/tests/render';

import CustomizeMailImportModalAddresses from './CustomizeMailImportModalAddresses';

jest.mock('@proton/activation/hooks/useAvailableAddresses', () => () => ({
    availableAddresses: mockAddresses,
    loading: false,
    defaultAddress: mockAddresses[0],
}));

describe('CustomizeMailImportModalAddresses', () => {
    it('Should render simple field when one available address', async () => {
        const onSubmit = jest.fn();

        easySwitchRender(
            <CustomizeMailImportModalAddresses selectedAddressID={mockAddresses[0].ID} onChange={onSubmit} />
        );

        const select = screen.getByTestId('CustomizeModal:addressSelect');
        fireEvent.click(select);

        await waitFor(() => screen.getAllByTestId('CustomizeModal:addressRow'));
        const options = screen.getAllByTestId('CustomizeModal:addressRow');
        expect(options).toHaveLength(options.length);

        fireEvent.click(options[1]);

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith({ ...mockAddresses[1] });
    });
});
