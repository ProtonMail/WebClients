import { useUser } from '@proton/account/user/hooks';
import type { FeedbackDowngradeData } from '@proton/payments/core/api/api';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/render';
import type { FeedbackDowngradeFormData, FeedbackDowngradeResult } from '../../content/interface';
import { useFeedbackStep } from '../useFeedbackStep';
import type { FeedbackStepResult } from '../useFeedbackStep';

jest.mock('@proton/account/user/hooks');
jest.mock('../../../../../components/modalTwo/useModalTwo');

const mockSendFeedbackModalCancelReport = jest.fn();
const mockSendFeedbackModalSubmitReport = jest.fn();

jest.mock('../../cancellationFlow/useCancellationTelemetry', () => ({
    __esModule: true,
    default: () => ({
        sendFeedbackModalCancelReport: mockSendFeedbackModalCancelReport,
        sendFeedbackModalSubmitReport: mockSendFeedbackModalSubmitReport,
    }),
}));

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

describe('useFeedbackStep telemetry', () => {
    const mockOnResolve = jest.fn();

    // handleResolve is what the hook passes to FeedbackDowngradeContent as onResolve, so read it
    // off the modal element the hook builds: <Modal><FeedbackDowngradeContent onResolve={...} /></Modal>
    const getHandleResolve = (): ((result: FeedbackDowngradeResult) => void) => {
        let modalElement: any;

        jest.mocked(useModalTwoPromise).mockReturnValue([
            (cb: any) => {
                modalElement = cb({ onResolve: mockOnResolve, onReject: jest.fn(), onClose: jest.fn() });
                return null;
            },
            mockShowModal,
        ] as any);

        componentsHookRenderer(() => useFeedbackStep({ canShow: async () => true }));

        const handleResolve = modalElement?.props?.children?.props?.onResolve;

        return handleResolve;
    };

    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(useUser).mockReturnValue([{ ID: 'user-123' } as any, false]);
    });

    it('should send the cancel report when the result is a keep subscription value', () => {
        const handleResolve = getHandleResolve();

        handleResolve({ status: 'kept' });

        expect(mockSendFeedbackModalCancelReport).toHaveBeenCalledTimes(1);
        expect(mockSendFeedbackModalSubmitReport).not.toHaveBeenCalled();
    });

    it('should send the submit report when the result contains feedback', () => {
        const handleResolve = getHandleResolve();
        const feedback: FeedbackDowngradeFormData = {
            Reason: 'DIFFERENT_ACCOUNT',
            Feedback: 'test feedback',
            ReasonDetails: '',
            Context: 'mail',
        };

        handleResolve(feedback);

        expect(mockSendFeedbackModalSubmitReport).toHaveBeenCalledTimes(1);
        expect(mockSendFeedbackModalCancelReport).not.toHaveBeenCalled();
    });

    it('should forward the result to onResolve', () => {
        const handleResolve = getHandleResolve();

        handleResolve({ status: 'kept' });

        expect(mockOnResolve).toHaveBeenCalledWith({ status: 'kept' });
    });
});
