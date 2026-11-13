import { fireEvent, screen } from '@testing-library/dom';
import { type MockedFunction, vi } from 'vitest';

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

vi.mock('react-redux', async () => ({
    ...(await vi.importActual('react-redux')),
    useSelector: vi.fn(() => ({ mailImport: data })),
}));

const addresses = generateMockAddressArray(3, true);

vi.mock('../../../../../hooks/useAvailableAddresses');
const mockUseAvailableAddresses = useAvailableAddresses as MockedFunction<any>;

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
