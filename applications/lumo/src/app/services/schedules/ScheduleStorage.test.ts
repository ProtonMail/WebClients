import { configureStore } from '@reduxjs/toolkit';
import 'fake-indexeddb/auto';

import type { ScheduleRun } from '@proton/lumo-api-client/core/desktop-schedules';
import { Role } from '@proton/lumo-api-client/core/types';

import { generateMasterKeyBase64 } from '../../crypto';
import type { ScheduleDetails } from '../../features/schedules/types';
import { DbApi } from '../../indexedDb/db';
import { ConflictClientError } from '../../redux/sagas/sagaErrors';
import conversations from '../../redux/slices/core/conversations';
import idmap from '../../redux/slices/core/idmap';
import messages, { addMessage, deleteMessage } from '../../redux/slices/core/messages';
import spaces, { addSpace } from '../../redux/slices/core/spaces';
import { saveSchedule } from '../../redux/slices/schedules';
import { serializeSpace } from '../../serialization';
import { type MasterKeysBundle, type Message, type Space, SpaceType, cleanConversation, cleanSpace } from '../../types';
import { buildMasterKeyContext } from '../../util/masterKeys';
import { AgentScheduleExecutor } from './AgentScheduleExecutor';
import { ConversationScheduleRunRepository, scheduleConversationId } from './ConversationScheduleRunRepository';
import { ScheduleService } from './ScheduleService';
import { type ScheduleAppStore, ScheduleStorage } from './ScheduleStorage';
import { SpaceScheduleSource } from './SpaceScheduleSource';
import { SchedulePersistenceError, type ScheduleRunResult } from './types';

// Tokenization is unrelated to persistence and otherwise loads its WASM worker in Node.
jest.mock('../../llm/tokenizer', () => ({ countTokens: () => 0 }));

const details: ScheduleDetails & { id: string } = {
    id: '61d35839-b198-42d4-a28b-3b8cd148bf96',
    name: 'Daily summary',
    instructions: 'Summarize my day',
    recurrenceRule: { frequency: 'DAILY', hour: 15, minute: 0, timezone: 'Asia/Taipei' },
    connectors: [{ id: 'calendar', label: 'Calendar' }],
    autoApprove: false,
    notifyOnComplete: true,
};
const run: ScheduleRun = {
    runId: '36:61d35839-b198-42d4-a28b-3b8cd148bf96:1:2026-10-21T07:00:00+00:00',
    scheduleId: details.id,
    timingRevision: 1,
    scheduledFor: '2026-10-21T07:00:00Z',
    updatedAt: '2026-10-21T07:00:00Z',
    status: 'running',
};
const result: ScheduleRunResult = {
    run,
    outcome: 'succeeded',
    finishedAt: '2026-10-21T07:01:00Z',
    producedTurns: [
        { role: Role.Assistant, content: 'Checking the calendar' },
        { role: Role.ToolCall, content: '{"id":"call-1","name":"calendar"}' },
        { role: Role.ToolResult, content: '{"tool_call_id":"call-1","events":[]}' },
        { role: Role.Assistant, content: 'Your calendar is clear.' },
    ],
};
let counter = 0;
function setup(options?: {
    accountId: string;
    keys: MasterKeysBundle;
    dbName?: string;
    postConversation: (args: { ConversationTag: string }) => Promise<string>;
}) {
    const accountId = options?.accountId ?? `schedule-spaces-${++counter}`;
    const keys: MasterKeysBundle = options?.keys ?? {
        primaryMasterKey: generateMasterKeyBase64(),
        primaryMasterKeyId: 'primary',
        masterKeys: {},
    };
    const store = configureStore({ reducer: { spaces, conversations, messages, idmap } });
    const db = new DbApi(options?.dbName ?? accountId);
    let active = true;
    const reservations = new Set<string>();
    const postConversation = jest.fn(
        options?.postConversation ??
            (async ({ ConversationTag }: { ConversationTag: string }) => {
                if (reservations.has(ConversationTag)) throw new ConflictClientError('Already exists');
                reservations.add(ConversationTag);
                return `remote-${ConversationTag}`;
            })
    );
    const storage = new ScheduleStorage(db, store as unknown as ScheduleAppStore, keys, () => active, {
        postConversation,
    });
    // Model the normal space saga's encrypted write and completed remote synchronization.
    const persistSpace = async (space: Space) => {
        storage.guard();
        const { primary } = await buildMasterKeyContext(keys);
        await db.updateSpace(await serializeSpace(space, primary), { dirty: true });
        await db.addRemoteId({ type: 'space', localId: space.id, remoteId: `remote-${space.id}` });
    };
    const save = async ({ id, ...values }: ScheduleDetails & { id: string }, timezone?: string) => {
        storage.guard();
        const zone =
            timezone &&
            jest.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
                ...new Intl.DateTimeFormat().resolvedOptions(),
                timeZone: timezone,
            });
        try {
            storage.store.dispatch(saveSchedule(id, values, store.getState().spaces[id] ? 'edit' : 'create'));
        } finally {
            if (zone) zone.mockRestore();
        }
        await persistSpace(store.getState().spaces[id]);
    };
    const source = new SpaceScheduleSource(accountId, storage);
    const repository = new ConversationScheduleRunRepository(accountId, storage);
    return {
        accountId,
        keys,
        store,
        db,
        storage,
        save,
        persistSpace,
        postConversation,
        source,
        repository,
        context: { accountId, signal: new AbortController().signal },
        expire: () => {
            active = false;
        },
    };
}

async function finishOutput(h: ReturnType<typeof setup>) {
    const assistant = Object.values(h.store.getState().messages).find((message) => message.role === Role.Assistant)!;
    const output: Message = {
        ...assistant,
        placeholder: false,
        status: 'succeeded',
        content: 'Checking the calendar\nYour calendar is clear.',
        blocks: result.producedTurns.map((turn, sequence) => ({
            type: turn.role === Role.ToolCall ? 'tool_call' : turn.role === Role.ToolResult ? 'tool_result' : 'text',
            content: turn.content ?? '',
            sequence,
        })),
    };
    h.store.dispatch(addMessage(output));
    return h.repository.finishRun({
        run,
        outcome: 'succeeded',
        finishedAt: result.finishedAt,
        messageIds: [assistant.id],
    });
}

test('definitions use encrypted spaces and survive reopening without losing schedule metadata', async () => {
    const h = setup();
    await h.save(details);
    const stored = await h.db.getSpaceById(details.id);
    expect(stored).toMatchObject({ id: details.id, dirty: true });
    expect(JSON.stringify(stored)).not.toContain(details.instructions);
    const restored = await h.storage.getSpace(details.id);
    expect(cleanSpace(restored!)).toMatchObject({
        spaceType: SpaceType.Schedule,
        schedule: (({ id, ...values }) => values)(details),
        scheduleDefinition: { id: details.id, timingRevision: 1 },
    });
    h.store.dispatch(addSpace(cleanSpace(restored!)));
    const reopened = new SpaceScheduleSource(h.accountId, h.storage);
    expect(await reopened.list(h.context)).toHaveLength(1);
    expect(await reopened.getTask(run, h.context)).toMatchObject({
        prompt: details.instructions,
        connectorIds: ['calendar'],
    });
    h.source.dispose();
    reopened.dispose();
});

test('editor saves feed desktop timings and run conversations without changing the UI schedule shape', async () => {
    const h = setup();
    const { id, ...values } = details;
    h.storage.store.dispatch(saveSchedule(id, values));
    const saved = h.store.getState().spaces[id];
    expect(saved).toMatchObject({ spaceType: SpaceType.Schedule, schedule: values });
    const [definition] = await h.source.list(h.context);
    expect(definition).toMatchObject({ id, timingRevision: 1, timing: { kind: 'daily', timezone: 'Asia/Taipei' } });
    // The normal persistence saga writes the Redux space before its remote ID becomes available.
    await h.persistSpace(saved);
    expect(await h.repository.claim(run)).toBe(true);
    const task = (await h.source.getTask(run, h.context))!;
    const target = await h.repository.startRun(run, task);
    expect(target.prompt.content).toBe(values.instructions);
    expect((await h.storage.readConversation(target.conversationId)).conversation?.spaceId).toBe(id);
    h.storage.store.dispatch(saveSchedule(id, { ...values, instructions: 'Updated instructions' }, 'edit'));
    expect(await h.source.getTask(run, h.context)).toMatchObject({ prompt: 'Updated instructions', timingRevision: 1 });
    h.storage.store.dispatch(
        saveSchedule(id, { ...values, recurrenceRule: { ...values.recurrenceRule, hour: 16 } }, 'edit')
    );
    expect((await h.source.list(h.context))[0].timingRevision).toBe(2);
    expect(await h.source.getTask(run, h.context)).toBeUndefined();
    h.source.dispose();
});

test.each<ScheduleDetails['recurrenceRule']>([
    { frequency: 'DAILY', hour: 15, minute: 0, timezone: 'Asia/Taipei' },
    { frequency: 'ONCE', date: '2026-10-23', hour: 15, minute: 0, timezone: 'always_local_time' },
])('does not schedule $frequency tasks without persisted execution metadata', async (recurrenceRule) => {
    const h = setup();
    const task = { ...details, recurrenceRule };
    await h.save(task);
    const incomplete = { ...h.store.getState().spaces[details.id], scheduleDefinition: undefined };
    h.store.dispatch(addSpace(incomplete));
    expect(await h.source.list(h.context)).toEqual([]);
    expect(await h.source.getTask(run, h.context)).toBeUndefined();
    expect(h.source.getSnapshot().schedules).toEqual([task]);
    expect(h.store.getState().spaces[details.id]).toEqual(incomplete);
    // Only an explicit editor save creates execution metadata; reading never invents it.
    await h.save(task);
    expect(await h.source.list(h.context)).toHaveLength(1);
    expect(await h.source.getTask(run, h.context)).toMatchObject({ timingRevision: 1, prompt: task.instructions });
    h.source.dispose();
});

test('synced schedules supply timings and task content on either device', async () => {
    const h = setup();
    await h.save(details);
    const other = new SpaceScheduleSource(h.accountId, h.storage);
    expect(await other.list(h.context)).toHaveLength(1);
    expect(other.getSnapshot().schedules).toEqual([details]);
    expect(await other.getTask(run, h.context)).toMatchObject({ prompt: details.instructions });
    await h.save({ ...details, instructions: 'An edited prompt' });
    expect((await h.source.list(h.context))[0].timingRevision).toBe(1);
    expect(await h.source.getTask(run, h.context)).toMatchObject({ prompt: 'An edited prompt' });
    await h.save({ ...details, recurrenceRule: { ...details.recurrenceRule, hour: 16 } });
    expect((await h.source.list(h.context))[0].timingRevision).toBe(2);
    expect(await h.source.getTask(run, h.context)).toBeUndefined();
    h.source.dispose();
    other.dispose();
});

test.each<ScheduleDetails['recurrenceRule']>([
    { frequency: 'DAILY', hour: 15, minute: 0, timezone: 'always_local_time' },
    { frequency: 'ONCE', date: '2026-10-22', hour: 15, minute: 0, timezone: 'always_local_time' },
])(
    'instruction edits from another timezone preserve $frequency timing and pending-run revision',
    async (recurrenceRule) => {
        const h = setup();
        const owner = new SpaceScheduleSource(h.accountId, h.storage, () => 'Asia/Taipei');
        const editor = new SpaceScheduleSource(h.accountId, h.storage, () => 'Europe/London');
        const task = { ...details, recurrenceRule };
        try {
            await h.save(task, 'Asia/Taipei');
            const [before] = await owner.list(h.context);
            await h.save({ ...task, instructions: 'Updated on another computer' }, 'Europe/London');
            const saved = await h.storage.getSpace(task.id);
            expect(saved?.spaceType === SpaceType.Schedule && saved.scheduleDefinition).toEqual(before);
            expect(await owner.list(h.context)).toEqual([before]);
            expect(await owner.getTask(run, h.context)).toMatchObject({
                timingRevision: before.timingRevision,
                prompt: 'Updated on another computer',
            });
        } finally {
            owner.dispose();
            editor.dispose();
        }
    }
);

test('concurrent claims create one conversation; prompt, tool turns and outcome survive reopening', async () => {
    const h = setup();
    await h.save(details);
    const second = new ConversationScheduleRunRepository(h.accountId, h.storage);
    const claims = await Promise.all([h.repository.claim(run), second.claim(run)]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(claims).toContain(false);
    await h.repository.startRun(run, {
        id: details.id,
        timingRevision: 1,
        prompt: 'The actual prompt at execution',
        connectorIds: [],
    });
    const id = scheduleConversationId(h.accountId, run.runId);
    const initialMessages = await h.db.getMessagesByConversationId(id);
    expect(initialMessages).toHaveLength(2);
    expect(JSON.stringify(initialMessages)).not.toContain('The actual prompt');
    expect(await finishOutput(h)).toBe('succeeded');
    expect(await second.interruptRun(run)).toBe('succeeded');
    const saved = await second.getResult(run.runId);
    expect(saved).toEqual({ ...result, conversationId: id });
    const { conversation } = await h.storage.readConversation(id);
    expect(cleanConversation(conversation!)).toMatchObject({ scheduleRun: { status: 'succeeded' } });
    const restoredMessages = await h.storage.readMessages(conversation!);
    expect(restoredMessages.find((message) => message.role === Role.User)?.content).toBe(
        'The actual prompt at execution'
    );
    expect(restoredMessages.find((message) => message.role === Role.Assistant)?.blocks).toHaveLength(4);
    expect(await h.db.getAllConversations()).toHaveLength(1);
    h.source.dispose();
});

test('a durable claim survives reload and persistence failures do not look like completed executions', async () => {
    const h = setup();
    await h.save(details);
    await h.repository.claim(run);
    const target = await h.repository.startRun(run, {
        id: details.id,
        timingRevision: 1,
        prompt: details.instructions,
        connectorIds: [],
    });
    const partial: Message = {
        ...target.assistant,
        placeholder: false,
        content: 'Partially completed',
        blocks: [{ type: 'text', content: 'Partially completed', sequence: 0 }],
        reasoning: 'Some reasoning',
    };
    const { raw, conversation } = await h.storage.readConversation(target.conversationId);
    await h.storage.writeConversation(conversation!, [partial], raw);
    h.store.dispatch(deleteMessage(partial.id));
    const reopened = new ConversationScheduleRunRepository(h.accountId, h.storage);
    expect(await reopened.claim(run)).toBe(false);
    const write = jest.spyOn(h.storage, 'writeConversation').mockRejectedValueOnce(new Error('Disk write failed'));
    await expect(reopened.interruptRun(run)).rejects.toBeInstanceOf(SchedulePersistenceError);
    expect(await reopened.getStatus(run.runId)).toBe('running');
    write.mockRestore();
    expect(await reopened.interruptRun(run)).toBe('interrupted');
    const saved = await reopened.getResult(run.runId);
    expect(saved?.producedTurns).toEqual([{ role: Role.Assistant, content: partial.content }]);
    const restored = await h.storage.readMessages(
        (await h.storage.readConversation(target.conversationId)).conversation!
    );
    expect(restored.find(({ id }) => id === partial.id)).toMatchObject({
        content: partial.content,
        reasoning: partial.reasoning,
    });
    h.source.dispose();
});

test('account switches reject retained storage and source references', async () => {
    const h = setup();
    await h.save(details);
    h.expire();
    await expect(h.repository.claim(run)).rejects.toMatchObject({ name: 'AbortError' });
    await expect(h.source.list(h.context)).rejects.toMatchObject({ name: 'AbortError' });
    await expect(h.source.getTask(run, h.context)).rejects.toMatchObject({ name: 'AbortError' });
    h.source.dispose();
});

test('local-time recurrence follows travel once; one-off occurrences remain fixed', async () => {
    const h = setup();
    let zone = 'Asia/Taipei';
    const source = new SpaceScheduleSource(h.accountId, h.storage, () => zone);
    await h.save({ ...details, recurrenceRule: { ...details.recurrenceRule, timezone: 'always_local_time' } }, zone);
    zone = 'Europe/London';
    expect((await source.list(h.context))[0]).toMatchObject({ timingRevision: 1, timing: { timezone: zone } });
    expect((await source.list(h.context))[0].timingRevision).toBe(1);
    zone = 'Asia/Taipei';
    await h.save(
        {
            ...details,
            recurrenceRule: {
                frequency: 'ONCE',
                date: '2026-10-22',
                hour: 15,
                minute: 0,
                timezone: 'always_local_time',
            },
        },
        zone
    );
    const before = (await source.list(h.context))[0];
    zone = 'Europe/London';
    expect((await source.list(h.context))[0]).toEqual(before);
    await h.save(
        {
            ...details,
            instructions: 'Edited after travel',
            recurrenceRule: {
                frequency: 'ONCE',
                date: '2026-10-22',
                hour: 15,
                minute: 0,
                timezone: 'always_local_time',
            },
        },
        zone
    );
    expect((await source.list(h.context))[0]).toEqual(before);
    source.dispose();
});

test('the service executes through the new repository and persists a normal conversation before completion', async () => {
    const h = setup();
    await h.save(details);
    let current = { ...run, status: 'pending' as ScheduleRun['status'] };
    const executor = new AgentScheduleExecutor({
        accountId: h.accountId,
        tasks: h.source,
        repository: h.repository,
        isCurrentAccount: () => true,
        runConversation: async (target) => {
            expect(
                (
                    await h.storage.readMessages(
                        (await h.storage.readConversation(target.conversationId)).conversation!
                    )
                ).find((message) => message.role === Role.User)?.content
            ).toBe(details.instructions);
            const message: Message = {
                ...target.assistant,
                placeholder: false,
                status: 'succeeded',
                blocks: result.producedTurns.map((turn, sequence) => ({
                    type:
                        turn.role === Role.ToolCall
                            ? 'tool_call'
                            : turn.role === Role.ToolResult
                              ? 'tool_result'
                              : 'text',
                    content: turn.content ?? '',
                    sequence,
                })),
            };
            h.store.dispatch(addMessage(message));
            return { outcome: 'succeeded', messageIds: [target.assistant.id] };
        },
    });
    const service = new ScheduleService({
        accountId: h.accountId,
        source: h.source,
        executor,
        isCurrentAccount: () => true,
        bridge: {
            connect: async () => ({ connectionId: 'connection', protocolVersion: 1 }),
            replaceSchedules: async ({ schedules }) => {
                expect(schedules[0].id).toBe(details.id);
            },
            getPendingRuns: async () => (current.status === 'pending' ? [current] : []),
            getUnsettledRuns: async () => [],
            reportRunStatus: async ({ status }) => {
                if (status === 'succeeded') {
                    expect((await h.repository.getResult(run.runId))?.producedTurns).toEqual(result.producedTurns);
                }
                current = { ...current, status };
            },
            onWorkAvailable: () => () => {},
        },
    });
    try {
        await service.start();
        expect(current.status).toBe('succeeded');
        expect(await h.db.getAllConversations()).toHaveLength(1);
    } finally {
        service.stop();
        h.source.dispose();
    }
});

test('the existing space cascade deletes run messages and a late completion cannot recreate them', async () => {
    const h = setup();
    await h.save(details);
    await h.repository.claim(run);
    await h.repository.startRun(run, {
        id: details.id,
        timingRevision: 1,
        prompt: details.instructions,
        connectorIds: [],
    });
    await finishOutput(h);
    await h.db.softDeleteSpaceCascade(details.id, { dirty: true });
    expect((await h.db.getSpaceById(details.id))?.deleted).toBe(true);
    expect((await h.db.getAllConversations()).every((conversation) => conversation.deleted)).toBe(true);
    const messageRecords = await h.db.getMessagesByConversationId(scheduleConversationId(h.accountId, run.runId));
    expect(messageRecords).toHaveLength(2);
    expect(messageRecords.every((message) => message.deleted)).toBe(true);
    expect(await finishOutput(h)).toBe('interrupted');
    expect(await h.repository.getResult(run.runId)).toBeUndefined();
    h.source.dispose();
});

test('independent desktop profiles race on the same conversation tag before publishing local work', async () => {
    const first = setup();
    await first.save(details);
    const tags = new Set<string>();
    const postConversation = jest.fn(async ({ ConversationTag }: { ConversationTag: string }) => {
        // Neither desktop may expose a dirty local conversation before the server grants it.
        expect(await first.db.getAllConversations()).toHaveLength(0);
        expect(await second.db.getAllConversations()).toHaveLength(0);
        if (tags.has(ConversationTag)) throw new ConflictClientError('Already exists');
        tags.add(ConversationTag);
        return `remote-${ConversationTag}`;
    });
    first.postConversation.mockImplementation(postConversation);
    const second = setup({
        accountId: first.accountId,
        keys: first.keys,
        dbName: `${first.accountId}-second-profile`,
        postConversation,
    });
    const syncedSpace = (await first.storage.getSpace(details.id))!;
    await second.persistSpace(syncedSpace);
    const claims = await Promise.all([first.repository.claim(run), second.repository.claim(run)]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    const winner = claims[0] ? first : second;
    const loser = claims[0] ? second : first;
    const id = scheduleConversationId(first.accountId, run.runId);
    expect(postConversation.mock.calls.map(([args]) => args.ConversationTag)).toEqual([id, id]);
    expect(await winner.db.getRemoteIdFromLocalId('conversation', id)).toBe(`remote-${id}`);
    expect((await winner.db.getConversationById(id))?.dirty).not.toBe(true);
    expect(await loser.db.getAllConversations()).toHaveLength(0);
    await expect(
        loser.repository.startRun(run, { id: details.id, timingRevision: 1, prompt: 'x', connectorIds: [] })
    ).rejects.toThrow('has not reserved');
    await winner.repository.startRun(run, { id: details.id, timingRevision: 1, prompt: 'x', connectorIds: [] });
    await finishOutput(winner);
    expect((await winner.repository.getResult(run.runId))?.outcome).toBe('succeeded');
    // A losing desktop receiving the conversation through sync must still not claim it.
    const { conversation } = await winner.storage.readConversation(id);
    await loser.storage.writeConversation(conversation!, []);
    expect(await loser.repository.claim(run)).toBe(false);
    expect(await winner.repository.getStatus(run.runId)).toBe('succeeded');
    first.source.dispose();
    second.source.dispose();
});

test('a lost successful POST response never grants execution, including after retry', async () => {
    const h = setup();
    await h.save(details);
    h.postConversation
        .mockRejectedValueOnce(new Error('Connection lost after commit'))
        .mockRejectedValueOnce(new ConflictClientError('Already exists'));
    await expect(h.repository.claim(run)).rejects.toBeInstanceOf(SchedulePersistenceError);
    expect(await h.db.getAllConversations()).toHaveLength(0);
    expect(await h.repository.claim(run)).toBe(false);
    await expect(
        h.repository.startRun(run, { id: details.id, timingRevision: 1, prompt: 'x', connectorIds: [] })
    ).rejects.toThrow('has not reserved');
});

test('local-time desktops share the revision but resolve their own zone without modifying the synced schedule', async () => {
    const h = setup();
    const taipei = new SpaceScheduleSource(h.accountId, h.storage, () => 'Asia/Taipei');
    const london = new SpaceScheduleSource(h.accountId, h.storage, () => 'Europe/London');
    await h.save(
        { ...details, recurrenceRule: { ...details.recurrenceRule, timezone: 'always_local_time' } },
        'Asia/Taipei'
    );
    const saved = await h.db.getSpaceById(details.id);
    expect((await taipei.list(h.context))[0]).toMatchObject({ timingRevision: 1, timing: { timezone: 'Asia/Taipei' } });
    expect((await london.list(h.context))[0]).toMatchObject({
        timingRevision: 1,
        timing: { timezone: 'Europe/London' },
    });
    expect(await h.db.getSpaceById(details.id)).toEqual(saved);
    taipei.dispose();
    london.dispose();
});
