import type { ScheduleRun } from '@proton/lumo-api-client/core/desktop-schedules';

import { Role } from '../../types';
import { AgentScheduleExecutor } from './AgentScheduleExecutor';
import {
    type ScheduleExecutionTarget,
    SchedulePersistenceError,
    type ScheduleRunRepository,
    type ScheduleTaskSource,
} from './types';

const run: ScheduleRun = {
    runId: 'run',
    scheduleId: 'task',
    timingRevision: 1,
    scheduledFor: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z',
    status: 'running',
};
const target: ScheduleExecutionTarget = {
    conversationId: 'conversation',
    prompt: {
        id: 'prompt',
        conversationId: 'conversation',
        createdAt: run.scheduledFor,
        role: Role.User,
        content: 'Summarize',
    },
    assistant: {
        id: 'answer',
        parentId: 'prompt',
        conversationId: 'conversation',
        createdAt: run.scheduledFor,
        role: Role.Assistant,
        content: '',
    },
};
function setup() {
    const events: string[] = [];
    const repository: jest.Mocked<ScheduleRunRepository> = {
        claim: jest.fn<ReturnType<ScheduleRunRepository['claim']>, Parameters<ScheduleRunRepository['claim']>>(
            async () => true
        ),
        startRun: jest.fn<ReturnType<ScheduleRunRepository['startRun']>, Parameters<ScheduleRunRepository['startRun']>>(
            async () => {
                events.push('start');
                return target;
            }
        ),
        finishRun: jest.fn<
            ReturnType<ScheduleRunRepository['finishRun']>,
            Parameters<ScheduleRunRepository['finishRun']>
        >(async (result) => {
            events.push('save');
            return result.outcome;
        }),
        getStatus: jest.fn<
            ReturnType<ScheduleRunRepository['getStatus']>,
            Parameters<ScheduleRunRepository['getStatus']>
        >(async () => undefined),
        interruptRun: jest.fn<
            ReturnType<ScheduleRunRepository['interruptRun']>,
            Parameters<ScheduleRunRepository['interruptRun']>
        >(async () => 'interrupted'),
        getResult: jest.fn<
            ReturnType<ScheduleRunRepository['getResult']>,
            Parameters<ScheduleRunRepository['getResult']>
        >(async () => undefined),
    };
    const tasks: ScheduleTaskSource = {
        list: async () => [],
        getTask: async () => ({
            id: 'task',
            timingRevision: 1,
            prompt: 'Summarize',
            connectorIds: ['calendar'],
            notifyOnComplete: true,
        }),
    };
    const runConversation = jest.fn<
        ReturnType<ConstructorParameters<typeof AgentScheduleExecutor>[0]['runConversation']>,
        Parameters<ConstructorParameters<typeof AgentScheduleExecutor>[0]['runConversation']>
    >(async () => {
        events.push('generate');
        return { outcome: 'succeeded', messageIds: ['answer'] };
    });
    let current = true;
    const controller = new AbortController();
    const onComplete = jest.fn(async () => {
        events.push('notify');
    });
    const executor = new AgentScheduleExecutor({
        accountId: 'account',
        tasks,
        repository,
        runConversation,
        isCurrentAccount: () => current,
        onComplete,
    });
    return {
        executor,
        repository,
        tasks,
        runConversation,
        events,
        onComplete,
        controller,
        context: { accountId: 'account', signal: controller.signal },
        expire: () => {
            current = false;
        },
    };
}

it('uses shared conversation execution and commits its message references before notification', async () => {
    const h = setup();
    expect(await h.executor.execute(run, h.context)).toBe('succeeded');
    expect(h.events).toEqual(['start', 'generate', 'save', 'notify']);
    expect(h.runConversation.mock.calls[0][0]).toBe(target);
    expect(h.repository.finishRun.mock.calls[0][0]).toMatchObject({
        run,
        outcome: 'succeeded',
        messageIds: ['answer'],
    });
});
it('returns a lost claim without invoking execution or reconciliation', async () => {
    const h = setup();
    h.repository.claim.mockResolvedValue(false);
    expect(await h.executor.claim(run, h.context)).toBe(false);
    expect(h.runConversation).not.toHaveBeenCalled();
});
it('does not start if prompt persistence fails', async () => {
    const h = setup();
    h.repository.startRun.mockRejectedValue(new SchedulePersistenceError('disk'));
    await expect(h.executor.execute(run, h.context)).rejects.toBeInstanceOf(SchedulePersistenceError);
    expect(h.runConversation).not.toHaveBeenCalled();
    expect(h.repository.finishRun).not.toHaveBeenCalled();
});
it('does not report success when final persistence fails', async () => {
    const h = setup();
    h.repository.finishRun.mockRejectedValue(new SchedulePersistenceError('disk'));
    await expect(h.executor.execute(run, h.context)).rejects.toBeInstanceOf(SchedulePersistenceError);
    expect(h.onComplete).not.toHaveBeenCalled();
});
it('rejects a stale task revision without generation', async () => {
    const h = setup();
    h.tasks.getTask = async () => ({ id: 'task', timingRevision: 2, prompt: 'x', connectorIds: [] });
    expect(await h.executor.execute(run, h.context)).toBe('failed');
    expect(h.runConversation).not.toHaveBeenCalled();
});
it('preserves failed execution outcomes without a success notification', async () => {
    const h = setup();
    h.runConversation.mockResolvedValue({ outcome: 'failed', messageIds: ['answer'] });
    expect(await h.executor.execute(run, h.context)).toBe('failed');
    expect(h.onComplete).not.toHaveBeenCalled();
});
it('marks thrown execution errors interrupted rather than retrying', async () => {
    const h = setup();
    h.runConversation.mockRejectedValue(new Error('tool connection lost'));
    expect(await h.executor.execute(run, h.context)).toBe('interrupted');
    expect(h.runConversation).toHaveBeenCalledTimes(1);
    expect(h.repository.finishRun.mock.calls[0][0].messageIds).toEqual(['answer']);
});
it('keeps a saved outcome when notifications fail', async () => {
    const h = setup();
    h.onComplete.mockRejectedValue(new Error('notification unavailable'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        expect(await h.executor.execute(run, h.context)).toBe('succeeded');
    } finally {
        log.mockRestore();
    }
});
it('does not save into an expired account', async () => {
    const h = setup();
    h.runConversation.mockImplementation(async () => {
        h.expire();
        return { outcome: 'succeeded', messageIds: ['answer'] };
    });
    await expect(h.executor.execute(run, h.context)).rejects.toMatchObject({ name: 'AbortError' });
    expect(h.repository.finishRun).not.toHaveBeenCalled();
});
it('reports saved outcomes and interrupts uncertain runs without generation', async () => {
    const h = setup();
    h.repository.getStatus.mockResolvedValueOnce('succeeded').mockResolvedValueOnce('running');
    expect(await h.executor.reconcile(run, h.context)).toBe('succeeded');
    expect(await h.executor.reconcile(run, h.context)).toBe('interrupted');
    expect(h.runConversation).not.toHaveBeenCalled();
});
