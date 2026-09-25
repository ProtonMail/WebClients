const channels = new Map<string, Set<FakeBroadcastChannel>>();

/**
 * In-memory BroadcastChannel fake that routes messages between instances with the same name.
 * Behaves like the real API: messages are delivered to all other channels with the same name,
 * but not to the sender.
 */
export class FakeBroadcastChannel implements BroadcastChannel {
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onmessageerror: ((ev: MessageEvent) => void) | null = null;
    private listeners = new Map<string, Set<EventListener>>();
    // Set on reset()/close() so a channel that outlives its test (e.g. a SharedWorkerAPI whose
    // disposeInternals() is still in flight when the next test's beforeEach runs) can't deliver
    // into - or receive from - the next test's channels of the same name: postMessage looks up
    // `channels` by name at call time, so without this a stale instance would simply re-find and
    // rejoin whatever new Set got registered under that name after reset().
    private closed = false;

    constructor(public readonly name: string) {
        const set = channels.get(name) ?? new Set<FakeBroadcastChannel>();
        set.add(this);
        channels.set(name, set);
    }

    postMessage(data: unknown) {
        if (this.closed) {
            return;
        }
        const event = { data } as MessageEvent;
        for (const ch of channels.get(this.name) ?? []) {
            if (ch !== this && !ch.closed) {
                ch.onmessage?.(event);
                ch.listeners.get('message')?.forEach((cb) => cb(event));
            }
        }
    }

    close() {
        this.closed = true;
        channels.get(this.name)?.delete(this);
    }

    addEventListener(type: string, cb: EventListener) {
        const set = this.listeners.get(type) ?? new Set();
        set.add(cb);
        this.listeners.set(type, set);
    }

    removeEventListener(type: string, cb: EventListener) {
        this.listeners.get(type)?.delete(cb);
    }

    dispatchEvent() {
        return false;
    }

    static reset() {
        for (const set of channels.values()) {
            for (const ch of set) {
                ch.closed = true;
            }
        }
        channels.clear();
    }
}
