export * from './selectors';

export enum ItemStatus {
    Waiting = 'waiting',
    Finalizing = 'finalizing',
    Completed = 'completed',
    Unknown = 'unknown',
}

export enum Phase {
    Idle = 'idle',
    Working = 'working',
    Done = 'done',
}

export interface ScimSetupSliceState {
    phase: Phase;
    userStatuses: Record<string, ItemStatus>;
    groupStatuses: Record<string, ItemStatus>;
    groupMemberStatuses: Record<string, ItemStatus>;
}
