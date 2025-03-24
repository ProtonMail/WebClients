import type {
  BaseEvent,
  BasePropertyValues,
  BasePropertiesStateInterface,
  EventPayloadMap,
  PropertyCallback,
} from './BasePropertiesStateInterface'

// TODO: rename to StoreBase
// TODO: use JS private fields (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields) instead of TypeScript private fields
/**
 * Abstract class that can be extended to create a store.
 *
 * A store provides the following features:
 *
 * - Holds a state: a set of reactive properties which supports:
 *   - Getting or setting the value of a property.
 *   - Getting the value of all properties (the complete state).
 *   - Subscribing to changes of a specific property or any property.
 * - Provides an event system which supports:
 *   - Emitting events.
 *   - Subscribing to specific events or any event.
 *
 * Note that properties are shallow, and nested values are not reactive. Property values should be treated as immutable.
 * @example
 * ```ts
 * TODO: add example
 * ```
 */
export abstract class BasePropertiesState<P extends BasePropertyValues, E extends BaseEvent = BaseEvent>
  implements BasePropertiesStateInterface<P, E>
{
  // reactive properties
  // -------------------

  private values: P

  private propertySubscribers: Map<keyof P, Set<PropertyCallback<keyof P, P>>> = new Map()
  private anyPropertySubscribers: Set<(property: keyof P, value: P[keyof P]) => void> = new Set()

  constructor(
    /**
     * The default values for the properties.
     */
    defaultValues: P,
  ) {
    this.values = { ...defaultValues }
  }

  // TODO: rename to `subscribeAny`
  // TODO: consider overloading `subscribe` to accept "*" or "any" as the first argument,
  // and remove this method
  /**
   * Subscribes to changes of any property.
   *
   * @returns A function to unsubscribe.
   */
  subscribeToAnyProperty(
    /**
     * The callback that will be invoked when the value of any property changes.
     */
    callback: (
      /**
       * The property which value has changed.
       */
      property: keyof P,
      /**
       * The new value of the property.
       */
      value: P[keyof P],
    ) => void,
  ): () => void {
    this.anyPropertySubscribers.add(callback)

    // Notify callback immediately of all current values
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

  // TODO: rename to `subscribe`
  /**
   * Subscribes to changes of a specific property.
   *
   * @returns A function to unsubscribe.
   */
  subscribeToProperty<T extends keyof P>(
    /**
     * The property to subscribe to.
     */
    property: T,
    /**
     * The callback that will be invoked when the value of the property changes.
     */
    callback: PropertyCallback<T, P>,
  ) {
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

  // TODO: rename to `set`
  /**
   * Sets the value of a property. Subscribers will be notified of the change.
   */
  setProperty<T extends keyof P>(
    /**
     * The property to set.
     */
    property: T,
    /**
     * The new value to set for the property.
     */
    value: P[T],
  ) {
    const previousValue = this.values[property]
    this.values[property] = value

    this.notifyPropertySubscribers(property, value, previousValue)
  }

  // TODO: rename to `get`
  /**
   * Gets the value of a property.
   */
  getProperty<T extends keyof P>(
    /**
     * The property to get.
     */
    property: T,
  ): P[T] {
    return this.values[property]
  }

  /**
   * Gets all properties.
   */
  getState(): P {
    return { ...this.values }
  }

  // events
  // ------

  private eventSubscribers: Map<E['name'], Set<(payload: E['payload']) => void>> = new Map()
  private anyEventSubscribers: Set<(event: E) => void> = new Set()

  // TODO: rename to `emit`
  /**
   * Emits an event.
   */
  emitEvent(
    /**
     * The event to emit.
     */
    event: E,
  ): void {
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

  // TODO: rename to `on`
  /**
   * Subscribes to a specific event.
   */
  subscribeToEvent<T extends E['name']>(
    /**
     * The event to subscribe to.
     */
    event: T,
    /**
     * The callback that will be invoked when the event occurs.
     */
    callback: (
      /**
       * The payload of the event.
       */
      payload: EventPayloadMap<E>[T],
    ) => void,
  ): () => void {
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

  // TODO: rename to `onAny`
  // TODO: consider overloading `on` to accept "*" or "any" as the first argument,
  // and remove this method
  /**
   * Subscribes to any event.
   */
  subscribeToAnyEvent(
    /**
     * The callback that will be invoked when any event occurs.
     */
    callback: (event: E) => void,
  ): () => void {
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
