import { renderHook } from '@testing-library/react';
import loudRejection from 'loud-rejection';
import type { Mock } from 'vitest';

import type { MessageStateWithData } from '@proton/mail-message/store/messages/messagesTypes';

import useScheduleSendFeature from '../../components/composer/actions/scheduleSend/useScheduleSendFeature';
import { clearAll } from '../../test-helpers/helpers';
import { useComposerHost } from './useComposerHost';
import { useScheduleSend } from './useScheduleSend';

loudRejection();

const mockUseScheduleSendFeature = (value?: Partial<ReturnType<typeof useScheduleSendFeature>>) =>
    vi.mocked(useScheduleSendFeature).mockReturnValue({
        canScheduleSend: false,
        canScheduleSendCustom: false,
        loading: false,
        ...value,
    });

// Mock functions - lazily referenced by the vi.mock factories below
const mockUseLocation = vi.fn(() => ({ pathname: '/inbox' }));
const mockUseFlag = vi.fn();
const mockDispatch = vi.fn();
const mockSetModalOpen = vi.fn((value: boolean) => value);
const mockPreliminaryVerifications = vi.fn();

vi.mock('react-router-dom', () => ({
    useLocation: () => mockUseLocation(),
}));

vi.mock('../../components/composer/actions/scheduleSend/useScheduleSendFeature', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => mockUseFlag(),
}));

vi.mock('../../store/hooks', () => ({
    useComposerDispatch: () => mockDispatch,
}));

vi.mock('@proton/components/components/modalTwo/useModalState', () => ({
    __esModule: true,
    default: () => [
        {
            open: false,
            onClose: vi.fn(),
            onExit: vi.fn(),
        },
        mockSetModalOpen,
    ],
}));

vi.mock('@proton/components/components/prompt/Prompt', () => ({
    __esModule: true,
    default: ({ children, ...props }: any) => <div data-testid={props['data-testid']}>{children}</div>,
}));

vi.mock('@proton/atoms/Button/Button', () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('ttag', () => ({
    c: (_context: string) => ({
        t: (text: string) => text,
    }),
}));

vi.mock('./useComposerHost');
const mockUseComposerHost = useComposerHost as Mock;

vi.mock('./useSendVerifications', () => ({
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
    const mockSetInnerModal = vi.fn();
    const mockSetModelMessage = vi.fn();
    const mockHandleSend = vi.fn();
    const mockHandleNoRecipients = vi.fn();
    const mockHandleNoSubjects = vi.fn();
    const mockHandleNoAttachments = vi.fn();
    const mockHandleNoReplyEmail = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
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

        mockUseComposerHost.mockReturnValue({
            scheduledCount: mockOverrides?.scheduleCount ?? 0,
            scheduledCountLoading: mockOverrides?.loadingScheduleCount ?? false,
            onMessageSent: vi.fn(),
            onDraftDiscarded: vi.fn(),
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

    describe.todo('handleScheduleSendModal');

    describe.todo('handleScheduleSend');

    describe('scheduleCount', () => {
        it('should return the scheduled count from the composer host', () => {
            const modelMessage = createMockMessage();

            const { scheduleCount } = setup(modelMessage, { scheduleCount: 10 });

            expect(scheduleCount).toBe(10);
        });

        it('should handle zero scheduled messages', () => {
            const modelMessage = createMockMessage();

            const { scheduleCount } = setup(modelMessage, { scheduleCount: 0 });

            expect(scheduleCount).toBe(0);
        });
    });

    describe('loadingScheduleCount', () => {
        it('should expose the loading state from the composer host', () => {
            const modelMessage = createMockMessage();

            const { loadingScheduleCount } = setup(modelMessage, { loadingScheduleCount: true });

            expect(loadingScheduleCount).toBe(true);
        });

        it('should be false once the composer host has loaded the count', () => {
            const modelMessage = createMockMessage();

            const { loadingScheduleCount } = setup(modelMessage, { loadingScheduleCount: false });

            expect(loadingScheduleCount).toBe(false);
        });
    });
});
