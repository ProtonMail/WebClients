import { useSyncExternalStore } from 'react';

import { useScheduleService } from '../../providers/ScheduleServiceContext';
import { useLumoSelector } from '../../redux/hooks';
import { selectLatestRunsByScheduleId, selectSpaceById } from '../../redux/selectors';
import { STOPPED_SCHEDULE_SNAPSHOT } from '../../services/schedules/types';
import { isScheduleSpace } from '../../types';

const noop = () => () => {};
const getSnapshot = () => STOPPED_SCHEDULE_SNAPSHOT;

export const useScheduleRunState = (
    scheduleId: string
): {
    /** Whether the current service is actively executing this schedule. Unsettled records alone do not imply active execution. */
    isRunning: boolean;
    /** Whether this schedule has a pending or accepted execution. False while it is running, even if extra runs are queued. */
    isQueued: boolean;
    /** Whether the next waiting execution belongs to this schedule. Accepted work takes precedence over pending work. False while this schedule is running. */
    isFirstInQueue: boolean;
    /** Whether future scheduled executions are disabled. An execution already running or manually queued can still proceed. */
    isPaused: boolean;
    /** ISO creation time of the current run's conversation, used as its start time. Undefined when no run is active or the latest conversation does not match it. */
    startedAt: string | undefined;
} => {
    const service = useScheduleService();
    const snapshot = useSyncExternalStore(service?.subscribe ?? noop, service?.getSnapshot ?? getSnapshot);
    const space = useLumoSelector(selectSpaceById(scheduleId));
    const latestRun = useLumoSelector(selectLatestRunsByScheduleId)[scheduleId];

    const currentRun =
        snapshot.status === 'running'
            ? snapshot.unsettledRuns.find((run) => run.scheduleId === scheduleId && run.runId === snapshot.activeRunId)
            : undefined;
    const nextRun = snapshot.unsettledRuns.find((run) => run.status === 'accepted') ?? snapshot.pendingRuns[0];
    const isRunning = !!currentRun;
    const isFirstInQueue = !isRunning && nextRun?.scheduleId === scheduleId;
    const isQueued =
        !isRunning &&
        [...snapshot.pendingRuns, ...snapshot.unsettledRuns].some(
            (run) => run.scheduleId === scheduleId && (run.status === 'pending' || run.status === 'accepted')
        );
    const isPaused = isScheduleSpace(space) && space.scheduleDefinition?.enabled === false;
    const startedAt =
        currentRun && latestRun?.scheduleRun?.run.runId === currentRun.runId ? latestRun.createdAt : undefined;

    return { isRunning, isQueued, isFirstInQueue, isPaused, startedAt };
};
