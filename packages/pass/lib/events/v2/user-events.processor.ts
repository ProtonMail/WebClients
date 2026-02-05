import type { SyncEventListOutput } from '@proton/pass/types';

export function* processUserEvents(_: SyncEventListOutput): Generator<unknown, boolean> {
    return false;
}
