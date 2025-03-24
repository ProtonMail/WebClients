// TODO: rename to `BaseStoreEvent`
/**
 * The base type for a store event.
 */
export interface BaseEvent {
  name: string
  payload: unknown
}

// TODO: rename to `StoreEventPayloadMap`
/**
 * A map of event names to their payloads.
 *
 * Useful to extract the payload type for a specific event name.
 */
export type EventPayloadMap<E extends BaseEvent> = {
  [K in E['name']]: Extract<E, { name: K }>['payload']
}

// TODO: should probably be "empty object" type, e.g. Record<string, never>
// TODO: rename to `BaseStoreState`
/**
 * The base type for property values.
 */
export interface BasePropertyValues {}

// TODO: rename to `StoreSubscribeCallback`
/**
 * The callback for a property value change.
 */
export type PropertyCallback<T extends keyof P, P extends BasePropertyValues> = (
  value: P[T],
  previousValue: P[T] | undefined,
) => void

// TODO: this is probably not needed (not used anywhere else, redundant with the class itself, and already looks outdated)
export interface BasePropertiesStateInterface<P extends BasePropertyValues, E extends BaseEvent> {
  subscribeToProperty<T extends keyof P>(property: T, callback: PropertyCallback<T, P>): () => void
  setProperty: <T extends keyof P>(property: T, value: P[T]) => void
  getProperty: <T extends keyof P>(property: T) => P[T]
  getState: () => P

  emitEvent(event: E): void
  subscribeToEvent<T extends E['name']>(event: T, callback: (payload: EventPayloadMap<E>[T]) => void): () => void
}
