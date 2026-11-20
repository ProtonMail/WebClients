import { render, screen } from '@testing-library/react';

import type { AnswerNowPrompt } from '@proton/lumo-api-client/types-api';

import messagesReducer, { setAnswerNowPrompt } from '../../../../redux/slices/core/messages';
import { type ContentBlock, type Message, Role } from '../../../../types';
import { MessageComponent, type MessageComponentProps } from './MessageComponent';

vi.mock('../../../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ artifactsView: false }) }));
vi.mock('../../../../redux/hooks', () => ({ useLumoDispatch: () => vi.fn() }));
vi.mock('@proton/app-context/useApi', () => ({ useApi: () => vi.fn() }));
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('./ArtifactEditMarker/ArtifactEditMarker', () => ({ ArtifactEditMarker: () => null }));
vi.mock('./CompactionMarker/CompactionMarker', () => ({ CompactionMarker: () => null }));
vi.mock('./UserMessage/UserMessage', () => ({ __esModule: true, default: () => null }));
vi.mock('./askUserQuestions/AskUserQuestionsToolMessage', () => ({ AskUserQuestionsToolMessage: () => null }));
vi.mock('../../../../providers/WebSearchProvider', () => ({
    useWebSearch: () => ({ isWebSearchButtonToggled: false }),
}));
vi.mock('../../../../providers/IsGuestProvider', () => ({ useIsGuest: () => false }));
vi.mock('../../../../hooks/useChatLimitGate', () => ({ useChatLimitGate: () => ({ isBlocked: false }) }));
vi.mock('../../../../hooks/useCopyNotification', () => ({
    useCopyNotification: () => ({ showCopyNotification: vi.fn() }),
}));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }));
vi.mock('@proton/components/components/modalTwo/useModalState', () => ({
    useModalStateWithData: () => [{ data: undefined }, vi.fn(), false],
}));
vi.mock('../../../Files', () => ({ ReferenceFilesButton: () => null }));
vi.mock('../../../Modals/AssistantFeedbackModal', () => ({ __esModule: true, default: () => null }));
vi.mock('../../../Modals/LinkWarningModal', () => ({ __esModule: true, default: () => null }));
vi.mock('../../../LumoAvatar/LumoAvatar/LumoAvatar', () => ({
    __esModule: true,
    default: ({ isGenerating }: { isGenerating: boolean }) => (
        <img alt={isGenerating ? 'Thinking avatar' : 'Idle avatar'} />
    ),
}));
vi.mock('./AssistantMessage/toolCallTimeline/RenderBlocks', () => ({
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
            handleRegenerateMessage: vi.fn(),
            handleEditMessage: vi.fn(),
            siblingInfo: { idx: 0, count: 1, onPrev: vi.fn(), onNext: vi.fn() },
            messageChainRef: { current: null },
            sourcesContainerRef: { current: null },
            handleOpenSources: vi.fn(),
            handleOpenFiles: vi.fn(),
            handleOpenFilePreview: vi.fn(),
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
