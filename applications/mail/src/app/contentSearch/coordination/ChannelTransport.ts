/**
 * The part of the BroadcastChannel API content search uses, so a channel can be a BroadcastChannel or stand in
 * for one: delivers messages to the other tabs of one user, never back to the tab that posted them.
 */
export interface ChannelTransport {
    postMessage(message: unknown): void;
    addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
    removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
    /** stops delivering messages to this tab. Posting afterwards throws, as on a BroadcastChannel */
    close(): void;
}
