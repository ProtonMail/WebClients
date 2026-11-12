import { render, screen } from '@testing-library/react';

import type { AnswerNowPrompt } from '@proton/lumo-api-client/types-api';

import messagesReducer, { setAnswerNowPrompt } from '../../../../redux/slices/core/messages';
import { type ContentBlock, type Message, Role } from '../../../../types';
import { MessageComponent, type MessageComponentProps } from './MessageComponent';

jest.mock('../../../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ artifactsView: false }) }));
jest.mock('../../../../redux/hooks', () => ({ useLumoDispatch: () => jest.fn() }));
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => jest.fn() }));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));
jest.mock('./ArtifactEditMarker/ArtifactEditMarker', () => ({ ArtifactEditMarker: () => null }));
jest.mock('./CompactionMarker/CompactionMarker', () => ({ CompactionMarker: () => null }));
jest.mock('./UserMessage/UserMessage', () => ({ __esModule: true, default: () => null }));
jest.mock('./askUserQuestions/AskUserQuestionsToolMessage', () => ({ AskUserQuestionsToolMessage: () => null }));
jest.mock('../../../../providers/WebSearchProvider', () => ({
    useWebSearch: () => ({ isWebSearchButtonToggled: false }),
}));
jest.mock('../../../../providers/IsGuestProvider', () => ({ useIsGuest: () => false }));
jest.mock('../../../../hooks/useChatLimitGate', () => ({ useChatLimitGate: () => ({ isBlocked: false }) }));
jest.mock('../../../../hooks/useCopyNotification', () => ({
    useCopyNotification: () => ({ showCopyNotification: jest.fn() }),
}));
jest.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }));
jest.mock('@proton/components/components/modalTwo/useModalState', () => ({
    useModalStateWithData: () => [{ data: undefined }, jest.fn(), false],
}));
jest.mock('../../../Files', () => ({ ReferenceFilesButton: () => null }));
jest.mock('../../../Modals/AssistantFeedbackModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../Modals/LinkWarningModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../LumoAvatar/LumoAvatar/LumoAvatar', () => ({
    __esModule: true,
    default: ({ isGenerating }: { isGenerating: boolean }) => (
        <img alt={isGenerating ? 'Thinking avatar' : 'Idle avatar'} />
    ),
}));
jest.mock('./AssistantMessage/toolCallTimeline/RenderBlocks', () => ({
    RenderBlocks: ({ blocks }: { blocks: ContentBlock[] }) => (
        <div>
            Actual model reasoning
            {blocks.map((block, index) => (
                <div key={index}>{block.content}</div>
            ))}
        </div>
    ),
}));

it.each([false, true])(
    'renders queue updates through the memoized message wrapper with existing content: %s',
    (hasExistingContent) => {
        const message: Message = {
            id: 'message-1',
            conversationId: 'conversation-1',
            createdAt: '2026-10-20',
            role: Role.Assistant,
            placeholder: true,
            ...(hasExistingContent && {
                blocks: [
                    { type: 'text', content: 'I will read the file before summarizing it.' },
                    { type: 'tool_call', content: '{"name":"filesystem__fs_read","arguments":{"path":"report.txt"}}' },
                    { type: 'tool_result', content: 'Report contents: revenue increased by 15%.' },
                ] satisfies ContentBlock[],
            }),
        };
        const props: MessageComponentProps = {
            message,
            handleRegenerateMessage: jest.fn(),
            handleEditMessage: jest.fn(),
            siblingInfo: { idx: 0, count: 1, onPrev: jest.fn(), onNext: jest.fn() },
            messageChainRef: { current: null },
            sourcesContainerRef: { current: null },
            handleOpenSources: jest.fn(),
            handleOpenFiles: jest.fn(),
            handleOpenFilePreview: jest.fn(),
            messageChain: [message],
            isLastMessage: true,
            isGenerating: true,
        };
        const status: AnswerNowPrompt = {
            object: 'lumo.answer_now',
            job_id: '847b43e9-703a-4927-b4c7-22dd7194d284',
            wait: 1987,
        };
        let state = { [message.id]: message };
        const { rerender } = render(<MessageComponent {...props} />);
        expect(screen.queryByRole('button', { name: 'Answer now' })).not.toBeInTheDocument();

        const update = (status: AnswerNowPrompt | undefined) => {
            state = messagesReducer(state, setAnswerNowPrompt({ messageId: message.id, prompt: status }));
            rerender(<MessageComponent {...props} message={state[message.id]} />);
        };
        expect(screen.getByText('Actual model reasoning')).toBeInTheDocument();
        const expectExistingContent = () => {
            if (hasExistingContent) {
                expect(screen.getByText('I will read the file before summarizing it.')).toBeInTheDocument();
                expect(screen.getByText('Report contents: revenue increased by 15%.')).toBeInTheDocument();
            }
        };
        expectExistingContent();
        update(status);
        expect(screen.getByRole('button', { name: 'Answer now' })).toBeInTheDocument();
        expect(screen.getByText('Working on it...')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Idle avatar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Regenerate' })).toBeDisabled();
        expect(screen.queryByText('Actual model reasoning') !== null).toBe(hasExistingContent);
        expectExistingContent();
        expect(screen.queryByText(/about|1987/)).not.toBeInTheDocument();

        update({ ...status, wait: null });
        expect(screen.getByRole('button', { name: 'Answer now' })).toBeInTheDocument();
        expect(screen.queryByText('Actual model reasoning') !== null).toBe(hasExistingContent);
        expectExistingContent();

        update(undefined);
        expect(screen.queryByRole('button', { name: 'Answer now' })).not.toBeInTheDocument();
        expect(screen.queryByText('Working on it...')).not.toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Thinking avatar' })).toBeInTheDocument();
        expect(screen.getByText('Actual model reasoning')).toBeInTheDocument();
        expectExistingContent();
    }
);
