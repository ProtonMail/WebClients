import { renderHook } from '@testing-library/react-hooks';
import loudRejection from 'loud-rejection';

import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { SafeLabelCount } from '@proton/shared/lib/interfaces';

import { clearAll } from '../../helpers/test/helper';
import { mockUseScheduleSendFeature } from '../../helpers/test/mockUseScheduleSendFeature';
import { useMailboxCounter } from '../mailboxCounter/useMailboxCounter';
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
    useFlag: () => mockUseFlag(),
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

jest.mock('../mailboxCounter/useMailboxCounter');
const mockUseMailboxCounter = useMailboxCounter as jest.Mock;
const mockGetLocationCount = jest.fn();

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
            loadingScheduleCount?: boolean;
        }
    ) => {
        // Setup feature flag mocks
        mockUseScheduleSendFeature({
            canScheduleSend: mockOverrides?.canScheduleSend ?? true,
            canScheduleSendCustom: false,
            loading: false,
        });

        mockUseFlag.mockReturnValue(mockOverrides?.isRetentionPoliciesEnabled ?? false);

        // Setup mailbox counter mock
        const scheduleCount: SafeLabelCount = {
            LabelID: MAILBOX_LABEL_IDS.SCHEDULED,
            Total: mockOverrides?.scheduleCount ?? 0,
            Unread: 0,
        };
        mockGetLocationCount.mockReturnValue(scheduleCount);
        mockUseMailboxCounter.mockReturnValue({
            loading: mockOverrides?.loadingScheduleCount ?? false,
            counterMap: {},
            getLocationCount: mockGetLocationCount,
            getCurrentLocationCount: jest.fn(),
        });

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
        it('should return the scheduled location count from the mailbox counter', () => {
            const modelMessage = createMockMessage();

            const { scheduleCount } = setup(modelMessage, { scheduleCount: 10 });

            expect(mockGetLocationCount).toHaveBeenCalledWith(MAILBOX_LABEL_IDS.SCHEDULED);
            expect(scheduleCount.Total).toBe(10);
        });

        it('should handle zero scheduled messages', () => {
            const modelMessage = createMockMessage();

            const { scheduleCount } = setup(modelMessage, { scheduleCount: 0 });

            expect(scheduleCount.Total).toBe(0);
        });
    });

    describe('loadingScheduleCount', () => {
        it('should expose the loading state from the mailbox counter', () => {
            const modelMessage = createMockMessage();

            const { loadingScheduleCount } = setup(modelMessage, { loadingScheduleCount: true });

            expect(loadingScheduleCount).toBe(true);
        });

        it('should be false once the mailbox counter has loaded', () => {
            const modelMessage = createMockMessage();

            const { loadingScheduleCount } = setup(modelMessage, { loadingScheduleCount: false });

            expect(loadingScheduleCount).toBe(false);
        });
    });
});
