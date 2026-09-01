export const chargebeeWrapperVersion = '1.8.0';

export type Checkpoint = {
    name: string;
    data: any;
    /** Milliseconds between the document starting to run and this checkpoint. */
    at: number;
    /** Milliseconds this document had spent hidden by the time of this checkpoint. */
    hiddenFor: number;
};

const documentStart = Date.now();

let hiddenSince: number | null =
    typeof document !== 'undefined' && document.visibilityState === 'hidden' ? documentStart : null;
let hiddenBefore = 0;

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            hiddenSince = Date.now();
            return;
        }

        if (hiddenSince !== null) {
            hiddenBefore += Date.now() - hiddenSince;
            hiddenSince = null;
        }
    });
}

export function getHiddenFor(): number {
    return hiddenSince === null ? hiddenBefore : hiddenBefore + (Date.now() - hiddenSince);
}

const checkpoints: Checkpoint[] = [];

export function addCheckpoint(name: string, data?: any) {
    checkpoints.push({ name, data, at: Date.now() - documentStart, hiddenFor: getHiddenFor() });
}

/** Test-only: checkpoints accumulate for the lifetime of the document. */
export function resetCheckpoints() {
    checkpoints.length = 0;
}

export function getCheckpoints() {
    return checkpoints;
}

export function getLastCheckpointName(): string {
    return checkpoints[checkpoints.length - 1]?.name ?? 'none';
}
