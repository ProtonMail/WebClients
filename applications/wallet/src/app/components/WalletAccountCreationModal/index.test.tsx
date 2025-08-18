import { fireEvent, render, screen } from '@testing-library/react';

import { WasmScriptType } from '@proton/andromeda';
import { apiWalletsData } from '@proton/wallet/tests';

import { WalletAccountCreationModal } from '.';
import * as useWalletAccountCreationModalModule from './useWalletAccountCreationModal';

const baseMock = {
    label: '',
    onLabelChange: vi.fn(),

    selectedIndex: 0,
    onIndexSelect: vi.fn(),
    inputIndex: 0,
    onIndexChange: vi.fn(),

    indexesByScriptType: {
        '3': new Set([0, 2]),
        '4': new Set([0, 1, 3]),
    },
    selectedScriptType: WasmScriptType.NativeSegwit,
    onScriptTypeSelect: vi.fn(),

    createWalletAccount: vi.fn(),
};

describe('WalletAccountCreationModal', () => {
    const mockedHook = vi.spyOn(useWalletAccountCreationModalModule, 'useWalletAccountCreationModal');

    beforeEach(() => {
        mockedHook.mockReturnValue(baseMock);
    });

    it('should disabled options for index that are already used', async () => {
        const { rerender } = render(<WalletAccountCreationModal open apiWalletData={apiWalletsData[0]} />);

        const select = await screen.findByTestId('account-index-selector');
        await fireEvent.click(select);

        // segwit index options
        const index0 = await screen.findByTestId('option-0');
        expect(index0).toBeDisabled();
        const index2 = await screen.findByTestId('option-2');
        expect(index2).toBeDisabled();

        const index1 = await screen.findByTestId('option-1');
        expect(index1).toBeEnabled();

        mockedHook.mockReturnValue({ ...baseMock, selectedScriptType: WasmScriptType.Taproot });
        rerender(<WalletAccountCreationModal open apiWalletData={apiWalletsData[0]} />);

        await fireEvent.click(select);

        // taproot index options
        const index0Taproot = await screen.findByTestId('option-0');
        expect(index0Taproot).toBeDisabled();
        const index1Taproot = await screen.findByTestId('option-1');
        expect(index1Taproot).toBeDisabled();
        const index3Taproot = await screen.findByTestId('option-3');
        expect(index3Taproot).toBeDisabled();

        const index2Taproot = await screen.findByTestId('option-2');
        expect(index2Taproot).toBeEnabled();
    });
});
