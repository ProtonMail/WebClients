import type { ChannelTransport as ChannelTransportInterface } from '../ChannelTransport';

/** {@link ChannelTransportInterface} for a tab that works alone: there is no other tab to deliver to. */
export class ChannelTransport implements ChannelTransportInterface {
    postMessage(_message: unknown): void {}

    addEventListener(_type: 'message', _listener: (event: MessageEvent) => void): void {}

    removeEventListener(_type: 'message', _listener: (event: MessageEvent) => void): void {}

    close(): void {}
}
