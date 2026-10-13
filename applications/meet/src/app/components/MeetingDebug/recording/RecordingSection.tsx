import { useEffect, useRef, useState } from 'react';

import { SECOND } from '@proton/shared/lib/constants';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

import { useMeetingRecorderContext } from '../../../contexts/MeetingRecorderContext';
import { DEFAULT_STALL_THRESHOLD_MS } from '../../../hooks/useMeetingRecorder/chunkWatchdog/chunkWatchdog';
import { AUDIO_STALL_MS } from '../../../hooks/useMeetingRecorder/mediaEncoder/constants';
import type {
    RecordingDiagnostics,
    RecordingStopReport,
} from '../../../hooks/useMeetingRecorder/recordingSession/types';
import { Field } from '../Field';
import { SNAPSHOT_INTERVAL_MS } from '../constants';

const formatAgo = (timestamp: number | null, endedAt: number | null) => {
    if (timestamp === null) {
        return '(never)';
    }
    if (endedAt === null) {
        return `${((performance.now() - timestamp) / SECOND).toFixed(1)}s ago`;
    }
    const secondsBeforeEnd = (endedAt - timestamp) / SECOND;
    return secondsBeforeEnd >= 0
        ? `${secondsBeforeEnd.toFixed(1)}s before end`
        : `${(-secondsBeforeEnd).toFixed(1)}s after end`;
};

const isOlderThan = (timestamp: number | null, thresholdMs: number) =>
    timestamp === null || performance.now() - timestamp > thresholdMs;

const formatSeconds = (milliseconds: number | null) =>
    milliseconds === null ? '(pending)' : `${(milliseconds / SECOND).toFixed(1)}s`;

const StopReportFields = ({ stopReport, totalBytes }: { stopReport: RecordingStopReport; totalBytes: number }) => {
    const flushedAtStop = totalBytes - stopReport.bytesBeforeStop;

    return (
        <>
            <Field
                name="outcome"
                value={[stopReport.outcome ?? '(stopping)', stopReport.error].filter(Boolean).join(' · ')}
                highlight={stopReport.outcome !== 'ready'}
            />
            <Field name="duration" value={formatSeconds(stopReport.durationMs)} />
            <Field
                name="stop duration"
                value={formatSeconds(stopReport.stopDurationMs)}
                highlight={stopReport.stopDurationMs === null}
            />
            <Field name="streamed while recording" value={shortHumanSize(stopReport.bytesBeforeStop)} />
            <Field
                name="flushed at stop"
                value={shortHumanSize(flushedAtStop)}
                highlight={flushedAtStop > stopReport.bytesBeforeStop}
            />
            <Field
                name="file"
                value={stopReport.file ? `${stopReport.file.name} · ${shortHumanSize(stopReport.file.size)}` : '(none)'}
                highlight={!stopReport.file}
            />
        </>
    );
};

export const RecordingSection = () => {
    const { getRecordingDiagnostics } = useMeetingRecorderContext();
    const [diagnostics, setDiagnostics] = useState<RecordingDiagnostics | null>(null);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const panelWindow = sectionRef.current?.ownerDocument.defaultView ?? window;
        const takeSnapshot = () => setDiagnostics(getRecordingDiagnostics());

        takeSnapshot();
        const interval = panelWindow.setInterval(takeSnapshot, SNAPSHOT_INTERVAL_MS);

        return () => panelWindow.clearInterval(interval);
    }, [getRecordingDiagnostics]);

    const audio = diagnostics?.audio;
    const isActive = diagnostics?.isActive ?? false;
    const endedAt = isActive ? null : (diagnostics?.endedAt ?? null);
    const stopReport = diagnostics?.stopReport;

    return (
        <section ref={sectionRef} className="flex flex-column gap-2 w-full border border-weak rounded p-3">
            <h3 className="text-bold text-sm m-0">{isActive || !diagnostics ? 'Recording' : 'Last recording'}</h3>

            {!diagnostics ? (
                <Field name="session" value="(no recording yet)" />
            ) : (
                <>
                    <Field name="backend" value={diagnostics.backend} />
                    <Field name="mimeType" value={diagnostics.mimeType} />
                    <Field
                        name="recorderState"
                        value={diagnostics.recorderState}
                        highlight={isActive && diagnostics.recorderState !== 'recording'}
                    />

                    <Field
                        name="audioContext.state"
                        value={audio?.contextState ?? '(none)'}
                        highlight={isActive && audio?.contextState !== 'running'}
                    />
                    <Field name="audioContext.sampleRate" value={audio ? String(audio.sampleRate) : '(none)'} />
                    <Field name="audio sources" value={audio ? String(audio.connectedSourceCount) : '(none)'} />
                    {audio?.isTapActive && (
                        <Field
                            name="worklet batches"
                            value={`${audio.tapBatchCount} · last ${formatAgo(audio.lastTapBatchAt, endedAt)}`}
                            highlight={isActive && isOlderThan(audio.lastTapBatchAt, AUDIO_STALL_MS)}
                        />
                    )}

                    <Field
                        name="chunks written"
                        value={`${diagnostics.chunkCount} · ${shortHumanSize(diagnostics.totalBytes)}`}
                    />
                    <Field
                        name="last chunk"
                        value={formatAgo(diagnostics.lastChunkAt, endedAt)}
                        highlight={isActive && isOlderThan(diagnostics.lastChunkAt, DEFAULT_STALL_THRESHOLD_MS)}
                    />
                    <Field name="empty chunks" value={String(diagnostics.emptyChunkCount)} />
                    <Field name="pending OPFS writes" value={String(diagnostics.pendingWriteCount)} />

                    {stopReport && <StopReportFields stopReport={stopReport} totalBytes={diagnostics.totalBytes} />}
                </>
            )}
        </section>
    );
};
