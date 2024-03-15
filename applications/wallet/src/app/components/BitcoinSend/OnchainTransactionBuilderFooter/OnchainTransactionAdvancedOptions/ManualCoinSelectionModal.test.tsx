describe('ManualCoinSelectionModal', () => {
    it.todo('should correctly display utxo details');

    describe('when no account is provided', () => {
        it.todo('should display `No coin available` message');
    });

    describe('when account has no utxo', () => {
        it.todo('should display `No coin available` message');
    });

    describe('when user clicks on an utxo', () => {
        it.todo('should call `handleToggleUtxoSelection`');
    });

    describe('when user clicks on cancel button', () => {
        it.todo('should call `onClose`');
    });

    describe('when user clicks on confirm button', () => {
        it.todo('should call `onCoinSelected` with selected utxos');
    });
});
