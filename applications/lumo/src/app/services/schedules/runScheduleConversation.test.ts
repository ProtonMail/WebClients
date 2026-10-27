import { type Middleware, configureStore } from '@reduxjs/toolkit';
import 'fake-indexeddb/auto';

import { LumoApiClient } from '@proton/lumo-api-client/core/client';
import type { ScheduleRun } from '@proton/lumo-api-client/core/desktop-schedules';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { generateMasterKeyBase64 } from '../../crypto';
import { DbApi } from '../../indexedDb/db';
import { syncArtifactAssetRequest } from '../../redux/slices/artifactAssetSync';
import composerActions, { setPendingAgent } from '../../redux/slices/composerActions';
import contextFilters from '../../redux/slices/contextFilters';
import attachments from '../../redux/slices/core/attachments';
import conversations from '../../redux/slices/core/conversations';
import idmap from '../../redux/slices/core/idmap';
import messages from '../../redux/slices/core/messages';
import spaces from '../../redux/slices/core/spaces';
import lumoUserSettings, { updateLumoUserSettings } from '../../redux/slices/lumoUserSettings';
import { saveSchedule } from '../../redux/slices/schedules';
import { deserializeAttachment, serializeSpace } from '../../serialization';
import { Role, getSpaceDek } from '../../types';
import { buildMasterKeyContext } from '../../util/masterKeys';
import { attachmentDataCache } from '../attachmentDataCache';
import { ConversationScheduleRunRepository } from './ConversationScheduleRunRepository';
import { type ScheduleAppStore, ScheduleStorage } from './ScheduleStorage';
import { SpaceScheduleSource } from './SpaceScheduleSource';
import { type ScheduleGenerationOptions, createScheduleConversationRunner } from './runScheduleConversation';

jest.mock('../../llm/tokenizer', () => ({ countTokens: () => 0 }));

const options: ScheduleGenerationOptions = {
    externalTools: true,
    imageTools: true,
    artifactsView: true,
    artifactSlides: false,
    memory: false,
    visualizationInstructions: true,
    hasLumoPlus: true,
    isMaxAvailable: true,
    apertusModelAvailable: false,
    previewModelAvailable: false,
};
const run: ScheduleRun = {
    runId: 'shared-run',
    scheduleId: 'task',
    timingRevision: 1,
    status: 'pending',
    scheduledFor: '2026-10-22T08:00:00Z',
    updatedAt: '2026-10-22T08:00:00Z',
};
let counter = 0;
async function setup() {
    const accountId = `shared-generation-${++counter}`;
    const actions: unknown[] = [];
    const capture: Middleware = () => (next) => (action) => {
        actions.push(action);
        return next(action);
    };
    const store = configureStore({
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(capture),
        reducer: {
            spaces,
            conversations,
            messages,
            attachments,
            idmap,
            composerActions,
            contextFilters,
            lumoUserSettings,
        },
    });
    const keys = { primaryMasterKey: generateMasterKeyBase64(), primaryMasterKeyId: 'primary', masterKeys: {} };
    const storage = new ScheduleStorage(new DbApi(accountId), store as unknown as ScheduleAppStore, keys, () => true, {
        postConversation: async () => 'remote-conversation',
    });
    const source = new SpaceScheduleSource(accountId, storage);
    storage.store.dispatch(
        saveSchedule('task', {
            name: 'Scheduled report',
            instructions: 'Write a report',
            recurrenceRule: { frequency: 'DAILY', hour: 15, minute: 0, timezone: 'Asia/Taipei' },
            connectors: [{ id: 'calendar', label: 'Calendar' }],
            autoApprove: false,
            notifyOnComplete: false,
        })
    );
    const { primary } = await buildMasterKeyContext(keys);
    await storage.db.updateSpace(await serializeSpace(store.getState().spaces.task, primary), { dirty: true });
    await storage.db.addRemoteId({ type: 'space', localId: 'task', remoteId: 'remote-space' });
    const repository = new ConversationScheduleRunRepository(accountId, storage);
    const context = { accountId, signal: new AbortController().signal };
    const task = (await source.getTask(run, context))!;
    expect(await repository.claim(run)).toBe(true);
    const target = await repository.startRun(run, task);
    const createTools = jest.fn(() => ({
        getClientTools: async () =>
            ['calendar__read', 'shell__run'].map((name) => ({
                type: 'function' as const,
                function: { name, description: '', parameters: {} },
            })),
        canExecute: () => true,
        execute: async () => [{ content: 'calendar read' }],
    }));
    const runner = createScheduleConversationRunner({
        storage,
        api: jest.fn() as Api,
        getOptions: () => options,
        createTools,
        getConnectors: async () => [
            {
                id: 'calendar',
                display_name: 'Calendar',
                status: { state: 'ready' },
                tools: [{ name: 'read', description: '', input_schema: { type: 'object' } }],
            },
            {
                id: 'shell',
                display_name: 'Shell',
                status: { state: 'ready' },
                tools: [{ name: 'run', description: '', input_schema: { type: 'object' } }],
            },
        ],
    });
    return { store, storage, source, repository, task, target, context, runner, createTools, actions };
}

afterEach(() => jest.restoreAllMocks());

it('shares chat settings and tool composition, preserves streamed metadata, and durably saves the real messages', async () => {
    const h = await setup();
    h.store.dispatch(setPendingAgent('draft-agent'));
    h.store.dispatch(updateLumoUserSettings({ preferredResponseMode: 'thinking', preferredModelTier: 'lumo-lite' }));
    const model = jest
        .spyOn(LumoApiClient.prototype, 'callAssistant')
        .mockImplementation(async (_api, turns, config) => {
            expect(turns.some((turn) => turn.content?.includes('Write a report'))).toBe(true);
            expect(turns.some((turn) => turn.content?.includes('create_artifact'))).toBe(true);
            expect(config).toMatchObject({
                enableExternalTools: true,
                enableImageTools: true,
                enableReasoning: true,
                modelTier: 'lumo-lite',
                generateTitle: false,
            });
            const advertised = await config!.clientToolExecutor!.getClientTools!();
            expect(advertised.map((tool) => tool.function.name)).toEqual(['create_artifact', 'calendar__read']);
            expect(config!.clientToolExecutor!.canExecute('shell__run')).toBe(false);
            await config!.chunkCallback!({
                type: 'token_data',
                target: 'reasoning',
                count: 0,
                content: 'Consider the data',
            });
            await config!.chunkCallback!({
                type: 'token_data',
                target: 'message',
                count: 1,
                content: 'Here is your report',
            });
            const artifactArgs = {
                id: 'report',
                title: 'Scheduled report',
                type: 'document',
                content: '# Daily report',
            };
            const [artifactResult] = await config!.clientToolExecutor!.execute([
                { id: 'artifact-call', name: 'create_artifact', arguments: JSON.stringify(artifactArgs) },
            ]);
            await config!.chunkCallback!({
                type: 'token_data',
                target: 'tool_call',
                count: 2,
                content: JSON.stringify({ id: 'artifact-call', name: 'create_artifact', arguments: artifactArgs }),
            });
            await config!.chunkCallback!({
                type: 'token_data',
                target: 'tool_result',
                count: 3,
                content: artifactResult.content,
            });
            await config!.chunkCallback!({
                type: 'image_data',
                image_id: 'generated-image',
                data: 'AQIDBA==',
                is_final: true,
            });
            await config!.chunkCallback!({ type: 'done' });
            await config!.finishCallback!('succeeded');
            return {
                status: 'succeeded',
                turns,
                producedTurns: [{ role: Role.Assistant, content: 'Here is your report' }],
            };
        });
    const result = await h.runner(h.target, h.task, h.context, run);
    expect(result.outcome).toBe('succeeded');
    expect(h.store.getState().composerActions.pendingAgentId).toBe('draft-agent');
    expect(h.store.getState().conversations[h.target.conversationId].agentId).toBeUndefined();
    expect(await h.repository.finishRun({ ...result, run, finishedAt: new Date().toISOString() })).toBe('succeeded');
    const conversation = (await h.storage.readConversation(h.target.conversationId)).conversation!;
    const savedMessages = await h.storage.readMessages(conversation);
    expect(savedMessages).toHaveLength(2);
    expect(savedMessages.find((message) => message.role === Role.Assistant)).toMatchObject({
        content: expect.stringContaining('Here is your report'),
        reasoning: 'Consider the data',
    });
    expect(h.actions).toContainEqual(
        syncArtifactAssetRequest({
            conversationId: h.target.conversationId,
            artifactId: 'report',
            messageId: h.target.assistant.id,
            title: 'Scheduled report',
            type: 'document',
            content: '# Daily report',
            language: undefined,
        })
    );
    const image = await h.storage.db.getAttachmentById('generated-image');
    expect(image?.encrypted).toBeDefined();
    expect(JSON.stringify(image)).not.toContain('AQIDBA==');
    attachmentDataCache.clear();
    const restored = await deserializeAttachment(image!, await getSpaceDek((await h.storage.getSpace('task'))!));
    expect(restored?.data).toEqual(new Uint8Array([1, 2, 3, 4]));
    expect(savedMessages.find((message) => message.role === Role.Assistant)?.attachments?.[0].id).toBe(
        'generated-image'
    );
    expect(model).toHaveBeenCalledTimes(1);
    h.source.dispose();
});
