import { performance } from "node:perf_hooks";

const IPC_SLOW_THRESHOLD_MS = 5;

interface IPCEntry {
    channel: string;
    type: string;
    arrivedMs: number;
    handlerMs: number;
}

const ipcEntries: IPCEntry[] = [];
let ipcWindowOpen = false;
let storedIifeStart = 0;
let storedWindowShownMs = 0;

function openIpcWindow(windowShownMs: number, iifeStart: number): void {
    storedWindowShownMs = windowShownMs;
    storedIifeStart = iifeStart;
    ipcWindowOpen = true;
}

function closeIpcWindow(): void {
    ipcWindowOpen = false;
}

function ipcMessage(channel: string, type: string, handlerMs: number): void {
    if (!ipcWindowOpen) return;
    ipcEntries.push({
        channel,
        type,
        arrivedMs: Math.round(performance.now() - storedIifeStart - storedWindowShownMs),
        handlerMs: Math.round(handlerMs * 100) / 100,
    });
}

function reset(): void {
    ipcEntries.length = 0;
    ipcWindowOpen = false;
    storedIifeStart = 0;
    storedWindowShownMs = 0;
}

function buildIPC() {
    if (ipcEntries.length === 0) {
        return { firstMessageMs: null, lastMessageMs: null, messageCount: 0, slowHandlers: [] };
    }
    const arrivals = ipcEntries.map((e) => e.arrivedMs);
    const slowHandlers = ipcEntries.filter((e) => e.handlerMs >= IPC_SLOW_THRESHOLD_MS);
    return {
        firstMessageMs: Math.min(...arrivals),
        lastMessageMs: Math.max(...arrivals),
        messageCount: ipcEntries.length,
        slowHandlers,
    };
}

export const ipc = { openIpcWindow, closeIpcWindow, ipcMessage, buildIPC, reset };
