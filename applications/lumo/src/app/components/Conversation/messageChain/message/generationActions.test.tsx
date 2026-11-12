import { createRef } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import { useGenerationInProgress } from '../../../../hooks/useGenerationInProgress';
import { generationRegistry } from '../../../../services/generation/generationRegistry';
import type { Message } from '../../../../types';
import { Role } from '../../../../types';
import AssistantMessage from './AssistantMessage/AssistantMessage';
import UserMessage from './UserMessage/UserMessage';

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));
jest.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }));
jest.mock('../../../../hooks/useChatLimitGate', () => ({ useChatLimitGate: () => ({ isBlocked: false }) }));
jest.mock('../../../../hooks/useCopyNotification', () => ({
    useCopyNotification: () => ({ showCopyNotification: jest.fn() }),
}));
jest.mock('../../../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({}) }));
jest.mock('../../../../providers', () => ({ useLumoTheme: () => ({ isDarkLumoTheme: false }) }));
jest.mock('../../../../providers/IsGuestProvider', () => ({ useIsGuest: () => true }));
jest.mock('../../../../providers/WebSearchProvider', () => ({
    useWebSearch: () => ({ isWebSearchButtonToggled: false }),
}));
jest.mock('../../../../redux/hooks', () => ({ useLumoSelector: () => ({}), useLumoDispatch: () => jest.fn() }));
jest.mock('../../../../util/telemetry', () => ({ sendMessageEditEvent: jest.fn() }));
jest.mock('../../../Files', () => ({ ReferenceFilesButton: () => null }));
jest.mock('../../../Files/Common', () => ({ AttachmentFileCard: () => null }));
jest.mock('../../../LumoAvatar/LumoAvatar/LumoAvatar', () => () => null);
jest.mock('../../../LumoIcon/LumoIcon', () => ({
    LumoIcon: (props: { 'aria-label'?: string }) => <span>{props['aria-label']}</span>,
}));
jest.mock('../../../Modals/AssistantFeedbackModal', () => () => null);
jest.mock('../../../Modals/LinkWarningModal', () => () => null);
jest.mock('../../../SiblingSelector', () => () => null);
jest.mock('../../artifact/ArtifactChip', () => ({ ArtifactChip: () => null }));
jest.mock('../../artifact/ArtifactChipLoading', () => ({ ArtifactChipLoading: () => null }));
jest.mock('../../artifact/ArtifactActionUserMessage', () => ({ ArtifactActionUserMessage: () => null }));
jest.mock('./actionToolbar/LumoCopyButton', () => () => null);
jest.mock('./askUserQuestions/AskUserQuestionsToolMessage', () => ({ AskUserQuestionsToolMessage: () => null }));
jest.mock('./createSchedule/CreateScheduleToolMessage', () => ({ CreateScheduleToolMessage: () => null }));
jest.mock('./toolCall/SourcesBlock', () => ({ SourcesButton: () => null }));
jest.mock('./AssistantMessage/SuggestedQuestions', () => ({ SuggestedQuestions: () => null }));
jest.mock('./AssistantMessage/toolCallTimeline/RenderBlocks', () => ({ RenderBlocks: () => null }));
jest.mock('./UserMessage/useNativeMessageEdit', () => () => ({ startNativeEdit: jest.fn() }));
jest.mock('./useCollapsibleMessageContent', () => () => ({
    contentRef: { current: null },
    isCollapsed: false,
    showCollapseButton: false,
    toggleCollapse: jest.fn(),
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
    const edit = jest.fn();
    const retry = jest.fn();
    const ref = createRef<HTMLDivElement>();
    const siblingInfo = { idx: 0, count: 1, onPrev: jest.fn(), onNext: jest.fn() };
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
                    onOpenFilePreview={jest.fn()}
                />
                <AssistantMessage
                    message={assistantMessage}
                    messageChain={[userMessage, assistantMessage]}
                    handleRegenerateMessage={jest.fn()}
                    siblingInfo={siblingInfo}
                    isLastMessage
                    isRunning={false}
                    onToggleMessageSource={jest.fn()}
                    onToggleFilesManagement={jest.fn()}
                    isGenerating={isGenerating}
                    messageChainRef={ref}
                    sourcesContainerRef={ref}
                    handleOpenSources={jest.fn()}
                    handleOpenFiles={jest.fn()}
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
