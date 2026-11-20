import type { IndexStatus } from '../db/schema';
import type { ChannelTransport } from './ChannelTransport';

export type TabMessage =
    /** `undefined` once the database is deleted */
    | { type: 'status'; status: IndexStatus | undefined }
    | { type: 'progress'; processed: number; total: number }
    | { type: 'indexComplete' }
    /** the app version a tab runs */
    | { type: 'version'; version: string };

const indexStatuses: (IndexStatus | undefined)[] = ['enabled', 'paused', 'disabled', undefined];

/** what another tab posted, if it's a message this tab understands: another app version may post others */
const parseTabMessage = (data: unknown): TabMessage | undefined => {
    if (typeof data !== 'object' || data === null) {
        return undefined;
    }
    const message = data as Record<string, unknown>;
    switch (message.type) {
        case 'status': {
            const status = message.status as IndexStatus | undefined;
            if (!indexStatuses.includes(status)) {
                return undefined;
            }
            return { type: 'status', status };
        }
        case 'progress': {
            const { processed, total } = message;
            if (typeof processed !== 'number' || typeof total !== 'number') {
                return undefined;
            }
            return { type: 'progress', processed, total };
        }
        case 'indexComplete':
            return { type: 'indexComplete' };
        case 'version': {
            const { version } = message;
            if (typeof version !== 'string') {
                return undefined;
            }
            return { type: 'version', version };
        }
        default:
            return undefined;
    }
};

/** The messages the content search tabs of one user exchange. */
export class TabChannel {
    private closed = false;

    constructor(private readonly transport: ChannelTransport) {}

    /** does nothing once closed, e.g. a status change after the app unmounted */
    post(message: TabMessage): void {
        if (this.closed) {
            return;
        }
        this.transport.postMessage(message);
    }

    subscribe(listener: (message: TabMessage) => void): () => void {
        const handler = (event: MessageEvent) => {
            const message = parseTabMessage(event.data);
            if (message) {
                listener(message);
            }
        };
        this.transport.addEventListener('message', handler);
        return () => {
            this.transport.removeEventListener('message', handler);
        };
    }

    close(): void {
        this.closed = true;
        this.transport.close();
    }
}
