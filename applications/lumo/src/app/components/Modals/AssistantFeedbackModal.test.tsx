import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import type { Message } from '../../types';
import { Role } from '../../types-api';
import { hasSeenNegativeFeedbackIntro } from '../../util/feedbackIntroStorage';
import { canUseNativeRightPanelLayout } from '../../util/userAgent';
import AssistantFeedbackModal from './AssistantFeedbackModal';

jest.mock('@proton/app-context/useApi', () => ({ useApi: () => jest.fn() }));
jest.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_VERSION: 'test' }) }));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));
jest.mock('@proton/components/hooks/useErrorHandler', () => ({ __esModule: true, default: () => jest.fn() }));
jest.mock('../../redux/hooks', () => ({ useLumoSelector: () => false, useLumoStore: () => ({ getState: jest.fn() }) }));
jest.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
jest.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
jest.mock('../../providers/RightPanelProvider', () => ({
    useOptionalRightPanel: () => ({ isOpen: true, isOverlay: false }),
}));
jest.mock('../../remote/nativeComposerBridgeHelpers');
jest.mock('../../util/userAgent', () => ({
    canShowWebComposer: () => false,
    canUseNativeSidebarLayout: () => true,
    canUseNativeRightPanelLayout: jest.fn(),
    getNativeAppInfo: () => ({ platform: 'ios', version: '2.2.0' }),
}));
jest.mock('../../util/feedbackIntroStorage', () => ({ hasSeenNegativeFeedbackIntro: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it.each([
    { introSeen: false, canFitRightPanel: false, dismiss: () => screen.findByTestId('modal:close') },
    { introSeen: true, canFitRightPanel: false, dismiss: () => screen.findByText('Cancel') },
    { introSeen: false, canFitRightPanel: true, dismiss: () => screen.findByTestId('modal:close') },
    { introSeen: true, canFitRightPanel: true, dismiss: () => screen.findByText('Cancel') },
])(
    'restores the fitted or covered layout after feedback closes (intro seen: $introSeen, fitting supported: $canFitRightPanel)',
    async ({ introSeen, canFitRightPanel, dismiss }) => {
        jest.mocked(canUseNativeRightPanelLayout).mockReturnValue(canFitRightPanel);
        jest.mocked(hasSeenNegativeFeedbackIntro).mockReturnValue(introSeen);
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
                setFeedbackSubmitted={jest.fn()}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Report an issue' }));
        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

        fireEvent.click(await dismiss());

        await waitFor(() => expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(canFitRightPanel));
    }
);
