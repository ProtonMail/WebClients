import { useSubscription } from '@proton/account/subscription/hooks';
import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';
import { buildSubscription } from '@proton/testing/builders';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import type { CancelSubscriptionResult } from '../../cancelSubscription/types';
import { useCancelConfirmationStep } from '../useCancelConfirmationStep';

jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/components/components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();
const subscription = buildSubscription();

describe('useCancelConfirmationStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        jest.mocked(useSubscription).mockReturnValue([subscription, false]);
    });
    it('should return kept when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useCancelConfirmationStep({ canShow: async () => false }));

        const res = await result.current.show();

        expect(res).toEqual({ status: 'kept' });
        expect(mockShowModal).not.toHaveBeenCalled();
    });

    it('should return the modal result when canShow returns true', async () => {
        const modalResult: CancelSubscriptionResult = { status: 'cancelled' };
        mockShowModal.mockResolvedValue(modalResult);

        const { result } = componentsHookRenderer(() => useCancelConfirmationStep({ canShow: async () => true }));

        const res = await result.current.show();

        expect(res).toEqual({ status: 'cancelled' });
    });
});
