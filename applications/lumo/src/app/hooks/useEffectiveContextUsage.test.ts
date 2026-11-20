import { createElement } from 'react';

import { act, render, renderHook, screen, waitFor } from '@testing-library/react';

import { createDesktopClientToolExecutor } from '@proton/lumo-api-client/core/desktop-tools';
import type { ChatCompletionsFunctionTool } from '@proton/lumo-api-client/core/types';

import { ContextProgressIndicator } from '../components/Context/ContextProgressIndicator';
import { ContextSizeWarning } from '../components/Context/ContextSizeWarning';
import { prepareRequest } from '../llm';
import { fillAttachmentData } from '../llm/attachments';
import { deriveContextLimits } from '../llm/contextLimits';
import { getRequestBudget } from '../llm/requestBudget';
import type { LumoDispatch, LumoState } from '../redux/store';
import { type Attachment, type Message, Role } from '../types';
import { useEffectiveContextUsage } from './useEffectiveContextUsage';

jest.mock('@proton/app-context/useApi', () => {
    const api = jest.fn();
    return { useApi: () => api };
});
jest.mock('@proton/lumo-api-client/core/desktop-tools', () => ({
    ...jest.requireActual('@proton/lumo-api-client/core/desktop-tools'),
    isDesktopEnvironment: () => true,
    createDesktopClientToolExecutor: jest.fn(),
}));
jest.mock('../providers/IsGuestProvider', () => ({ useIsGuest: () => false }));
jest.mock('./useLumoPlan', () => ({ useLumoPlan: () => ({ hasLumoPlus: true }) }));
jest.mock('./useLumoFlags', () => ({ useLumoFlags: () => ({}) }));
jest.mock('./useContextLimits', () => ({
    useRequestBudget: () => budget,
    useContextLimits: () => deriveContextLimits(100_000),
}));
jest.mock('../llm/attachments', () => ({
    ...jest.requireActual('../llm/attachments'),
    fillAttachmentData: jest.fn(),
}));
jest.mock('../redux/hooks', () => ({
    useLumoDispatch: () => dispatch,
    useLumoSelector: (selector: (state: LumoState) => unknown, equals = Object.is) => {
        const { useRef } = jest.requireActual('react');
        const value = selector(state);
        const previous = useRef(value);
        if (!equals(previous.current, value)) {
            previous.current = value;
        }
        return previous.current;
    },
    useLumoMemoSelector: (selector: (id?: string) => (state: LumoState) => unknown, [id]: [string?]) =>
        selector(id)(state),
}));

const budget = getRequestBudget({ limits: deriveContextLimits(100_000), calibration: 1.25 });
const file = {
    id: 'notes',
    filename: 'notes.txt',
    markdown: 'Meeting notes: Friday launch.',
    tokenCount: 40,
    processing: false,
} as Attachment;
const question: Message = {
    id: 'question',
    conversationId: 'conversation',
    createdAt: '',
    role: Role.User,
    content: 'When do we launch?',
    attachments: [{ id: file.id, filename: file.filename }] as Attachment[],
};
const initialState = {
    conversations: { conversation: { id: 'conversation', spaceId: 'space' } },
    spaces: {},
    messages: { question },
    attachments: { notes: { ...file, markdown: undefined } },
    skills: { status: 'ready', skills: {} },
    composerActions: { pendingAgentId: null, pendingArtifactCreation: null },
    lumoUserSettings: {},
    contextFilters: { filters: [] },
} as unknown as LumoState;
let state = initialState;
const dispatch = ((action: unknown) =>
    typeof action === 'function' ? action(dispatch, () => state) : action) as LumoDispatch;

beforeEach(() => {
    jest.clearAllMocks();
    state = structuredClone(initialState);
    jest.mocked(fillAttachmentData).mockResolvedValue([file]);
    jest.mocked(createDesktopClientToolExecutor).mockReturnValue({
        getClientTools: async () => [],
        canExecute: () => true,
        execute: async () => [],
    });
});

it('shows an unavailable notice on initial failure and recovers after a connector refresh', async () => {
    jest.mocked(fillAttachmentData).mockRejectedValueOnce(new Error('Attachment unavailable'));
    render(createElement(ContextProgressIndicator, { messageChain: [question], attachments: [] }));
    expect(await screen.findByText('Context estimate unavailable.')).toBeVisible();

    act(() => window.dispatchEvent(new Event('lumo:tools-changed')));
    await waitFor(() => expect(fillAttachmentData).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('Context estimate unavailable.')).not.toBeInTheDocument());
});

it('keeps a critical warning visible when a refresh fails', async () => {
    const largeQuestion = { ...question, content: 'x'.repeat(360_000) };
    render(createElement(ContextSizeWarning, { messageChain: [largeQuestion], attachments: [] }));
    const warning = await screen.findByText(/This conversation is nearly full/);

    jest.mocked(fillAttachmentData).mockRejectedValueOnce(new Error('Attachment unavailable'));
    await act(async () => {
        window.dispatchEvent(new Event('lumo:tools-changed'));
    });
    await waitFor(() => expect(fillAttachmentData).toHaveBeenCalledTimes(2));
    expect(warning).toBeVisible();
});

it('shows the same request estimate with hydrated files and refreshes desktop schemas without executing tools', async () => {
    let tools: ChatCompletionsFunctionTool[] = [
        { type: 'function', function: { name: 'lookup', description: 'Search project notes', parameters: {} } },
    ];
    const execute = jest.fn(async () => []);
    const getClientTools = jest.fn(async () => tools);
    jest.mocked(createDesktopClientToolExecutor).mockReturnValue({ getClientTools, canExecute: () => true, execute });
    const { result } = renderHook(() => useEffectiveContextUsage([question], []));
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const preview = prepareRequest({ messageChain: [question], attachments: [file], clientTools: tools, budget });
    expect(result.current.usedTokens).toBe(preview.usage.usedTokens * budget.calibration);
    expect(result.current.fileTokens).toBe(preview.usage.fileTokens * budget.calibration);
    expect(result.current.fileTokens).toBeGreaterThan(0);
    expect(result.current.toolCallTokens).toBe(preview.usage.toolCallTokens * budget.calibration);
    expect(execute).not.toHaveBeenCalled();

    tools = [{ type: 'function', function: { name: 'lookup', description: 'd'.repeat(4_000), parameters: {} } }];
    act(() => window.dispatchEvent(new Event('lumo:tools-changed')));
    await waitFor(() => expect(result.current.isStale).toBe(false));
    const refreshed = prepareRequest({ messageChain: [question], attachments: [file], clientTools: tools, budget });
    expect(result.current.usedTokens).toBe(refreshed.usage.usedTokens * budget.calibration);
    expect(result.current.toolCallTokens).toBe(refreshed.usage.toolCallTokens * budget.calibration);
    expect(getClientTools).toHaveBeenCalledTimes(2);
    expect(execute).not.toHaveBeenCalled();
});

it('shares a pending load and keeps it alive until the last consumer unmounts', async () => {
    let finish: (attachments: Attachment[]) => void = () => {};
    jest.mocked(fillAttachmentData).mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finish = resolve;
            })
    );
    const first = renderHook(() => useEffectiveContextUsage([question]));
    const second = renderHook(() => useEffectiveContextUsage([question]));
    expect(fillAttachmentData).toHaveBeenCalledTimes(1);
    first.unmount();

    await act(async () => finish([file]));
    await waitFor(() => expect(second.result.current.isPending).toBe(false));
    expect(second.result.current.usedTokens).toBe(
        prepareRequest({ messageChain: [question], attachments: [file], budget }).usage.usedTokens * budget.calibration
    );
    second.unmount();

    const remounted = renderHook(() => useEffectiveContextUsage([question]));
    await waitFor(() => expect(remounted.result.current.isPending).toBe(false));
    expect(fillAttachmentData).toHaveBeenCalledTimes(2);
});

it('updates streamed text without reloading definitions for unrelated store changes', async () => {
    const assistant: Message = {
        ...question,
        id: 'answer',
        role: Role.Assistant,
        content: 'Starting',
        attachments: [],
    };
    const { result, rerender } = renderHook(({ chain }) => useEffectiveContextUsage(chain), {
        initialProps: { chain: [question, assistant] },
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const initialTokens = result.current.usedTokens;

    state = {
        ...state,
        conversations: {
            ...state.conversations,
            conversation: { ...state.conversations.conversation, title: 'New title' },
        },
        attachments: { ...state.attachments, other: { ...file, id: 'other' } },
        lumoUserSettings: { ...state.lumoUserSettings, theme: 'dark' },
        skills: { ...state.skills, status: 'loading' },
    };
    const chain = [question, { ...assistant, content: 'The launch is on Friday. '.repeat(100) }];
    rerender({ chain });
    expect(result.current.isPending).toBe(false);
    expect(result.current.isStale).toBe(false);
    expect(result.current.usedTokens).toBeGreaterThan(initialTokens);
    expect(result.current.usedTokens).toBe(
        prepareRequest({ messageChain: chain, attachments: [file], budget }).usage.usedTokens * budget.calibration
    );
    expect(fillAttachmentData).toHaveBeenCalledTimes(1);
});

it('keeps resolved definitions visible during a relevant refresh', async () => {
    const { result, rerender } = renderHook(() => useEffectiveContextUsage([question]));
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const previousTokens = result.current.usedTokens;
    const updatedFile = { ...file, markdown: 'The project launches in December.'.repeat(100) };
    let finish: (attachments: Attachment[]) => void = () => {};
    jest.mocked(fillAttachmentData).mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finish = resolve;
            })
    );
    state = { ...state, attachments: { notes: updatedFile } };
    rerender();

    expect(result.current.isPending).toBe(false);
    expect(result.current.isStale).toBe(true);
    expect(result.current.usedTokens).toBe(previousTokens);
    await act(async () => finish([updatedFile]));
    await waitFor(() => expect(result.current.isStale).toBe(false));
    expect(result.current.fileTokens).toBe(
        prepareRequest({ messageChain: [question], attachments: [updatedFile], budget }).usage.fileTokens *
            budget.calibration
    );
    expect(result.current.usedTokens).toBeGreaterThan(previousTokens);
});

it('never reuses another conversation’s definitions after navigation', async () => {
    const { result, rerender } = renderHook(({ chain }) => useEffectiveContextUsage(chain), {
        initialProps: { chain: [question] },
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    jest.mocked(fillAttachmentData).mockRejectedValueOnce(new Error('Attachment unavailable'));
    rerender({ chain: [{ ...question, conversationId: 'other-conversation' }] });
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
    expect(result.current.isPending).toBe(false);
    expect(result.current.isStale).toBe(false);
});
