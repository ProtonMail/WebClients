import { v5 as uuidv5 } from 'uuid';

import type { ScheduleRun } from '@proton/lumo-api-client/core/desktop-schedules';
import { Role, type Turn } from '@proton/lumo-api-client/core/types';

import { type Conversation, type Message, SpaceType } from '../../types';
import type { ScheduleStorage } from './ScheduleStorage';
import {
    type ScheduleCompletion,
    type ScheduleExecutionTarget,
    type ScheduleOutcome,
    SchedulePersistenceError,
    type ScheduleRunRepository,
    type ScheduleRunResult,
    type ScheduleTask,
} from './types';

export function scheduleConversationId(accountId: string, runId: string): string {
    return uuidv5(JSON.stringify(['lumo.schedule-run.v1', accountId, runId]), uuidv5.URL);
}

/** Stores each occurrence as a conversation with its execution prompt and outcome. */
export class ConversationScheduleRunRepository implements ScheduleRunRepository {
    private readonly grants = new Set<string>();

    constructor(
        private readonly accountId: string,
        private readonly storage: ScheduleStorage
    ) {}

    private async persist<T>(operation: () => Promise<T>): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            if (
                error instanceof SchedulePersistenceError ||
                (error instanceof DOMException && error.name === 'AbortError')
            ) {
                throw error;
            }
            throw new SchedulePersistenceError('Cannot persist schedule execution', { cause: error });
        }
    }

    claim = (run: ScheduleRun) => this.persist(() => this.claimStored(run));
    getStatus = (runId: string) => this.persist(() => this.readStatus(runId));
    startRun = (run: ScheduleRun, task: ScheduleTask) => this.persist(() => this.startStored(run, task));
    finishRun = (result: ScheduleCompletion) => this.persist(() => this.finishStored(result));
    interruptRun = (run: ScheduleRun) => this.persist(() => this.interruptStored(run));
    getResult = (runId: string) => this.persist(() => this.readResult(runId));
    listResults = () => this.persist(() => this.listStored());

    private id(runId: string) {
        return scheduleConversationId(this.accountId, runId);
    }

    private async create(run: ScheduleRun): Promise<Conversation> {
        const space = await this.storage.getSpace(run.scheduleId);
        if (!space) throw new SchedulePersistenceError('Schedule no longer exists');
        const now = new Date().toISOString();
        return {
            id: this.id(run.runId),
            spaceId: space.id,
            title: space.spaceType === SpaceType.Schedule ? space.schedule.name : 'Scheduled task',
            createdAt: now,
            updatedAt: now,
            scheduleRun: { run, status: 'running', messageIds: [] },
        };
    }

    private async claimStored(run: ScheduleRun) {
        const { raw } = await this.storage.readConversation(this.id(run.runId));
        if (raw || !(await this.storage.getSpace(run.scheduleId))) return false;
        const claimed = await this.storage.reserveConversation(await this.create(run));
        if (claimed) this.grants.add(run.runId);
        return claimed;
    }

    private async readStatus(runId: string) {
        const { raw, conversation } = await this.storage.readConversation(this.id(runId));
        // A deleted conversation must never allow its external actions to execute again.
        if (raw?.deleted) return 'interrupted' as const;
        return conversation?.scheduleRun?.status;
    }

    /** Save the actual execution prompt before invoking the agent. */
    private async startStored(run: ScheduleRun, task: ScheduleTask): Promise<ScheduleExecutionTarget> {
        if (!this.grants.delete(run.runId)) {
            throw new SchedulePersistenceError('This desktop has not reserved the occurrence');
        }
        for (let attempt = 0; attempt < 5; attempt++) {
            const { raw, conversation } = await this.storage.readConversation(this.id(run.runId));
            if (!conversation?.scheduleRun || conversation.scheduleRun.status !== 'running') {
                throw new SchedulePersistenceError('Run is no longer active');
            }
            if (conversation.scheduleRun.promptMessageId) throw new SchedulePersistenceError('Run has already started');
            const message: Message = {
                id: uuidv5('prompt', conversation.id),
                conversationId: conversation.id,
                createdAt: conversation.createdAt,
                role: Role.User,
                content: task.prompt,
            };
            const assistant: Message = {
                id: uuidv5('output', conversation.id),
                conversationId: conversation.id,
                parentId: message.id,
                createdAt: new Date(new Date(message.createdAt).getTime() + 1).toISOString(),
                role: Role.Assistant,
                content: '',
                placeholder: true,
                blocks: [],
            };
            const updated = {
                ...conversation,
                title: task.name ?? conversation.title,
                scheduleRun: { ...conversation.scheduleRun, promptMessageId: message.id },
            };
            if (await this.storage.writeConversation(updated, [message, assistant], raw)) {
                return { conversationId: conversation.id, prompt: message, assistant };
            }
        }
        throw new SchedulePersistenceError('Could not record scheduled prompt');
    }

    private async finishStored(result: ScheduleCompletion): Promise<ScheduleOutcome> {
        if (!(await this.storage.getSpace(result.run.scheduleId))) return 'interrupted';
        for (let attempt = 0; attempt < 5; attempt++) {
            const { raw, conversation } = await this.storage.readConversation(this.id(result.run.runId));
            if (raw?.deleted || !conversation?.scheduleRun) return 'interrupted';
            if (conversation.scheduleRun.status !== 'running') return conversation.scheduleRun.status;
            const current = this.storage.store.getState();
            const available = await this.currentMessages(conversation);
            const byId = new Map(available.map((message) => [message.id, message]));
            const messages = result.messageIds.map((id) => {
                const message = byId.get(id);
                if (!message || message.conversationId !== conversation.id) {
                    throw new SchedulePersistenceError('Scheduled output message is unavailable');
                }
                return message.placeholder ? { ...message, placeholder: false, status: 'failed' as const } : message;
            });
            const promptId = conversation.scheduleRun.promptMessageId;
            const prompt = promptId ? byId.get(promptId) : undefined;
            const updated: Conversation = {
                ...conversation,
                ...current.conversations[conversation.id],
                updatedAt: result.finishedAt,
                scheduleRun: {
                    ...conversation.scheduleRun,
                    status: result.outcome,
                    finishedAt: result.finishedAt,
                    messageIds: result.messageIds,
                },
            };
            if (await this.storage.writeConversation(updated, prompt ? [prompt, ...messages] : messages, raw)) {
                return result.outcome;
            }
        }
        throw new SchedulePersistenceError('Could not persist schedule completion');
    }

    private async currentMessages(conversation: Conversation): Promise<Message[]> {
        const saved = await this.storage.readMessages(conversation);
        const current = Object.values(this.storage.store.getState().messages).filter(
            (message) => message.conversationId === conversation.id
        );
        return [...new Map([...saved, ...current].map((message) => [message.id, message])).values()];
    }

    private async interruptStored(run: ScheduleRun): Promise<ScheduleOutcome> {
        const { raw, conversation } = await this.storage.readConversation(this.id(run.runId));
        if (raw?.deleted || !conversation?.scheduleRun) return 'interrupted';
        if (conversation.scheduleRun.status !== 'running') return conversation.scheduleRun.status;
        const messages = await this.currentMessages(conversation);
        return this.finishStored({
            run,
            outcome: 'interrupted',
            finishedAt: new Date().toISOString(),
            messageIds: messages
                .filter((message) => message.id !== conversation.scheduleRun?.promptMessageId)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                .map((message) => message.id),
        });
    }

    private async readResult(runId: string): Promise<ScheduleRunResult | undefined> {
        const { conversation } = await this.storage.readConversation(this.id(runId));
        const metadata = conversation?.scheduleRun;
        if (!conversation || !metadata || metadata.status === 'running' || !metadata.finishedAt) return undefined;
        const messages = await this.storage.readMessages(conversation);
        const byId = new Map(messages.map((message) => [message.id, message]));
        const producedTurns = metadata.messageIds.flatMap((id): Turn[] => {
            const message = byId.get(id);
            if (!message) throw new SchedulePersistenceError('Scheduled output message is missing');
            return (
                message.blocks?.map((block) => ({
                    role:
                        block.type === 'tool_call'
                            ? Role.ToolCall
                            : block.type === 'tool_result'
                              ? Role.ToolResult
                              : Role.Assistant,
                    content: block.content,
                })) ?? [{ role: message.role, content: message.content }]
            );
        });
        return {
            run: metadata.run,
            outcome: metadata.status,
            finishedAt: metadata.finishedAt,
            producedTurns,
            conversationId: conversation.id,
        };
    }

    private async listStored(): Promise<ScheduleRunResult[]> {
        const records = await this.storage.db.getAllConversations();
        const results: ScheduleRunResult[] = [];
        for (const record of records) {
            if (record.deleted) continue;
            // Metadata is encrypted; only conversations inside schedule spaces need decrypting.
            if (this.storage.store.getState().spaces[record.spaceId]?.spaceType !== SpaceType.Schedule) continue;
            const { conversation } = await this.storage.readConversation(record.id);
            if (!conversation?.scheduleRun) continue;
            const result = await this.getResult(conversation.scheduleRun.run.runId);
            if (result) results.push(result);
        }
        return results.sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
    }
}
