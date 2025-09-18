type ListenerArgs<T> = T extends void ? [] : [T];

export type EventListener<T> = (...args: ListenerArgs<T>) => void;

/** Minimal event emitter with typed events. */
export class EventEmitter<TEvents extends Record<string, unknown> = Record<string, unknown>> {
    private listeners = new Map<keyof TEvents, Set<(...args: unknown[]) => void>>();

    on<K extends keyof TEvents>(event: K, listener: EventListener<TEvents[K]>): () => void {
        const listeners = this.listeners.get(event) ?? new Set<(...args: unknown[]) => void>();
        listeners.add(listener as (...args: unknown[]) => void);
        this.listeners.set(event, listeners);
        return () => this.off(event, listener);
    }

    off<K extends keyof TEvents>(event: K, listener: EventListener<TEvents[K]>): void {
        const listeners = this.listeners.get(event);
        if (!listeners) {
            return;
        }
        listeners.delete(listener as (...args: unknown[]) => void);
        if (!listeners.size) {
            this.listeners.delete(event);
        }
    }

    once<K extends keyof TEvents>(event: K, listener: EventListener<TEvents[K]>): () => void {
        const wrapped: EventListener<TEvents[K]> = ((...args: ListenerArgs<TEvents[K]>) => {
            this.off(event, wrapped);
            listener(...args);
        }) as EventListener<TEvents[K]>;

        return this.on(event, wrapped);
    }

    emit<K extends keyof TEvents>(event: K, ...payload: ListenerArgs<TEvents[K]>): void {
        const listeners = this.listeners.get(event);
        if (!listeners?.size) {
            return;
        }
        listeners.forEach((listener) => {
            (listener as (...args: ListenerArgs<TEvents[K]>) => void)(...payload);
        });
    }

    clear(event?: keyof TEvents): void {
        if (typeof event === 'undefined') {
            this.listeners.clear();
            return;
        }
        this.listeners.delete(event);
    }
}
