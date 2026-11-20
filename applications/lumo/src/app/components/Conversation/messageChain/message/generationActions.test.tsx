import { createRef } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import { useGenerationInProgress } from '../../../../hooks/useGenerationInProgress';
import { generationRegistry } from '../../../../services/generation/generationRegistry';
import type { Message } from '../../../../types';
import { Role } from '../../../../types';
import AssistantMessage from './AssistantMessage/AssistantMessage';
import UserMessage from './UserMessage/UserMessage';

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }));
vi.mock('../../../../hooks/useChatLimitGate', () => ({ useChatLimitGate: () => ({ isBlocked: false }) }));
vi.mock('../../../../hooks/useCopyNotification', () => ({
    useCopyNotification: () => ({ showCopyNotification: vi.fn() }),
}));
vi.mock('../../../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({}) }));
vi.mock('../../../../providers', () => ({ useLumoTheme: () => ({ isDarkLumoTheme: false }) }));
vi.mock('../../../../providers/IsGuestProvider', () => ({ useIsGuest: () => true }));
vi.mock('../../../../providers/WebSearchProvider', () => ({
    useWebSearch: () => ({ isWebSearchButtonToggled: false }),
}));
vi.mock('../../../../redux/hooks', () => ({ useLumoSelector: () => ({}), useLumoDispatch: () => vi.fn() }));
vi.mock('../../../../util/telemetry', () => ({ sendMessageEditEvent: vi.fn() }));
vi.mock('../../../Files', () => ({ ReferenceFilesButton: () => null }));
vi.mock('../../../Files/Common', () => ({ AttachmentFileCard: () => null }));
vi.mock('../../../LumoAvatar/LumoAvatar/LumoAvatar', () => ({ default: () => null }));
vi.mock('../../../LumoIcon/LumoIcon', () => ({
    LumoIcon: (props: { 'aria-label'?: string }) => <span>{props['aria-label']}</span>,
}));
vi.mock('../../../Modals/AssistantFeedbackModal', () => ({ default: () => null }));
vi.mock('../../../Modals/LinkWarningModal', () => ({ default: () => null }));
vi.mock('../../../SiblingSelector', () => ({ default: () => null }));
vi.mock('../../artifact/ArtifactChip', () => ({ ArtifactChip: () => null }));
vi.mock('../../artifact/ArtifactChipLoading', () => ({ ArtifactChipLoading: () => null }));
vi.mock('../../artifact/ArtifactActionUserMessage', () => ({ ArtifactActionUserMessage: () => null }));
vi.mock('./actionToolbar/LumoCopyButton', () => ({ default: () => null }));
vi.mock('./askUserQuestions/AskUserQuestionsToolMessage', () => ({ AskUserQuestionsToolMessage: () => null }));
vi.mock('./createSchedule/CreateScheduleToolMessage', () => ({ CreateScheduleToolMessage: () => null }));
vi.mock('./toolCall/SourcesBlock', () => ({ SourcesButton: () => null }));
vi.mock('./AssistantMessage/SuggestedQuestions', () => ({ SuggestedQuestions: () => null }));
vi.mock('./AssistantMessage/toolCallTimeline/RenderBlocks', () => ({ RenderBlocks: () => null }));
vi.mock('./UserMessage/useNativeMessageEdit', () => ({ default: () => ({ startNativeEdit: vi.fn() }) }));
vi.mock('./useCollapsibleMessageContent', () => ({
    default: () => ({
        contentRef: { current: null },
        isCollapsed: false,
        showCollapseButton: false,
        toggleCollapse: vi.fn(),
    }),
}));

afterEach(() => {
    act(() => generationRegistry.abortAll());
});

it('keeps Edit and Regenerate disabled until Stop cleanup releases the conversation', () => {
    const userMessage = { id: 'question', conversationId: 'chat', role: Role.User, content: 'Original' } as Message;
    const assistantMessage = {
        id: 'answer',
        conversationId: 'chat',
        role: Role.Assistant,
        content: 'Partial answer',
        status: 'succeeded',
    } as Message;
    const edit = vi.fn();
    const retry = vi.fn();
    const ref = createRef<HTMLDivElement>();
    const siblingInfo = { idx: 0, count: 1, onPrev: vi.fn(), onNext: vi.fn() };
    const Messages = () => {
        const isGenerating = useGenerationInProgress('chat');
        return (
            <>
                <UserMessage
                    message={userMessage}
                    messageContent={userMessage.content}
                    siblingInfo={siblingInfo}
                    handleEditMessage={edit}
                    isGenerating={isGenerating}
                    onOpenFilePreview={vi.fn()}
                />
                <AssistantMessage
                    message={assistantMessage}
                    messageChain={[userMessage, assistantMessage]}
                    handleRegenerateMessage={vi.fn()}
                    siblingInfo={siblingInfo}
                    isLastMessage
                    isRunning={false}
                    onToggleMessageSource={vi.fn()}
                    onToggleFilesManagement={vi.fn()}
                    isGenerating={isGenerating}
                    messageChainRef={ref}
                    sourcesContainerRef={ref}
                    handleOpenSources={vi.fn()}
                    handleOpenFiles={vi.fn()}
                    onRetryPanelToggle={retry}
                />
            </>
        );
    };
    generationRegistry.start('chat');
    render(<Messages />);
    act(() => generationRegistry.abort('chat'));
    const editButton = screen.getByRole('button', { name: 'Edit' });
    const regenerateButton = screen.getByRole('button', { name: 'Regenerate' });
    expect(editButton).toBeDisabled();
    expect(regenerateButton).toBeDisabled();
    fireEvent.click(editButton);
    fireEvent.click(regenerateButton);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(retry).not.toHaveBeenCalled();

    act(() => generationRegistry.finish('chat'));
    expect(editButton).toBeEnabled();
    expect(regenerateButton).toBeEnabled();
    fireEvent.click(regenerateButton);
    expect(retry).toHaveBeenCalledWith('answer', true, regenerateButton);
    fireEvent.click(editButton);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Edited after Stop' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(edit).toHaveBeenCalledWith(userMessage, 'Edited after Stop', false);
});
