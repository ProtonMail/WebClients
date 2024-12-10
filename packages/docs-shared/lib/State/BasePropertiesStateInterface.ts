export interface BaseEvent {
  name: string
  payload: unknown
}

export type EventPayloadMap<E extends BaseEvent> = {
  [K in E['name']]: Extract<E, { name: K }>['payload']
}

export interface BasePropertyValues {}

export type PropertyCallback<T extends keyof P, P extends BasePropertyValues> = (
  value: P[T],
  previousValue: P[T] | undefined,
) => void

export interface BasePropertiesStateInterface<P extends BasePropertyValues, E extends BaseEvent> {
  subscribeToProperty<T extends keyof P>(property: T, callback: PropertyCallback<T, P>): () => void
  setProperty: <T extends keyof P>(property: T, value: P[T]) => void
  getProperty: <T extends keyof P>(property: T) => P[T]
  getState: () => P

  emitEvent(event: E): void
  subscribeToEvent<T extends E['name']>(event: T, callback: (payload: EventPayloadMap<E>[T]) => void): () => void
}
