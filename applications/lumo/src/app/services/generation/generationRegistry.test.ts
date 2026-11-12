import { waitFor } from '@testing-library/react';

import { LumoApiClient } from '@proton/lumo-api-client/core/client';
import type { ClientToolResult } from '@proton/lumo-api-client/core/client-tools';
import { newRecoveryState } from '@proton/lumo-api-client/core/recovery';

import { GenerationRegistry, OPERATION_IN_PROGRESS_MESSAGE } from './generationRegistry';

const originalLocks = Object.getOwnPropertyDescriptor(navigator, 'locks');
let held: Set<string>;

beforeEach(() => {
    held = new Set();
    const request = async (name: string, _options: LockOptions, callback: LockGrantedCallback<unknown>) => {
        await Promise.resolve();
        if (held.has(name)) {
            return callback(null);
        }
        held.add(name);
        try {
            return await callback({ name, mode: 'exclusive' });
        } finally {
            held.delete(name);
        }
    };
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } });
});

afterEach(() => {
    if (originalLocks) {
        Object.defineProperty(navigator, 'locks', originalLocks);
    } else {
        Reflect.deleteProperty(navigator, 'locks');
    }
});

it('allows only one tab to execute a conversation and retains ownership through Stop cleanup', async () => {
    const firstTab = new GenerationRegistry();
    const secondTab = new GenerationRegistry();
    const execute = jest.fn();
    const first = await firstTab.startExclusive('conversation');
    execute('first action');
    firstTab.abort('conversation');
    expect(first.signal.aborted).toBe(true);
    await expect(secondTab.startExclusive('conversation')).rejects.toThrow(OPERATION_IN_PROGRESS_MESSAGE);
    expect(execute.mock.calls).toEqual([['first action']]);
    expect(secondTab.isInProgress('conversation')).toBe(false);
    const unrelated = await secondTab.startExclusive('other');
    secondTab.finish('other', unrelated);
    firstTab.finish('conversation', first);
    await waitFor(() => expect([...held]).toEqual([]));
    const second = await secondTab.startExclusive('conversation');
    execute('second action');
    expect(execute.mock.calls).toEqual([['first action'], ['second action']]);
    secondTab.finish('conversation', second);
});

it('keeps ownership during logout until uninterruptible client tools settle', async () => {
    const firstTab = new GenerationRegistry();
    const secondTab = new GenerationRegistry();
    const controller = await firstTab.startExclusive('conversation');
    firstTab.abortAll();
    expect(controller.signal.aborted).toBe(true);
    await expect(secondTab.startExclusive('conversation')).rejects.toThrow(OPERATION_IN_PROGRESS_MESSAGE);
    firstTab.finish('conversation', controller);
    await waitFor(() => expect([...held]).toEqual([]));
    const next = await secondTab.startExclusive('conversation');
    expect(next.signal.aborted).toBe(false);
    secondTab.finish('conversation', next);
});

it('releases local registration if the browser rejects a lock request', async () => {
    const registry = new GenerationRegistry();
    const error = new Error('Lock request failed');
    jest.spyOn(navigator.locks, 'request').mockRejectedValueOnce(error);
    await expect(registry.startExclusive('conversation')).rejects.toBe(error);
    expect(registry.isInProgress('conversation')).toBe(false);
    const controller = await registry.startExclusive('conversation');
    expect(controller.signal.aborted).toBe(false);
    registry.finish('conversation', controller);
});

it('falls back to ordinary generation without enabling recovery when locks are unavailable', async () => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    const registry = new GenerationRegistry();
    expect(registry.canRecover()).toBe(false);
    const controller = await registry.startExclusive('conversation');
    expect(controller.signal.aborted).toBe(false);
    expect(registry.isInProgress('conversation')).toBe(true);
    registry.finish('conversation', controller);
});

it('executes a recovered pending tool only once when two tabs try to resume it', async () => {
    const firstTab = new GenerationRegistry();
    const secondTab = new GenerationRegistry();
    const result = Promise.withResolvers<ClientToolResult[]>();
    const execute = jest.fn(() => result.promise);
    const api = jest.fn();
    const checkpoint = {
        ...newRecoveryState([], 'message'),
        phase: 'tool-pending' as const,
        pendingCalls: [{ id: 'action', name: 'action', arguments: '{}' }],
    };
    const resume = async (registry: GenerationRegistry) => {
        const controller = await registry.startExclusive('conversation');
        try {
            return await new LumoApiClient({ enableU2LEncryption: false }).callAssistant(api, [], {
                resume: checkpoint,
                signal: controller.signal,
                recovery: { checkpoint: async () => {} },
                clientToolExecutor: { canExecute: () => true, execute },
            });
        } finally {
            registry.finish('conversation', controller);
        }
    };
    const first = resume(firstTab);
    try {
        await waitFor(() => expect(execute).toHaveBeenCalledWith(checkpoint.pendingCalls));
        await expect(resume(secondTab)).rejects.toThrow(OPERATION_IN_PROGRESS_MESSAGE);
    } finally {
        result.resolve([{ content: 'Action completed once', endTurn: true }]);
    }
    await expect(first).resolves.toMatchObject({ status: 'succeeded' });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(api).not.toHaveBeenCalled();
});
