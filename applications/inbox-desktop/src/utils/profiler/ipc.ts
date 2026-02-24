import { performance } from "node:perf_hooks";

const IPC_SLOW_THRESHOLD_MS = 5;
interface IPCEntry {
    channel: string;
    type: string;
    arrivedMs: number;
    handlerMs: number;
}

export class IpcRecorder {
    private ipcEntries: IPCEntry[] = [];
    private ipcWindowOpen = true;
    private storedIifeStart = 0;
    private storedWindowShownMs = 0;

    constructor(windowShownMs: number, iifeStart: number) {
        this.storedWindowShownMs = windowShownMs;
        this.storedIifeStart = iifeStart;
    }

    closeIpcWindow(): void {
        this.ipcWindowOpen = false;
    }

    ipcMessage(channel: string, type: string, handlerMs: number): void {
        if (!this.ipcWindowOpen) return;
        this.ipcEntries.push({
            channel,
            type,
            arrivedMs: Math.round(performance.now() - this.storedIifeStart - this.storedWindowShownMs),
            handlerMs: Math.round(handlerMs * 100) / 100,
        });
    }

    build() {
        if (this.ipcEntries.length === 0) {
            return { firstMessageMs: null, lastMessageMs: null, messageCount: 0, slowHandlers: [] };
        }
        const arrivals = this.ipcEntries.map((e) => e.arrivedMs);
        const slowHandlers = this.ipcEntries.filter((e) => e.handlerMs >= IPC_SLOW_THRESHOLD_MS);
        return {
            firstMessageMs: Math.min(...arrivals),
            lastMessageMs: Math.max(...arrivals),
            messageCount: this.ipcEntries.length,
            slowHandlers,
        };
    }
}
