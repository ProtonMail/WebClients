import { LumoApi } from './api';
import type { NewMessageToApi } from './types';
import { RoleInt, StatusInt } from './types';

afterEach(() => {
    jest.restoreAllMocks();
});

it('sends generation acknowledgements without logging their resume tokens', async () => {
    const message: NewMessageToApi = {
        ConversationID: 'conversation',
        ParentId: undefined,
        ParentID: undefined,
        Role: RoleInt.Assistant,
        Status: StatusInt.Succeeded,
        Encrypted: 'encrypted-answer',
        MessageTag: 'answer',
        GenerationJobs: [{ JobID: 'generation', Token: 'secret-resume-token' }],
    };
    const fetch = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify({ Message: { ID: 'remote-answer' } }), { status: 200 }));
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(new LumoApi('test-session').postMessage(message, 'urgent')).resolves.toBe('remote-answer');

    expect(fetch).toHaveBeenCalledWith(
        '/api/lumo/v1/conversations/conversation/messages',
        expect.objectContaining({ method: 'POST', body: JSON.stringify(message) })
    );
    expect(log.mock.calls).toEqual([['lumo api: http post /api/lumo/v1/conversations/conversation/messages']]);
});
