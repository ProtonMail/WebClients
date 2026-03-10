import type { MainThreadBridge } from './MainThreadBridge';

type BridgeListener = (bridge: MainThreadBridge) => void;

/**
 * Stable, long-lived service that holds the active MainThreadBridge.
 * When a client disconnects and another connects, the internal main thread bridge
 * will change and notify any consumer of this service.
 */
export class ActiveMainThreadBridgeService {
    private current: MainThreadBridge | null = null;
    private readonly listeners = new Set<BridgeListener>();

    get(): MainThreadBridge | null {
        return this.current;
    }

    update(bridge: MainThreadBridge): void {
        this.current = bridge;
        this.listeners.forEach((fn) => fn(bridge));
    }

    onChange(listener: BridgeListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}
