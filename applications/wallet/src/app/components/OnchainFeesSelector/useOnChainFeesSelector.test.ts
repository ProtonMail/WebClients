describe('useOnChainFeesSelector', () => {
    it.todo('should open modal');
    it.todo('should close modal');

    describe('on mount', () => {
        it.todo('should fetch fee estimations');
        it.todo('should set default fee to target next 5th block');
        it.todo('should keep isRecomended to true');
    });

    describe('handleFeesSelected', () => {
        describe('when a lower block target is available for same feeRate', () => {
            it.todo('use lower block target');
            it.todo('should turn isRecomended to false by default');
        });
    });

    describe('feeRateNote', () => {
        describe('when below 5th next block', () => {
            it.todo('should `HIGH` note');
        });

        describe('when below 10th next block', () => {
            it.todo('should `MODERATE` note');
        });

        describe('when above 10th next block', () => {
            it.todo('should `MODERATE` note');
        });
    });
});
