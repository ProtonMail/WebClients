import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/vitest/render';
import { useCancelTrialStep } from '../useCancelTrialStep';

vi.mock('../../../../../components/modalTwo/useModalTwo');

const mockShowModal = vi.fn();
const subscription = { ...buildSubscription(PLANS.BUNDLE_PRO_2024, { IsTrial: true }), ID: 'sub-trial' };

describe('useCancelTrialStep', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
    });
    it('should call showModal when canShow returns true', async () => {
        const { result } = componentsHookRenderer(() => useCancelTrialStep({ canShow: async () => true }));

        await result.current.show(subscription);

        expect(mockShowModal).toHaveBeenCalledWith({ subscription });
    });

    it('should not call showModal when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useCancelTrialStep({ canShow: async () => false }));

        await result.current.show(subscription);

        expect(mockShowModal).not.toHaveBeenCalled();
    });
});
