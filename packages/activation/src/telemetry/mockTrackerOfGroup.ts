import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { mockTracker } from '@proton/telemetry-tracker/testing';

/**
 * `mockTracker` that only records the reports of one measurement group. A test of one group must not see the
 * events of the others.
 */
const mockTrackerOfGroup = (group: TelemetryMeasurementGroups) => {
    const tracker = mockTracker();
    const allReports = tracker.reports;
    const reports: typeof allReports = [];

    allReports.push = (...items) => {
        reports.push(...items.filter((report) => report.measurementGroup === group));
        return allReports.length;
    };

    return { ...tracker, reports };
};

export const mockAccountImportFlowTracker = () => mockTrackerOfGroup(TelemetryMeasurementGroups.accountImportFlow);
