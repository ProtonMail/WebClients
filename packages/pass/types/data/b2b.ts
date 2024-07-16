import type { UniqueItem } from './items';

export enum B2BEventName {
    ItemRead = 'item.read',
}

type B2BEventBase<T extends B2BEventName, V = {}> = { name: T; timestamp: number } & V;
type B2BEvents = B2BEventBase<B2BEventName.ItemRead, UniqueItem>;

export type B2BEvent<T extends B2BEventName = B2BEventName> = Extract<B2BEvents, { name: T }>;
