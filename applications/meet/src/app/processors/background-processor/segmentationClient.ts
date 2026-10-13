import { withTimeout } from '@proton/meet/utils/withTimeout';

export type SegmentationResult = { mask: Uint8Array<ArrayBuffer>; width: number; height: number };

const SEGMENTATION_TIMEOUT_MS = 2000;

// Replies to this id are ignored.
const WARMUP_REQUEST_ID = 0;

export class SegmentationClient {
    private nextRequestId = WARMUP_REQUEST_ID;

    private pending = new Map<number, (result: SegmentationResult | null) => void>();

    private disposed = false;

    constructor(private readonly port: MessagePort) {
        port.onmessage = (event: MessageEvent) => this.handleMessage(event.data);
    }

    // Takes ownership of `bitmap`.
    async request(bitmap: ImageBitmap): Promise<SegmentationResult | null> {
        if (this.disposed) {
            bitmap.close();
            return null;
        }
        const id = ++this.nextRequestId;
        const result = new Promise<SegmentationResult | null>((resolve) => {
            this.pending.set(id, resolve);
        });
        this.post(bitmap, id);

        try {
            return await withTimeout(result, 'Background segmentation', SEGMENTATION_TIMEOUT_MS);
        } catch {
            this.pending.delete(id);
            return null;
        }
    }

    warmUp(bitmap: ImageBitmap) {
        if (this.disposed) {
            bitmap.close();
            return;
        }
        this.post(bitmap, WARMUP_REQUEST_ID);
    }

    dispose() {
        this.disposed = true;
        this.pending.forEach((resolve) => resolve(null));
        this.pending.clear();
        this.port.onmessage = null;
        this.port.close();
    }

    private post(bitmap: ImageBitmap, id: number) {
        try {
            this.port.postMessage({ type: 'segment', bitmap, timestamp: performance.now(), id }, [bitmap]);
        } catch {
            bitmap.close();
            this.settle(id, null);
        }
    }

    private settle(id: number, result: SegmentationResult | null) {
        const resolve = this.pending.get(id);
        if (resolve) {
            this.pending.delete(id);
            resolve(result);
        }
    }

    private handleMessage(msg: { type?: string; id?: number; buffer?: ArrayBuffer; width?: number; height?: number }) {
        if (typeof msg?.id !== 'number') {
            return;
        }
        if (msg.type === 'mask' && msg.buffer) {
            this.settle(msg.id, {
                mask: new Uint8Array(msg.buffer),
                width: msg.width ?? 0,
                height: msg.height ?? 0,
            });
        } else if (msg.type === 'mask-failed') {
            this.settle(msg.id, null);
        }
    }
}
