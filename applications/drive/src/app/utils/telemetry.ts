import {
    TelemetryDriveWebFeature,
    TelemetryMeasurementGroups,
    sendTelemetryData,
} from '@proton/shared/lib/api/telemetry';

export enum ExperimentGroup {
    control = 'control',
    treatment = 'treatment',
}

export enum Features {
    optimisticFileUploads = 'optimisticFileUploads',
    optimisticFolderUploads = 'optimisticFolderUploads',
}

export const sendTelemetryFeaturePerformance = (
    featureName: Features,
    timeInMs: number,
    treatment: ExperimentGroup
) => {
    sendTelemetryData({
        MeasurementGroup: TelemetryMeasurementGroups.driveWebFeaturePerformance,
        Event: TelemetryDriveWebFeature.performance,
        Values: {
            milliseconds: timeInMs,
        },
        Dimensions: {
            experimentGroup: treatment,
            featureName,
        },
    });
};

/**
 * Executes a feature group with either control or treatment functions.
 *
 * @param {Features} feature The type of feature to execute (e.g. 'A', 'B', etc.) defined in the `Features` enum
 * @param {boolean} applyTreatment Whether to execute the treatment or control function
 * @param {(()) => T} controlFunction A function that should be executed when `applyTreatment` is false
 * @param {(()) => T} treatmentFunction A function that should be executed when `applyTreatment` is true
 * @returns {T} The result of the executed function, both control and treatment should have same return type
 */
export const measureExperimentalPerformance = <T>(
    feature: Features,
    applyTreatment: boolean,
    controlFunction: () => T,
    treatmentFunction: () => T
): T => {
    performance.mark(`start-${feature}`);
    const result = applyTreatment ? treatmentFunction() : controlFunction();
    performance.mark(`end-${feature}`);
    const measure = performance.measure(`duration-${feature}`, `start-${feature}`, `end-${feature}`);
    sendTelemetryFeaturePerformance(
        feature,
        measure.duration,
        applyTreatment ? ExperimentGroup.treatment : ExperimentGroup.control
    );
    return result;
};
