import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { mockTracker } from '@proton/telemetry-tracker/testing';

/**
 * `mockTracker` that only records the reports of one measurement group. Every flow sends its events to several groups
 * (the earlier funnels and `accountImportFlow`), a test of one group must not see the others.
 */
export const mockTrackerOfGroup = (group: TelemetryMeasurementGroups) => {
    const tracker = mockTracker();
    const allReports = tracker.reports;
    const reports: typeof allReports = [];

    allReports.push = (...items) => {
        reports.push(...items.filter((report) => report.measurementGroup === group));
        return allReports.length;
    };

    return { ...tracker, reports };
};

export const mockBYOECreationFunnelTracker = () => mockTrackerOfGroup(TelemetryMeasurementGroups.byoeCreationFunnel);

export const mockEasySwitchCreationFunnelTracker = () =>
    mockTrackerOfGroup(TelemetryMeasurementGroups.easySwitchCreationFunnel);
