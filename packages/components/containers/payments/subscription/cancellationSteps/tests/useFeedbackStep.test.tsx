import { useUser } from '@proton/account/user/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';
import type { FeedbackDowngradeData } from '@proton/payments/core/api/api';

import { useFeedbackStep } from '../useFeedbackStep';
import type { FeedbackStepResult } from '../useFeedbackStep';

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/components/components/modalTwo/useModalTwo');

const mockShowModal = jest.fn();

describe('useFeedbackStep', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        jest.mocked(useUser).mockReturnValue([{ ID: 'user-123' } as any, false]);
    });
    it('should return kept when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useFeedbackStep({ canShow: async () => false }));

        const res = await result.current.show();

        expect(res).toEqual({ status: 'kept' });
        expect(mockShowModal).not.toHaveBeenCalled();
    });

    it('should return kept when modal result is a keep subscription value', async () => {
        mockShowModal.mockResolvedValue({ status: 'kept' });

        const { result } = componentsHookRenderer(() => useFeedbackStep({ canShow: async () => true }));

        const res = await result.current.show();

        expect(res).toEqual({ status: 'kept' });
    });

    it('should return feedback when modal result contains feedback data', async () => {
        const feedback: FeedbackDowngradeData = {
            Reason: 'DIFFERENT_ACCOUNT',
            Feedback: 'test feedback',
            ReasonDetails: '',
            Context: 'mail',
        };
        mockShowModal.mockResolvedValue(feedback);

        const { result } = componentsHookRenderer(() => useFeedbackStep({ canShow: async () => true }));

        const res = (await result.current.show()) as FeedbackStepResult;

        expect(res).toEqual({ status: 'feedback', feedback });
    });
});
