import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Progress from '@proton/components/components/progress/Progress';
import { logger } from '@proton/logger';
import { generateSyntheticLogCalls } from '@proton/logger/fixtures';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { PhaseResultRows, ResultRow } from './PhaseResultRows';
import { captureBreakdown, sleep, startMainThreadMonitor } from './helper';
import type { BurstResult, RealisticResult } from './interface';

/** Checkpoints up to `DEFAULT_MAX_ENTRIES`, the worst case a real session can reach. */
const BURST_COUNTS = [100, 1_000, 10_000];

const REALISTIC_ENTRIES = 1_000;
const REALISTIC_DURATION_MS = 60_000;

/** CPU (crypto) vs I/O (IndexedDB `put`) split of the write path, from `packages/logger`'s own marks. */
const getWriteBreakdownSpecs = () => [
    { label: c('Label').t`Encrypt`, nameSuffix: ':persist:encrypt' },
    { label: c('Label').t`IndexedDB store`, nameSuffix: 'logger-storage:store' },
];

/**
 * Lets the logger be stress-tested from a real browser tab, since the `IndexedDB` and crypto
 * costs measured against `fake-indexeddb` in `packages/logger/perf` may not match a real
 * browser's. Writes real entries into the real logger's database: clear them from the "Mail
 * logs" tab afterward if that matters.
 *
 * Every write and read phase reports whether it skipped animation frames (visible jank) and
 * whether it triggered a Long Task (blocked the main thread for 50 ms or more) — the two
 * concrete signs that exporting logs should move off the main thread.
 *
 * No read phase details as the code is executed in a worker.
 */
export const DebugModalLogPerformance = () => {
    const [running, setRunning] = useState(false);
    const [runningRealistic, setRunningRealistic] = useState(false);
    const [progress, setProgress] = useState(0);
    const [burstResult, setBurstResult] = useState<BurstResult>();
    const [realisticResult, setRealisticResult] = useState<RealisticResult>();

    const runBurst = async (entries: number) => {
        setRunning(true);
        try {
            const calls = generateSyntheticLogCalls(entries);

            const writeMonitor = startMainThreadMonitor();
            const writeStart = performance.now();
            calls.forEach(({ level, message, args }) => logger[level](message, ...args));
            await logger.flush();
            const writeDurationMs = performance.now() - writeStart;
            const writeStats = await writeMonitor.stop();
            const writeBreakdown = captureBreakdown(getWriteBreakdownSpecs(), writeStart);

            const readMonitor = startMainThreadMonitor();
            const readStart = performance.now();
            const logs = await logger.getLogs();
            const readDurationMs = performance.now() - readStart;
            const readStats = await readMonitor.stop();

            setBurstResult({
                entries,
                write: { durationMs: writeDurationMs, stats: writeStats, breakdown: writeBreakdown },
                read: { durationMs: readDurationMs, stats: readStats },
                exportSize: new Blob([logs]).size,
            });
        } finally {
            setRunning(false);
        }
    };

    const runRealisticSession = async () => {
        setRunningRealistic(true);
        setProgress(0);
        try {
            const calls = generateSyntheticLogCalls(REALISTIC_ENTRIES);
            const intervalMs = REALISTIC_DURATION_MS / REALISTIC_ENTRIES;

            const writeMonitor = startMainThreadMonitor();
            const writeStart = performance.now();
            let emitMs = 0;
            for (let index = 0; index < calls.length; index++) {
                const { level, message, args } = calls[index];

                const emitStart = performance.now();
                logger[level](message, ...args);
                emitMs += performance.now() - emitStart;

                setProgress(Math.round(((index + 1) / calls.length) * 100));

                if (index < calls.length - 1) {
                    await sleep(intervalMs);
                }
            }

            const drainStart = performance.now();
            await logger.flush();
            const drainMs = performance.now() - drainStart;
            const writeDurationMs = performance.now() - writeStart;
            const writeStats = await writeMonitor.stop();
            const writeBreakdown = captureBreakdown(getWriteBreakdownSpecs(), writeStart);

            const readMonitor = startMainThreadMonitor();
            const readStart = performance.now();
            const logs = await logger.getLogs();
            const readDurationMs = performance.now() - readStart;
            const readStats = await readMonitor.stop();

            setRealisticResult({
                entries: REALISTIC_ENTRIES,
                emitMs,
                drainMs,
                write: { durationMs: writeDurationMs, stats: writeStats, breakdown: writeBreakdown },
                read: { durationMs: readDurationMs, stats: readStats },
                exportSize: new Blob([logs]).size,
            });
        } finally {
            setRunningRealistic(false);
        }
    };

    return (
        <div className="flex flex-column gap-6 text-sm">
            <section>
                <h3 className="text-rg text-semibold mb-1">{c('Label').t`Burst write`}</h3>
                <p className="color-weak mt-0 mb-2">
                    {c('Info')
                        .t`Writes realistic log lines back-to-back, then reads them all back. Shows how write and read/export cost scale with the number of stored entries.`}
                </p>
                <div className="flex gap-2 items-center mb-2">
                    {BURST_COUNTS.map((count) => (
                        <Button
                            key={count}
                            size="small"
                            disabled={running}
                            loading={running}
                            onClick={() => runBurst(count)}
                        >
                            {c('Action').t`Write ${count} logs`}
                        </Button>
                    ))}
                </div>
                {burstResult && (
                    <div className="flex flex-column gap-1">
                        <ResultRow title={c('Label').t`Entries`} value={String(burstResult.entries)} />
                        <PhaseResultRows title={c('Label').t`Write`} phase={burstResult.write} />
                        <PhaseResultRows title={c('Label').t`Read / export`} phase={burstResult.read} />
                        <ResultRow
                            title={c('Label').t`Export size`}
                            value={humanSize({ bytes: burstResult.exportSize })}
                        />
                    </div>
                )}
            </section>
            <section>
                <h3 className="text-rg text-semibold mb-1">{c('Label').t`Realistic session`}</h3>
                <p className="color-weak mt-0 mb-2">
                    {c('Info')
                        .t`Writes ${REALISTIC_ENTRIES} realistic log lines trickling in over a minute, like an actual session, instead of all at once. Takes about a minute to run. Keep this tab focused: frame measurements pause in the background.`}
                </p>
                <Button
                    size="small"
                    disabled={runningRealistic}
                    loading={runningRealistic}
                    onClick={runRealisticSession}
                    className="mb-2"
                >
                    {c('Action').t`Run realistic session`}
                </Button>
                {runningRealistic && progress > 0 && progress < 100 && <Progress value={progress} className="mb-2" />}
                {realisticResult && (
                    <div className="flex flex-column gap-1">
                        <ResultRow title={c('Label').t`Entries`} value={String(realisticResult.entries)} />
                        <ResultRow
                            title={c('Label').t`Sum of write() calls`}
                            value={`${realisticResult.emitMs.toFixed(1)} ms`}
                        />
                        <ResultRow
                            title={c('Label').t`Write-chain drain after last line`}
                            value={`${realisticResult.drainMs.toFixed(1)} ms`}
                        />
                        <PhaseResultRows title={c('Label').t`Write (whole session)`} phase={realisticResult.write} />
                        <PhaseResultRows title={c('Label').t`Read / export`} phase={realisticResult.read} />
                        <ResultRow
                            title={c('Label').t`Export size`}
                            value={humanSize({ bytes: realisticResult.exportSize })}
                        />
                    </div>
                )}
            </section>
        </div>
    );
};
