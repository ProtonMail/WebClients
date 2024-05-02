import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { Api } from '@proton/shared/lib/interfaces';

export enum ExperimentGroup {
    control = 'control',
    treatment = 'treatment',
}

export enum Features {
    optimisticFileUploads = 'optimisticFileUploads',
    optimisticFolderUploads = 'optimisticFolderUploads',
}

export const sendTelemetryFeaturePerformance = (
    api: Api,
    featureName: Features,
    timeInMs: number,
    treatment: ExperimentGroup
) => {
    sendTelemetryReport({
        api: api,
        measurementGroup: TelemetryMeasurementGroups.driveWebFeaturePerformance,
        event: TelemetryDriveWebFeature.performance,
        values: {
            milliseconds: timeInMs,
        },
        dimensions: {
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
    api: Api,
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
        api,
        feature,
        measure.duration,
        applyTreatment ? ExperimentGroup.treatment : ExperimentGroup.control
    );
    return result;
};
