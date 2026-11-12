import type { PendingClientToolCall } from './client-tools';
import type { RequestEncryptionParams } from './encryptionParams';
import type { LumoCompletionTarget, Turn } from './types';

export interface GenerationRecoveryState {
    jobId: string;
    token: string;
    createdAt: number;
    target: LumoCompletionTarget;
    phase: 'streaming' | 'tool-pending' | 'tool-running' | 'ready' | 'completed';
    turns: Turn[];
    pendingCalls?: PendingClientToolCall[];
    previousJobs?: { jobId: string; token: string }[];
    round?: number;
}

export interface GenerationRecovery {
    checkpoint(state: GenerationRecoveryState, encryption: RequestEncryptionParams | null): Promise<void | 'disabled'>;
    confirmToolRetry?(): Promise<boolean>;
}

export class GenerationInterruptedError extends Error {
    constructor() {
        super('Generation is waiting to reconnect');
        this.name = 'GenerationInterruptedError';
    }
}

export class ToolRetryConfirmationRequiredError extends Error {
    constructor() {
        super('Confirmation is required before retrying an interrupted tool');
        this.name = 'ToolRetryConfirmationRequiredError';
    }
}

export function newRecoveryState(turns: Turn[], target: LumoCompletionTarget): GenerationRecoveryState {
    return {
        jobId: crypto.randomUUID(),
        token: Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
            byte.toString(16).padStart(2, '0')
        ).join(''),
        createdAt: Date.now(),
        target,
        phase: 'streaming',
        turns,
    };
}
