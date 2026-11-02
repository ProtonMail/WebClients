import { type Middleware, configureStore } from '@reduxjs/toolkit';
import 'fake-indexeddb/auto';

import { LumoApiClient } from '@proton/lumo-api-client/core/client';
import type { ScheduleRun } from '@proton/lumo-api-client/core/desktop-schedules';
import type { ChatCompletionsRequest } from '@proton/lumo-api-client/types-api';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { generateMasterKeyBase64, generateSkillKeyBase64 } from '../../crypto';
import { BUNDLE_INDEX_VERSION } from '../../features/skills/skillBundle';
import { getSkillDek, serializeSkill, serializeSkillAsset } from '../../features/skills/skillSerialization';
import { loadSkills } from '../../features/skills/skillsThunks';
import type { Skill } from '../../features/skills/types';
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
import skills from '../../redux/slices/skills';
import { deserializeAttachment, serializeSpace } from '../../serialization';
import { Role, SpaceType, getSpaceDek } from '../../types';
import { buildMasterKeyContext } from '../../util/masterKeys';
import { attachmentDataCache } from '../attachmentDataCache';
import { ConversationScheduleRunRepository } from './ConversationScheduleRunRepository';
import { type ScheduleAppStore, ScheduleStorage } from './ScheduleStorage';
import { SpaceScheduleSource } from './SpaceScheduleSource';
import { type ScheduleGenerationOptions, createScheduleConversationRunner } from './runScheduleConversation';

jest.mock('../../llm/tokenizer', () => ({ countTokens: () => 0 }));
// Inspect synthetic request bodies at the real transport boundary without changing production encryption defaults.
jest.mock('../../llm/config', () => ({ ENABLE_U2L_ENCRYPTION: false }));

const options: ScheduleGenerationOptions = {
    customAgents: true,
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
    const keys = { primaryMasterKey: generateMasterKeyBase64(), primaryMasterKeyId: 'primary', masterKeys: {} };
    const dbApi = new DbApi(accountId);
    const store = configureStore({
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({ thunk: { extraArgument: { dbApi } } }).concat(capture),
        reducer: {
            spaces,
            conversations,
            messages,
            attachments,
            idmap,
            composerActions,
            contextFilters,
            lumoUserSettings,
            skills,
            credentials: (state = { masterKeyState: { status: 'ready', ...keys } }) => state,
        },
    });
    const storage = new ScheduleStorage(dbApi, store as unknown as ScheduleAppStore, keys, () => true, {
        postConversation: async () => 'remote-conversation',
    });
    const source = new SpaceScheduleSource(accountId, storage);
    storage.store.dispatch(
        saveSchedule('task', {
            name: 'Scheduled report',
            instructions: 'Write a report',
            recurrenceRule: { frequency: 'DAILY', hour: 15, minute: 0, timezone: 'Asia/Taipei' },
            connectors: [{ id: 'calendar', label: 'Calendar', readOnly: true }],
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
                tools: [{ name: 'read', read_only: true, description: '', input_schema: { type: 'object' } }],
            },
            {
                id: 'shell',
                display_name: 'Shell',
                status: { state: 'ready' },
                tools: [{ name: 'run', description: '', input_schema: { type: 'object' } }],
            },
        ],
    });
    return { store, storage, source, repository, task, target, context, runner, createTools, actions, keys };
}

afterEach(() => jest.restoreAllMocks());

it('shares chat settings and tool composition, preserves streamed metadata, and durably saves the real messages', async () => {
    const h = await setup();
    expect(h.task.readOnlyConnectorIds).toEqual(['calendar']);
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
    expect(h.createTools).toHaveBeenCalledWith(expect.objectContaining({ readOnlyConnectorIds: ['calendar'] }));
    h.source.dispose();
});

it('applies only the schedule skill selection through the real chat preparation path', async () => {
    const h = await setup();
    const makeSkill = (id: string): Skill => ({
        id,
        name: id,
        instructions: `${id} private skill instructions`,
        description: '',
        enabled: true,
        source: 'created',
        skillKey: '',
        createdAt: '',
        updatedAt: '',
    });
    h.store.dispatch(
        loadSkills.fulfilled({ skills: [makeSkill('selected'), makeSkill('other')], migratedAgentIds: [] }, 'load')
    );
    const space = h.store.getState().spaces.task;
    if (space.spaceType !== SpaceType.Schedule) throw new Error('Expected schedule space');
    h.storage.store.dispatch(saveSchedule('task', { ...space.schedule, skillIdsOrSubSkillRefs: ['selected'] }, 'edit'));
    jest.spyOn(LumoApiClient.prototype, 'callAssistant').mockImplementation(async (_api, turns) => {
        const content = turns.map((turn) => turn.content).join('\n');
        expect(content).toContain('selected private skill instructions');
        expect(content).not.toContain('other private skill instructions');
        return { status: 'succeeded', turns, producedTurns: [{ content: 'done', role: Role.Assistant }] };
    });
    expect(await h.runner(h.target, h.task, h.context, run)).toMatchObject({ outcome: 'succeeded' });
});

it.each([{ skillRefs: [] }, { skillRefs: ['selected'] }])(
    'continues without skills when loading fails for task refs $skillRefs',
    async ({ skillRefs }) => {
        const h = await setup();
        jest.spyOn(h.storage.db, 'getAllSkills').mockRejectedValue(new Error('Synthetic skill-store failure'));
        const space = h.store.getState().spaces.task;
        if (space.spaceType !== SpaceType.Schedule) throw new Error('Expected schedule space');
        h.storage.store.dispatch(
            saveSchedule('task', { ...space.schedule, skillIdsOrSubSkillRefs: skillRefs }, 'edit')
        );
        const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const model = jest.spyOn(LumoApiClient.prototype, 'callAssistant').mockImplementation(async (_api, turns) => {
            const content = turns.map((turn) => turn.content ?? '').join('\n');
            expect(content).toContain('Write a report');
            expect(content).not.toContain('[Skill /');
            expect(content).not.toContain('[Available skills:');
            return {
                status: 'succeeded',
                turns,
                producedTurns: [{ content: 'Report without skills', role: Role.Assistant }],
            };
        });
        expect(await h.runner(h.target, h.task, h.context, run)).toMatchObject({ outcome: 'succeeded' });
        expect(model).toHaveBeenCalledTimes(1);
        expect(h.store.getState().skills.status).toBe('error');
        expect(warning).toHaveBeenCalledWith(
            'Could not load skills for scheduled conversation; continuing without skills'
        );
        h.source.dispose();
    }
);

it('still stops an aborted run when skill loading also fails', async () => {
    const h = await setup();
    const controller = new AbortController();
    jest.spyOn(h.storage.db, 'getAllSkills').mockImplementation(async () => {
        controller.abort();
        throw new Error('Synthetic skill-store failure');
    });
    const model = jest.spyOn(LumoApiClient.prototype, 'callAssistant');
    await expect(h.runner(h.target, h.task, { ...h.context, signal: controller.signal }, run)).rejects.toMatchObject({
        name: 'AbortError',
    });
    expect(model).not.toHaveBeenCalled();
    h.source.dispose();
});

it('sends selected root and sub-skill instructions through the real request serializer and scopes file tool reads', async () => {
    const h = await setup();
    const base = {
        createdAt: '',
        updatedAt: '',
        skillKey: generateSkillKeyBase64(),
        enabled: true,
        source: 'created' as const,
        description: 'Synthetic test skill',
    };
    const selected: Skill = { ...base, id: 'selected', name: 'Selected', instructions: 'QA_SELECTED_ROOT' };
    const bundle: Skill = {
        ...base,
        id: 'bundle',
        name: 'Bundle',
        instructions: '',
        subSkills: [
            { path: 'skills/draft', name: 'Draft', description: 'Draft text', enabled: true },
            { path: 'skills/edit', name: 'Edit', description: 'Edit text', enabled: true },
        ],
    };
    const available: Skill = { ...base, id: 'available', name: 'Available', instructions: 'QA_GLOBAL_SKILL' };
    const disabled: Skill = {
        ...base,
        id: 'disabled',
        name: 'Disabled',
        instructions: 'QA_DISABLED_SKILL',
        enabled: false,
    };
    const dek = await getSkillDek(bundle);
    const files = await Promise.all(
        [
            ['skills/draft/SKILL.md', 'QA_SELECTED_SUBSKILL'],
            ['skills/draft/notes.txt', 'QA_REFERENCE_FILE'],
            ['skills/edit/SKILL.md', 'QA_SIBLING_SECRET'],
            ['skills/edit/secret.txt', 'QA_SIBLING_SECRET'],
        ].map(([path, content], index) =>
            serializeSkillAsset(
                {
                    id: `file-${index}`,
                    skillId: bundle.id,
                    createdAt: '',
                    updatedAt: '',
                    path,
                    mimeType: 'text/plain',
                    data: new TextEncoder().encode(content),
                },
                dek
            )
        )
    );
    jest.spyOn(h.storage.db, 'getSkillAssets').mockImplementation(async (id) => (id === bundle.id ? files : []));
    h.store.dispatch(
        loadSkills.fulfilled({ skills: [selected, bundle, available, disabled], migratedAgentIds: [] }, 'load')
    );
    const space = h.store.getState().spaces.task;
    if (space.spaceType !== SpaceType.Schedule) throw new Error('Expected schedule space');
    h.storage.store.dispatch(
        saveSchedule('task', { ...space.schedule, skillIdsOrSubSkillRefs: ['selected', 'bundle/skills/draft'] }, 'edit')
    );
    const requests: ChatCompletionsRequest[] = [];
    const chunk = (value: object) => `data: ${JSON.stringify(value)}\n\n`;
    const api = (async ({ data }: { data: ChatCompletionsRequest }) => {
        requests.push(structuredClone(data));
        const calls = [
            { name: 'use_skill', args: { name: 'available' } },
            { name: 'read_skill_file', args: { skill: 'draft', path: 'notes.txt' } },
            { name: 'read_skill_file', args: { skill: 'draft', path: '../edit/secret.txt' } },
        ];
        const call = calls[requests.length - 1];
        const body = call
            ? chunk({
                  choices: [
                      {
                          index: 0,
                          delta: {
                              tool_calls: [
                                  {
                                      index: 0,
                                      id: `call-${requests.length}`,
                                      function: { name: call.name, arguments: JSON.stringify(call.args) },
                                  },
                              ],
                          },
                      },
                  ],
              }) + chunk({ choices: [{ index: 0, finish_reason: 'tool_calls' }] })
            : chunk({ choices: [{ index: 0, delta: { content: 'Synthetic response' } }] });
        return new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(body + 'data: [DONE]\n\n'));
                controller.close();
            },
        });
    }) as Api;
    const runner = createScheduleConversationRunner({
        storage: h.storage,
        api,
        getOptions: () => ({ ...options, artifactsView: false, imageTools: false, externalTools: false }),
        createTools: h.createTools,
        getConnectors: async () => [],
    });
    expect(await runner(h.target, h.task, h.context, run)).toMatchObject({ outcome: 'succeeded' });
    expect(requests).toHaveLength(4);
    const first = JSON.stringify(requests[0]);
    const last = JSON.stringify(requests[3]);
    expect(first).toContain('QA_SELECTED_ROOT');
    expect(first).toContain('QA_SELECTED_SUBSKILL');
    expect(first).toContain(h.task.prompt);
    expect(first).not.toContain('QA_GLOBAL_SKILL');
    expect(last).toContain('QA_GLOBAL_SKILL');
    expect(last).toContain('QA_REFERENCE_FILE');
    expect(last).toContain('has no file');
    expect(last).not.toContain('QA_SIBLING_SECRET');
    expect(last).not.toContain('QA_DISABLED_SKILL');
    expect(JSON.stringify(requests[0].tools)).not.toContain('QA_');
    h.source.dispose();
});

it('loads the global skill pool on a cold start even when no skills are selected on the task', async () => {
    const h = await setup();
    const global: Skill = {
        id: 'cold-start-global',
        name: 'Cold start global',
        description: 'Available after loading',
        instructions: 'Global instructions loaded only on demand',
        enabled: true,
        source: 'created',
        skillKey: generateSkillKeyBase64(),
        createdAt: '',
        updatedAt: '',
        bundleIndexVersion: BUNDLE_INDEX_VERSION,
    };
    const { primary } = await buildMasterKeyContext(h.keys);
    await h.storage.db.putSkill(await serializeSkill(global, primary));
    expect(h.store.getState().skills.status).toBe('idle');
    jest.spyOn(LumoApiClient.prototype, 'callAssistant').mockImplementation(async (_api, turns) => {
        expect(turns.map((turn) => turn.content).join('\n')).toContain('cold-start-global: Available after loading');
        return { status: 'succeeded', turns, producedTurns: [{ content: 'done', role: Role.Assistant }] };
    });
    expect(await h.runner(h.target, h.task, h.context, run)).toMatchObject({ outcome: 'succeeded' });
    expect(h.store.getState().skills.status).toBe('ready');
    h.source.dispose();
});
