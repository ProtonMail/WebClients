import type { TelemetryReport } from '@proton/shared/lib/api/telemetry';
import type { Api } from '@proton/shared/lib/interfaces';

import { Tracker, setTrackerInstance } from '../lib/tracker';

export type RecordedReport = TelemetryReport & { delay: boolean; flushImmediately: boolean };

export interface RecordedAnalyticsEvent {
    name: string;
    data: Record<string, string | number | boolean>;
}

/**
 * Installs a tracker that records reports instead of sending them.
 * Call `restore()` in `afterEach` to go back to an uninitialised tracker.
 */
export const mockTracker = () => {
    const reports: RecordedReport[] = [];
    const analyticsEvents: RecordedAnalyticsEvent[] = [];
    setTrackerInstance(
        new Tracker({
            api: (() => Promise.resolve()) as unknown as Api,
            send: (r) => reports.push(r),
            sendAnalytics: (name, data) => analyticsEvents.push({ name, data }),
        })
    );
    return {
        /** Reports sent to Telemetry */
        reports,
        /** Events sent to Proton analytics */
        analyticsEvents,
        restore: () => setTrackerInstance(undefined),
    };
};
