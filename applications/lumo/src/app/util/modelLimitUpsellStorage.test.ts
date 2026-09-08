import { hasDismissedModelLimitUpsell, markModelLimitUpsellDismissed } from './modelLimitUpsellStorage';

describe('modelLimitUpsellStorage', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('persists dismissal separately for each exhausted model', () => {
        markModelLimitUpsellDismissed('max');

        expect(hasDismissedModelLimitUpsell('max')).toBe(true);
        expect(hasDismissedModelLimitUpsell('lite')).toBe(false);
    });
});
