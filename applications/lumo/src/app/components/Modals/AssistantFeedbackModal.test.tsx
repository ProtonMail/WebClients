import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import type { Message } from '../../types';
import { Role } from '../../types-api';
import { hasSeenNegativeFeedbackIntro } from '../../util/feedbackIntroStorage';
import { canUseNativeRightPanelLayout } from '../../util/userAgent';
import AssistantFeedbackModal from './AssistantFeedbackModal';

vi.mock('@proton/app-context/useApi', () => ({ useApi: () => vi.fn() }));
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_VERSION: 'test' }) }));
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('@proton/components/hooks/useErrorHandler', () => ({ __esModule: true, default: () => vi.fn() }));
vi.mock('../../redux/hooks', () => ({ useLumoSelector: () => false, useLumoStore: () => ({ getState: vi.fn() }) }));
vi.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
vi.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
vi.mock('../../providers/RightPanelProvider', () => ({
    useOptionalRightPanel: () => ({ isOpen: true, isOverlay: false }),
}));
vi.mock('../../remote/nativeComposerBridgeHelpers');
vi.mock('../../util/userAgent', () => ({
    canShowWebComposer: () => false,
    canUseNativeSidebarLayout: () => true,
    canUseNativeRightPanelLayout: vi.fn(),
    getNativeAppInfo: () => ({ platform: 'ios', version: '2.2.0' }),
}));
vi.mock('../../util/feedbackIntroStorage', () => ({ hasSeenNegativeFeedbackIntro: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

it.each([
    { introSeen: false, canFitRightPanel: false, dismiss: () => screen.findByTestId('modal:close') },
    { introSeen: true, canFitRightPanel: false, dismiss: () => screen.findByText('Cancel') },
    { introSeen: false, canFitRightPanel: true, dismiss: () => screen.findByTestId('modal:close') },
    { introSeen: true, canFitRightPanel: true, dismiss: () => screen.findByText('Cancel') },
])(
    'restores the fitted or covered layout after feedback closes (intro seen: $introSeen, fitting supported: $canFitRightPanel)',
    async ({ introSeen, canFitRightPanel, dismiss }) => {
        vi.mocked(canUseNativeRightPanelLayout).mockReturnValue(canFitRightPanel);
        vi.mocked(hasSeenNegativeFeedbackIntro).mockReturnValue(introSeen);
        const message: Message = {
            id: 'response',
            conversationId: 'conversation',
            createdAt: '2026-11-04T12:00:00Z',
            role: Role.Assistant,
            status: 'succeeded',
            content: 'Disposable test response',
        };
        render(
            <AssistantFeedbackModal
                message={message}
                disabled={false}
                feedbackSubmitted={false}
                setFeedbackSubmitted={vi.fn()}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

        fireEvent.click(await dismiss());

        await waitFor(() => expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(canFitRightPanel));
    }
);
