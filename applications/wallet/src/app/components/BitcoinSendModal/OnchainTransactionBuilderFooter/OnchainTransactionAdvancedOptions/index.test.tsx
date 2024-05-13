import { describe } from 'vitest';

describe('OnchainTransactionAdvancedOptions', () => {
    describe('coin selection', () => {
        describe('when one button of the group is clicked', () => {
            it.todo('Emit `handleCoinSelectionOptionSelect` with good value');
        });

        describe('when `Manual` is selected', () => {
            it.todo('should display button to open coin selection modal');

            describe('when open modal button is clicked', () => {
                it.todo('should call `openManualCoinSelectionModal`');
            });

            describe('when no utxo is selected', () => {
                it.todo('should display button with text `No UTXO selected`');
            });

            describe('when 1 utxo is selected', () => {
                it.todo('should display button with text `1 UTXO selected`');
            });

            describe('when 7 utxos are selected', () => {
                it.todo('should display button with text `7 UTXOs selected`');
            });
        });
    });

    describe('RBF', () => {
        describe('when user clicks on toggle', () => {
            it.todo('should call `toggleEnableRBF`');
        });
    });

    describe('Locktime', () => {
        describe('when user clicks on toggle', () => {
            it.todo('should call `toggleUseLocktime`');
        });

        describe('when useLocktime is true', () => {
            it.todo('should enable input');

            describe('when input is change', () => {
                it.todo('should call `handleLocktimeValueChange`');
            });
        });

        describe('when useLocktime is false', () => {
            it.todo('should disable input');
        });
    });

    describe('Change policy', () => {
        describe('when policy is selected', () => {
            it.todo('should call `handleChangePolicySelect`');
        });
    });

    describe.todo('Data');
});
