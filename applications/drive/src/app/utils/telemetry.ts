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
 * @param {(()) => Promise<T>} controlFunction A function returning a Promise that should be fulfilled when `applyTreatment` is false
 * @param {(()) => Promise<T>} treatmentFunction A function returning a Promise that should be fulfilled when `applyTreatment` is true
 * @returns {Promise<T>} The Promise of the executed function, returns T when fulfilled, both control and treatment should have same return type
 */
export const measureExperimentalPerformance = <T>(
    api: Api,
    feature: Features,
    applyTreatment: boolean,
    controlFunction: () => Promise<T>,
    treatmentFunction: () => Promise<T>
): Promise<T> => {
    const now = performance.now();
    const startMark = `start-${feature}-${now}`;
    const endMark = `end-${feature}-${now}`;
    const measureName = `measure-${feature}-${now}`;

    performance.mark(startMark);
    const result = applyTreatment ? treatmentFunction() : controlFunction();

    result.finally(() => {
        performance.mark(endMark);
        const measure = performance.measure(measureName, startMark, endMark);
        // it can be undefined on browsers below Safari below 14.1 and Firefox 103
        if (measure) {
            sendTelemetryFeaturePerformance(
                api,
                feature,
                measure.duration,
                applyTreatment ? ExperimentGroup.treatment : ExperimentGroup.control
            );
        }
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
    });

    return result;
};
