import { fireEvent, screen } from '@testing-library/dom';

import useAvailableAddresses from '../../../../../hooks/useAvailableAddresses';
import type { MailImportState } from '../../../../../logic/draft/imapDraft/imapDraft.interface';
import { generateMockAddressArray } from '../../../../../tests/data/addresses';
import { easySwitchRender } from '../../../../../tests/render';
import StepPrepare from './StepPrepareImap';

const data: MailImportState = {
    step: 'prepare-import',
    loading: false,
    domain: 'imap.proton.ch',
    email: 'testing@proton.ch',
    password: 'password',
    port: '993',
};

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn(() => ({ mailImport: data })),
}));

const addresses = generateMockAddressArray(3, true);

jest.mock('../../../../../hooks/useAvailableAddresses');
const mockUseAvailableAddresses = useAvailableAddresses as jest.MockedFunction<any>;

describe('Step prepare basic rendering testing', () => {
    it('Should correctly render the step prepare', () => {
        mockUseAvailableAddresses.mockReturnValue({
            availableAddresses: addresses,
            loading: false,
            defaultAddress: addresses[0],
        });
        easySwitchRender(<StepPrepare />);

        const customizeButton = screen.getByTestId('StepPrepare:customizeButton');
        fireEvent.click(customizeButton);

        screen.getByTestId('CustomizeModal:modalCancel');
    });
});
