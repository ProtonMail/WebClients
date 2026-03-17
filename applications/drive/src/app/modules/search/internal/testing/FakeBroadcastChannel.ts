const channels = new Map<string, Set<FakeBroadcastChannel>>();

/**
 * In-memory BroadcastChannel fake that routes messages between instances with the same name.
 * Behaves like the real API: messages are delivered to all other channels with the same name,
 * but not to the sender.
 */
export class FakeBroadcastChannel implements BroadcastChannel {
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onmessageerror: ((ev: MessageEvent) => void) | null = null;

    constructor(public readonly name: string) {
        const set = channels.get(name) ?? new Set<FakeBroadcastChannel>();
        set.add(this);
        channels.set(name, set);
    }

    postMessage(data: unknown) {
        for (const ch of channels.get(this.name) ?? []) {
            if (ch !== this) {
                ch.onmessage?.({ data } as MessageEvent);
            }
        }
    }

    close() {
        channels.get(this.name)?.delete(this);
    }

    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
        return false;
    }

    static reset() {
        channels.clear();
    }
}
