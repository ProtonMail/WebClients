import { useUser } from '@proton/account/user/hooks';
import type { FeedbackDowngradeData } from '@proton/payments/core/api/api';
import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { useModalTwoPromise } from '../../../../../components/modalTwo/useModalTwo';
import { componentsHookRenderer } from '../../../../contacts/tests/vitest/render';
import type { FeedbackDowngradeFormData, FeedbackDowngradeResult } from '../../content/interface';
import { useFeedbackStep } from '../useFeedbackStep';
import type { FeedbackStepResult } from '../useFeedbackStep';

vi.mock('@proton/account/user/hooks');
vi.mock('../../../../../components/modalTwo/useModalTwo');

const mockSendFeedbackModalCancelReport = vi.fn();
const mockSendFeedbackModalSubmitReport = vi.fn();

vi.mock('../../cancellationFlow/useCancellationTelemetry', () => ({
    __esModule: true,
    default: () => ({
        sendFeedbackModalCancelReport: mockSendFeedbackModalCancelReport,
        sendFeedbackModalSubmitReport: mockSendFeedbackModalSubmitReport,
    }),
}));

const mockShowModal = vi.fn();
const lumoSubscription = { ...buildSubscription(PLANS.LUMO), ID: 'sub-lumo' };

describe('useFeedbackStep', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(useModalTwoPromise).mockReturnValue([() => null, mockShowModal]);
        vi.mocked(useUser).mockReturnValue([{ ID: 'user-123' } as any, false]);
    });
    it('should return kept when canShow returns false', async () => {
        const { result } = componentsHookRenderer(() => useFeedbackStep({ canShow: async () => false }));

        const res = await result.current.show(lumoSubscription);

        expect(res).toEqual({ status: 'kept' });
        expect(mockShowModal).not.toHaveBeenCalled();
    });

    it('should return kept when modal result is a keep subscription value', async () => {
        mockShowModal.mockResolvedValue({ status: 'kept' });

        const { result } = componentsHookRenderer(() => useFeedbackStep({ canShow: async () => true }));

        const res = await result.current.show(lumoSubscription);

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

        const res = (await result.current.show(lumoSubscription)) as FeedbackStepResult;

        expect(res).toEqual({ status: 'feedback', feedback });
        expect(mockShowModal).toHaveBeenCalledWith({ subscription: lumoSubscription });
    });

    it('should render the feedback form for the subscription it was shown for', () => {
        let modalElement: any;
        vi.mocked(useModalTwoPromise).mockReturnValue([
            (cb: any) => {
                modalElement = cb({
                    subscription: lumoSubscription,
                    onResolve: vi.fn(),
                    onReject: vi.fn(),
                    onClose: vi.fn(),
                });
                return null;
            },
            mockShowModal,
        ] as any);

        componentsHookRenderer(() => useFeedbackStep({ canShow: async () => true }));

        expect(modalElement?.props?.children?.props?.subscription).toBe(lumoSubscription);
    });
});

describe('useFeedbackStep telemetry', () => {
    const mockOnResolve = vi.fn();

    // handleResolve is what the hook passes to FeedbackDowngradeContent as onResolve, so read it
    // off the modal element the hook builds: <Modal><FeedbackDowngradeContent onResolve={...} /></Modal>
    const getHandleResolve = (): ((result: FeedbackDowngradeResult) => void) => {
        let modalElement: any;

        vi.mocked(useModalTwoPromise).mockReturnValue([
            (cb: any) => {
                modalElement = cb({ onResolve: mockOnResolve, onReject: vi.fn(), onClose: vi.fn() });
                return null;
            },
            mockShowModal,
        ] as any);

        componentsHookRenderer(() => useFeedbackStep({ canShow: async () => true }));

        const handleResolve = modalElement?.props?.children?.props?.onResolve;

        return handleResolve;
    };

    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(useUser).mockReturnValue([{ ID: 'user-123' } as any, false]);
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
