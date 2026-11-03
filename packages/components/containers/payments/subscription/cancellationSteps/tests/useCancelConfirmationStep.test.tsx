import { useSubscription } from '@proton/account/subscription/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/render';
import type { CancelSubscriptionResult } from '../../cancelSubscription/types';
import { useCancelConfirmationStep } from '../useCancelConfirmationStep';

jest.mock('@proton/account/subscription/hooks');
jest.mock('../../../../../components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();
const mailSubscription = { ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' };
const lumoSubscription = { ...buildSubscription(PLANS.LUMO), ID: 'sub-lumo' };

describe('useCancelConfirmationStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        jest.mocked(useSubscription).mockReturnValue([mailSubscription, false]);
    });

    it('should return kept when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useCancelConfirmationStep({ canShow: async () => false }));

        const res = await result.current.show(lumoSubscription);

        expect(res).toEqual({ status: 'kept' });
        expect(mockShowModal).not.toHaveBeenCalled();
    });

    it('should return the modal result for the given subscription when canShow returns true', async () => {
        const modalResult: CancelSubscriptionResult = { status: 'cancelled' };
        mockShowModal.mockResolvedValue(modalResult);

        const { result } = componentsHookRenderer(() => useCancelConfirmationStep({ canShow: async () => true }));

        const res = await result.current.show(lumoSubscription);

        expect(res).toEqual({ status: 'cancelled' });
        expect(mockShowModal).toHaveBeenCalledWith({ subscription: lumoSubscription });
    });
});
