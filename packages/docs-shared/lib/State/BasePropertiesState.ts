import type {
  BaseEvent,
  BasePropertyValues,
  BasePropertiesStateInterface,
  EventPayloadMap,
  PropertyCallback,
} from './BasePropertiesStateInterface'

export abstract class BasePropertiesState<P extends BasePropertyValues, E extends BaseEvent>
  implements BasePropertiesStateInterface<P, E>
{
  private values: P

  private propertySubscribers: Map<keyof P, Set<PropertyCallback<keyof P, P>>> = new Map()
  private anyPropertySubscribers: Set<(property: keyof P, value: P[keyof P]) => void> = new Set()

  private eventSubscribers: Map<E['name'], Set<(payload: E['payload']) => void>> = new Map()
  private anyEventSubscribers: Set<(event: E) => void> = new Set()

  constructor(defaultValues: P) {
    this.values = { ...defaultValues }
  }

  subscribeToAnyProperty(callback: (property: keyof P, value: P[keyof P]) => void): () => void {
    this.anyPropertySubscribers.add(callback)

    Object.entries(this.values).forEach(([property, value]) => {
      try {
        callback(property as keyof P, value as P[keyof P])
      } catch (error) {
        console.error(`Error in initial any property subscriber call for ${String(property)}:`, error)
      }
    })

    return () => {
      this.anyPropertySubscribers.delete(callback)
    }
  }

  subscribeToProperty<T extends keyof P>(property: T, callback: PropertyCallback<T, P>) {
    if (!this.propertySubscribers.has(property)) {
      this.propertySubscribers.set(property, new Set())
    }

    const subscribers = this.propertySubscribers.get(property)!
    subscribers.add(callback as PropertyCallback<keyof P, P>)

    try {
      callback(this.values[property], undefined)
    } catch (error) {
      console.error(`Error in initial property subscriber call for ${String(property)}:`, error)
    }

    return () => {
      subscribers.delete(callback as PropertyCallback<keyof P, P>)
      if (subscribers.size === 0) {
        this.propertySubscribers.delete(property)
      }
    }
  }

  private notifyPropertySubscribers<T extends keyof P>(property: T, value: P[T], previousValue: P[T]) {
    const propertySubscribers = this.propertySubscribers.get(property)
    if (propertySubscribers) {
      propertySubscribers.forEach((callback) => {
        try {
          callback(value, previousValue)
        } catch (error) {
          console.error(`Error in property subscriber for ${String(property)}:`, error)
        }
      })
    }

    const anyPropertySubscribers = this.anyPropertySubscribers
    if (anyPropertySubscribers) {
      anyPropertySubscribers.forEach((callback) => {
        try {
          callback(property, value)
        } catch (error) {
          console.error(`Error in any property subscriber for ${String(property)}:`, error)
        }
      })
    }
  }

  setProperty<T extends keyof P>(property: T, value: P[T]) {
    const previousValue = this.values[property]
    this.values[property] = value

    this.notifyPropertySubscribers(property, value, previousValue)
  }

  getProperty<T extends keyof P>(property: T): P[T] {
    return this.values[property]
  }

  getState(): P {
    return { ...this.values }
  }

  emitEvent(event: E): void {
    const thisEventSubscribers = this.eventSubscribers.get(event.name)
    if (thisEventSubscribers) {
      thisEventSubscribers.forEach((callback) => {
        try {
          callback(event.payload)
        } catch (error) {
          console.error(`Error in event subscriber for ${String(event.name)}:`, error)
        }
      })
    }

    this.notifyAnyEventSubscribers(event)
  }

  subscribeToEvent<T extends E['name']>(event: T, callback: (payload: EventPayloadMap<E>[T]) => void): () => void {
    if (!this.eventSubscribers.has(event)) {
      this.eventSubscribers.set(event, new Set())
    }

    const subscribers = this.eventSubscribers.get(event)!
    subscribers.add(callback as (payload: E['payload']) => void)

    return () => {
      subscribers.delete(callback as (payload: E['payload']) => void)
      if (subscribers.size === 0) {
        this.eventSubscribers.delete(event)
      }
    }
  }

  subscribeToAnyEvent(callback: (event: E) => void): () => void {
    this.anyEventSubscribers.add(callback)
    return () => {
      this.anyEventSubscribers.delete(callback)
    }
  }

  private notifyAnyEventSubscribers(event: E) {
    this.anyEventSubscribers.forEach((callback) => {
      try {
        callback(event)
      } catch (error) {
        console.error(`Error in any event subscriber for ${String(event)}:`, error)
      }
    })
  }
}
