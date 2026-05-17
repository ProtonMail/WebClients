import type { Action } from 'redux';

import { type WithMeta, withMetaFactory } from './meta';

export type ItemsMeta = { items: { updated: boolean; batch?: boolean } };
export type WithItems<A = Action> = WithMeta<ItemsMeta, A>;

export const isItemsAction = <T extends Action>(action?: T): action is WithItems<T> => (action as any)?.meta?.items?.updated === true;
export const withItems = withMetaFactory<ItemsMeta>({ items: { updated: true } });
export const withItemsBatch = withMetaFactory<ItemsMeta>({ items: { updated: true, batch: true } });
