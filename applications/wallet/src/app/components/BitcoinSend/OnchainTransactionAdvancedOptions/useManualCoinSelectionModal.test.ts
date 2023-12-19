describe('useManualCoinSelectionModal', () => {
    describe('handleToggleUtxoSelection', () => {
        describe('when coin is not selected yet', () => {
            it.todo('should add to the list');
        });

        describe('when coin is already selected', () => {
            it.todo('should remove it from the list');
        });
    });

    describe('handleConfirmCoinSelection', () => {
        it.todo('should `OnCoinSelected` with selected coins');
    });

    describe('when account changes', () => {
        it.todo('should fetch again utxos');
    });

    describe('when modal closed', () => {
        it.todo('should clear tmp selected');
    });

    describe('when modal open', () => {
        it.todo('should set tmp selected with settled ones');
    });
});
