import { renderHook } from '@testing-library/react-hooks';
import loudRejection from 'loud-rejection';

import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { clearAll } from '../../helpers/test/helper';
import { mockUseScheduleSendFeature } from '../../helpers/test/mockUseScheduleSendFeature';
import { useScheduleSend } from './useScheduleSend';

loudRejection();

// Mock functions - using 'mock' prefix allows Jest to hoist these properly
const mockUseLocation = jest.fn(() => ({ pathname: '/inbox' }));
const mockUseFlag = jest.fn();
const mockDispatch = jest.fn();
const mockSetModalOpen = jest.fn((value: boolean) => value);
const mockPreliminaryVerifications = jest.fn();

jest.mock('react-router-dom', () => ({
    useLocation: () => mockUseLocation(),
}));

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    default: () => mockUseFlag(),
}));

jest.mock('proton-mail/store/hooks', () => ({
    useMailDispatch: () => mockDispatch,
}));

jest.mock('@proton/components/components/modalTwo/useModalState', () => ({
    __esModule: true,
    default: () => [
        {
            open: false,
            onClose: jest.fn(),
            onExit: jest.fn(),
        },
        mockSetModalOpen,
    ],
}));

jest.mock('@proton/components/components/prompt/Prompt', () => ({
    __esModule: true,
    default: ({ children, ...props }: any) => <div data-testid={props['data-testid']}>{children}</div>,
}));

jest.mock('@proton/atoms/Button/Button', () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('ttag', () => ({
    c: (_context: string) => ({
        t: (text: string) => text,
    }),
}));

jest.mock('@proton/mail/store/mailSettings/hooks', () => ({
    useMailSettings: () => [{ ViewMode: 0 }, false],
}));

jest.mock('@proton/mail/store/counts/conversationCountsSlice');
const mockUseConversationCounts = useConversationCounts as jest.Mock;

jest.mock('@proton/mail/store/counts/messageCountsSlice');
const mockUseMessageCounts = useMessageCounts as jest.Mock;

jest.mock('./useSendVerifications', () => ({
    useSendVerifications: () => ({
        preliminaryVerifications: () => mockPreliminaryVerifications(),
    }),
}));

const createMockMessage = (overrides?: Partial<MessageStateWithData>): MessageStateWithData =>
    ({
        localID: 'test-message-id',
        data: {
            ID: 'test-message-id',
            Subject: 'Test Subject',
            ToList: [{ Address: 'test@example.com', Name: 'Test' }],
            CCList: [],
            BCCList: [],
            Attachments: [],
        },
        draftFlags: {},
        ...overrides,
    }) as MessageStateWithData;

describe('useScheduleSend', () => {
    // Props that are passed to the hook
    const mockSetInnerModal = jest.fn();
    const mockSetModelMessage = jest.fn();
    const mockHandleSend = jest.fn();
    const mockHandleNoRecipients = jest.fn();
    const mockHandleNoSubjects = jest.fn();
    const mockHandleNoAttachments = jest.fn();
    const mockHandleNoReplyEmail = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockPreliminaryVerifications.mockResolvedValue(undefined);
        mockUseFlag.mockReturnValue(false);
    });

    afterEach(clearAll);

    const setup = (
        modelMessage: MessageStateWithData,
        mockOverrides?: {
            canScheduleSend?: boolean;
            scheduleCount?: number;
            isRetentionPoliciesEnabled?: boolean;
        }
    ) => {
        // Setup feature flag mocks
        mockUseScheduleSendFeature({
            canScheduleSend: mockOverrides?.canScheduleSend ?? true,
            canScheduleSendCustom: false,
            loading: false,
        });

        mockUseFlag.mockReturnValue(mockOverrides?.isRetentionPoliciesEnabled ?? false);

        // Setup count mocks
        const scheduleCount = mockOverrides?.scheduleCount ?? 0;
        mockUseConversationCounts.mockReturnValue([
            [{ LabelID: MAILBOX_LABEL_IDS.SCHEDULED, Total: scheduleCount }],
            false,
        ]);
        mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.SCHEDULED, Total: scheduleCount }], false]);

        const { result } = renderHook(() =>
            useScheduleSend({
                modelMessage,
                setInnerModal: mockSetInnerModal,
                ComposerInnerModal: { ScheduleSend: 'ScheduleSend' },
                setModelMessage: mockSetModelMessage,
                handleSend: mockHandleSend,
                handleNoRecipients: mockHandleNoRecipients,
                handleNoSubjects: mockHandleNoSubjects,
                handleNoAttachments: mockHandleNoAttachments,
                handleNoReplyEmail: mockHandleNoReplyEmail,
            })
        );

        return { ...result.current, modelMessage };
    };

    describe('canScheduleSend', () => {
        it('should return true when feature is enabled and no expiration', () => {
            const modelMessage = createMockMessage();

            const { canScheduleSend } = setup(modelMessage);

            expect(canScheduleSend).toBe(true);
        });

        it('should return false when feature is disabled', () => {
            const modelMessage = createMockMessage();

            const { canScheduleSend } = setup(modelMessage, { canScheduleSend: false });

            expect(canScheduleSend).toBe(false);
        });

        it('should return false when message has expiresIn and retention policies disabled', () => {
            const modelMessage = createMockMessage({
                draftFlags: { expiresIn: new Date(Date.now() + 3600 * 1000) },
            });

            const { canScheduleSend } = setup(modelMessage, { isRetentionPoliciesEnabled: false });

            expect(canScheduleSend).toBe(false);
        });

        it('should return false when message has ExpirationTime and retention policies disabled', () => {
            const modelMessage = createMockMessage({
                data: {
                    ExpirationTime: Math.floor(Date.now() / 1000) + 3600,
                } as any,
            });

            const { canScheduleSend } = setup(modelMessage, { isRetentionPoliciesEnabled: false });

            expect(canScheduleSend).toBe(false);
        });

        it('should return true when message has expiration but retention policies enabled', () => {
            const modelMessage = createMockMessage({
                draftFlags: { expiresIn: new Date(Date.now() + 3600 * 1000) },
            });

            const { canScheduleSend } = setup(modelMessage, { isRetentionPoliciesEnabled: true });

            expect(canScheduleSend).toBe(true);
        });
    });

    describe('handleScheduleSendModal', () => {
        // TODO: Implement test for handleScheduleSendModal
    });

    describe('handleScheduleSend', () => {
        // TODO: Implement test for handleScheduleSend
    });

    describe('scheduleCount', () => {
        it('should return the schedule count from label counts', () => {
            const modelMessage = createMockMessage();

            const { scheduleCount } = setup(modelMessage, { scheduleCount: 10 });

            expect(scheduleCount.Total).toBe(10);
        });

        it('should handle zero scheduled messages', () => {
            const modelMessage = createMockMessage();

            const { scheduleCount } = setup(modelMessage, { scheduleCount: 0 });

            expect(scheduleCount.Total).toBe(0);
        });
    });
});
