/** Answers "did we skip frames" (via rAF deltas) and "did we hang" (via the Long Tasks API). */
export interface MainThreadStats {
    frames: number;
    droppedFrames: number;
    longestFrameMs: number;
    longTaskApiSupported: boolean;
    longTasks: number;
    longestLongTaskMs: number;
    totalLongTaskMs: number;
}

/** One named slice of a `PhaseResult`'s duration, e.g. "Encrypt" within "Write". */
export interface PhaseBreakdownEntry {
    label: string;
    durationMs: number;
}

export interface PhaseResult {
    durationMs: number;
    stats: MainThreadStats;
    /** Internal `performance.mark`/`measure` breakdown captured during this phase, if any. */
    breakdown?: PhaseBreakdownEntry[];
}

export interface BurstResult {
    entries: number;
    write: PhaseResult;
    read: PhaseResult;
    exportSize: number;
}

export interface RealisticResult {
    entries: number;
    /** Sum of each `logger[level]()` call's own duration, folded into `write.durationMs`. */
    emitMs: number;
    /** Write-chain drain after the last line, folded into `write.durationMs`. */
    drainMs: number;
    write: PhaseResult;
    read: PhaseResult;
    exportSize: number;
}
