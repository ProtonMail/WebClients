import type { Action } from 'redux';

import { type WithMeta, withMetaFactory } from './meta';

export type ShareDedupeMeta = { dedup: boolean };
export type WithShareDedupe<A = Action> = WithMeta<ShareDedupeMeta, A>;

export const isShareDedupeAction = <T extends Action>(action?: T): action is WithShareDedupe<T> => (action as any)?.meta?.dedup === true;

export const withShareDedupe = withMetaFactory<ShareDedupeMeta>({ dedup: true });
export const withShareDedupeOptions = (options: Omit<ShareDedupeMeta, 'cache'>) => withMetaFactory({ ...options, dedup: true });
