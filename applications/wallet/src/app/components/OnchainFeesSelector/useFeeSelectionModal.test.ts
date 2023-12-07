describe('useFeeSelectionModal', () => {
    describe('handleBlockTargetChange', () => {
        it('should set raw block target as provided value', () => {});
        it('should find nearest block target in fee estimations and set feeRate with it', () => {});

        describe('when feeEstimations is empty', () => {});
    });

    describe('handleFeeRateChange', () => {
        it('should set raw fee target as provided value', () => {});
        it('should find lowest block target in fee estimations and set blockTarget with it', () => {});

        describe('when feeEstimations is empty', () => {});
    });

    describe('when modal is closed', () => {
        it('should clear state', () => {});
    });

    describe('when modal is open', () => {
        it('should set state to current submitted values', () => {});
    });
});
