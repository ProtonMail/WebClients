import { useSyncExternalStore } from 'react';

/** How far a whole-file analysis has got, so the chat can show it while the tool call runs. */
export type AnalysisProgress = {
    phase: 'reading' | 'merging';
    /** Parts of the file read so far. */
    done: number;
    /** Parts the file was cut into. */
    total: number;
    startedAt: number;
};

type Listener = () => void;

let progressByCall: Record<string, AnalysisProgress> = {};
const listeners = new Set<Listener>();

const publish = () => listeners.forEach((listener) => listener());

export function setAnalysisProgress(callId: string, progress: Omit<AnalysisProgress, 'startedAt'>): void {
    const startedAt = progressByCall[callId]?.startedAt ?? Date.now();
    progressByCall = { ...progressByCall, [callId]: { ...progress, startedAt } };
    publish();
}

export function clearAnalysisProgress(callId: string): void {
    if (!(callId in progressByCall)) {
        return;
    }
    const { [callId]: _finished, ...rest } = progressByCall;
    progressByCall = rest;
    publish();
}

export function getAnalysisProgress(callId: string | undefined): AnalysisProgress | undefined {
    return callId ? progressByCall[callId] : undefined;
}

const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/** Progress of the analysis behind `callId`; none when the call is not known. */
export function useAnalysisProgress(callId: string | undefined): AnalysisProgress | undefined {
    return useSyncExternalStore(
        subscribe,
        () => getAnalysisProgress(callId),
        () => getAnalysisProgress(callId)
    );
}
