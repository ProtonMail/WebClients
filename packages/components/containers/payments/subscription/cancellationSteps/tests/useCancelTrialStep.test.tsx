import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/render';
import { useCancelTrialStep } from '../useCancelTrialStep';

jest.mock('../../../../../components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();
const subscription = { ...buildSubscription(PLANS.BUNDLE_PRO_2024, { IsTrial: true }), ID: 'sub-trial' };

describe('useCancelTrialStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
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
