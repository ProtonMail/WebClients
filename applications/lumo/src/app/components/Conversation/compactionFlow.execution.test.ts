import type { ClientToolExecutor } from '@proton/lumo-api-client/core/client-tools';
import { ContextLengthExceededError } from '@proton/lumo-api-client/core/context-length';
import { createDesktopClientToolExecutor } from '@proton/lumo-api-client/core/desktop-tools';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { sendMessageWithRedux } from '../../lib/lumoApiClientRedux';
import { prepareRequest } from '../../llm';
import type { LumoDispatch } from '../../redux/store';
import { markModelsUnavailable } from '../../services/modelsStore';
import { runGenerationWithCompaction } from './compactionFlow';

jest.mock('../../lib/lumoApiClientRedux', () => ({ sendMessageWithRedux: jest.fn() }));
jest.mock('../../llm/compaction', () => ({
    ...jest.requireActual('../../llm/compaction'),
    compactConversation: jest.fn(),
}));
jest.mock('@proton/lumo-api-client/core/desktop-tools', () => ({
    isDesktopEnvironment: () => true,
    createDesktopClientToolExecutor: jest.fn(),
}));
jest.mock('./artifact/createArtifactTool', () => ({
    createArtifactToolExecutor: () => ({
        getClientTools: async () => [{ type: 'function', function: { name: 'create_artifact', parameters: {} } }],
        canExecute: (name: string) => name === 'create_artifact',
        execute: async () => [{ content: 'artifact' }],
    }),
}));

function run(executor?: ClientToolExecutor, artifacts = true, retryAfterToolExecution = true) {
    const dispatch = ((action: unknown) =>
        typeof action === 'function' ? action(dispatch, () => ({})) : action) as LumoDispatch;
    return dispatch(
        runGenerationWithCompaction({
            api: jest.fn() as Api,
            conversationId: 'conversation',
            spaceId: 'space',
            assistantMessageId: 'assistant',
            parentMessageId: 'prompt',
            chain: [],
            buildRequest: (messageChain, clientTools) => prepareRequest({ messageChain, clientTools }),
            enableProactiveCompaction: false,
            retryAfterToolExecution,
            sendOptions: { clientToolExecutor: executor, artifactToolMode: artifacts ? 'auto' : 'off' },
        })
    );
}

beforeAll(() => markModelsUnavailable());
beforeEach(() => jest.clearAllMocks());

it('composes artifacts with supplied connector permissions without creating a default desktop executor', async () => {
    const restricted: ClientToolExecutor = {
        getClientTools: async () => [
            { type: 'function', function: { name: 'calendar__read', description: '', parameters: {} } },
        ],
        canExecute: (name) => name === 'calendar__read',
        execute: jest.fn(async () => [{ content: 'calendar' }]),
    };
    jest.mocked(sendMessageWithRedux).mockImplementation(
        (_api, _turns, options) =>
            (async () => {
                const tools = options?.clientToolExecutor!;
                expect((await tools.getClientTools!()).map((tool) => tool.function.name)).toEqual([
                    'create_artifact',
                    'calendar__read',
                ]);
                expect(tools.canExecute('shell__run')).toBe(false);
                expect(
                    await tools.execute([
                        { id: 'a', name: 'create_artifact', arguments: '{}' },
                        { id: 'b', name: 'calendar__read', arguments: '{}' },
                    ])
                ).toEqual([{ content: 'artifact' }, { content: 'calendar' }]);
                return { status: 'succeeded', turns: [], producedTurns: [] };
            }) as ReturnType<typeof sendMessageWithRedux>
    );
    expect(await run(restricted)).toEqual({ assistantMessageId: 'assistant', status: 'succeeded' });
    expect(createDesktopClientToolExecutor).not.toHaveBeenCalled();
});

it('keeps selected connectors when artifacts are disabled and returns failed generation status', async () => {
    const restricted: ClientToolExecutor = { canExecute: (name) => name === 'calendar__read', execute: async () => [] };
    jest.mocked(sendMessageWithRedux).mockImplementation(
        (_api, _turns, options) =>
            (async () => {
                expect(options?.clientToolExecutor?.canExecute('calendar__read')).toBe(true);
                expect(options?.clientToolExecutor?.canExecute('create_artifact')).toBe(false);
                return { status: 'failed', turns: [], producedTurns: [] };
            }) as ReturnType<typeof sendMessageWithRedux>
    );
    expect(await run(restricted, false)).toEqual({ assistantMessageId: 'assistant', status: 'failed' });
});

it('does not compact and retry a background generation after a tool may have acted', async () => {
    const restricted: ClientToolExecutor = { canExecute: () => true, execute: async () => [{ content: 'email sent' }] };
    jest.mocked(sendMessageWithRedux).mockImplementation(
        (_api, _turns, options) =>
            (async () => {
                await options?.clientToolExecutor?.execute([{ id: 'call', name: 'mail__send', arguments: '{}' }]);
                throw new ContextLengthExceededError();
            }) as ReturnType<typeof sendMessageWithRedux>
    );
    await expect(run(restricted, false, false)).rejects.toBeInstanceOf(ContextLengthExceededError);
    expect(sendMessageWithRedux).toHaveBeenCalledTimes(1);
});

it('refreshes connector schemas on later tool rounds', async () => {
    const getClientTools = jest
        .fn()
        .mockResolvedValueOnce([{ type: 'function', function: { name: 'first', parameters: {} } }])
        .mockResolvedValueOnce([{ type: 'function', function: { name: 'first', parameters: {} } }])
        .mockResolvedValueOnce([{ type: 'function', function: { name: 'second', parameters: {} } }]);
    const executor: ClientToolExecutor = { getClientTools, canExecute: () => true, execute: async () => [] };
    jest.mocked(sendMessageWithRedux).mockImplementation(
        (_api, _turns, options) =>
            (async () => {
                const tools = options?.clientToolExecutor!;
                expect((await tools.getClientTools!()).map((tool) => tool.function.name)).toEqual(['first']);
                expect((await tools.getClientTools!()).map((tool) => tool.function.name)).toEqual(['second']);
                return { status: 'succeeded', turns: [], producedTurns: [] };
            }) as ReturnType<typeof sendMessageWithRedux>
    );

    expect(await run(executor, false)).toEqual({ assistantMessageId: 'assistant', status: 'succeeded' });
    expect(getClientTools).toHaveBeenCalledTimes(3);
});

it('leaves schema-discovery failures to the send path and its cleanup', async () => {
    const failure = new Error('Desktop bridge unavailable');
    const getClientTools = jest.fn().mockRejectedValue(failure);
    const executor: ClientToolExecutor = { getClientTools, canExecute: () => true, execute: async () => [] };
    jest.mocked(sendMessageWithRedux).mockImplementation(
        (_api, _turns, options) =>
            (async () => {
                await expect(options?.clientToolExecutor?.getClientTools?.()).rejects.toBe(failure);
                return { status: 'failed', turns: [], producedTurns: [] };
            }) as ReturnType<typeof sendMessageWithRedux>
    );

    expect(await run(executor, false)).toEqual({ assistantMessageId: 'assistant', status: 'failed' });
    expect(getClientTools).toHaveBeenCalledTimes(2);
});
