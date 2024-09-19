import { useEffect, useMemo } from 'react';

import { useApi } from '@proton/components/hooks';
import createApi from '@proton/shared/lib/api/createApi';
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { randomHexString4 } from '@proton/shared/lib/helpers/uid';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import * as config from '../config';
import { sendErrorReport } from './errorHandling';
import { EnrichedError } from './errorHandling/EnrichedError';
import { getLastActivePersistedUserSession } from './lastActivePersistedUserSession';

export enum ExperimentGroup {
    control = 'control',
    treatment = 'treatment',
}

export enum Features {
    mountToFirstItemRendered = 'mountToFirstItemRendered',
    totalSizeComputation = 'totalSizeComputation',
    sharingLoadLinksByVolume = 'sharingLoadLinksByVolume',
}

/**
 * At the present time, these metrics will only work when user is authenticated
 */
export enum Actions {
    DismissDocsOnboardingModal = 'dismissDocsOnboardingModal',
    AddToBookmark = 'addToBookmark',
    ViewSignUpFlowModal = 'viewSignUpFlowModal',
    DismissSignUpFlowModal = 'dismissSignUpFlowModal',
    SubmitSignUpFlowModal = 'submitSignUpFlowModal',
    SignUpFlowModal = 'signUpFlowModal',
    SignInFlowModal = 'signInFlowModal',
    OpenPublicLinkFromSharedWithMe = 'openPublicLinkFromSharedWithMe',
    PublicScanAndDownload = 'publicScanAndDownload',
    PublicDownload = 'publicDownload',
    PublicLinkVisit = 'publicLinkVisit',
    DeleteBookmarkFromSharedWithMe = 'DeleteBookmarkFromSharedWithMe',
}

type PerformanceTelemetryAdditionalValues = {
    quantity?: number;
};

export const sendTelemetryFeaturePerformance = (
    api: Api,
    featureName: Features,
    timeInMs: number,
    treatment: ExperimentGroup,
    additionalValues: PerformanceTelemetryAdditionalValues = {}
) => {
    void sendTelemetryReport({
        api: api,
        measurementGroup: TelemetryMeasurementGroups.driveWebFeaturePerformance,
        event: TelemetryDriveWebFeature.performance,
        values: {
            milliseconds: timeInMs,
            ...additionalValues,
        },
        dimensions: {
            experimentGroup: treatment,
            featureName,
        },
    });
};

const measureAndReport = (
    api: Api,
    feature: Features,
    group: ExperimentGroup,
    measureName: string,
    startMark: string,
    endMark: string,
    additionalValues?: PerformanceTelemetryAdditionalValues
) => {
    try {
        const measure = performance.measure(measureName, startMark, endMark);
        // it can be undefined on browsers below Safari below 14.1 and Firefox 103
        if (measure) {
            sendTelemetryFeaturePerformance(api, feature, measure.duration, group, additionalValues);
        }
    } catch (e) {
        sendErrorReport(
            new EnrichedError('Telemetry Performance Error', {
                extra: {
                    e,
                },
            })
        );
    }
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
    // Something somewhat unique, if we have collision it's not end of the world we drop the metric
    const distinguisher = `${performance.now()}-${randomHexString4()}`;
    const startMark = `start-${feature}-${distinguisher}`;
    const endMark = `end-${feature}-${distinguisher}`;
    const measureName = `measure-${feature}-${distinguisher}`;

    performance.mark(startMark);
    const result = applyTreatment ? treatmentFunction() : controlFunction();

    result
        .finally(() => {
            performance.mark(endMark);

            measureAndReport(
                api,
                feature,
                applyTreatment ? ExperimentGroup.treatment : ExperimentGroup.control,
                measureName,
                startMark,
                endMark
            );

            performance.clearMarks(endMark);
            performance.clearMeasures(measureName);
            performance.clearMarks(startMark);
        })
        .catch(noop);

    return result;
};

export const measureFeaturePerformance = (api: Api, feature: Features, experimentGroup = ExperimentGroup.control) => {
    const startMark = `start-${feature}-${randomHexString4()}`;
    const endMark = `end-${feature}-${randomHexString4()}`;
    const measureName = `measure-${feature}-${randomHexString4()}`;

    let started = false;
    let ended = false;

    const clear = () => {
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
        started = false;
        ended = false;
    };

    return {
        start: () => {
            if (!started) {
                started = true;
                performance.mark(startMark);
            }
        },
        end: (additionalValues?: PerformanceTelemetryAdditionalValues) => {
            if (!ended && started) {
                ended = true;
                performance.mark(endMark);
                measureAndReport(api, feature, experimentGroup, measureName, startMark, endMark, additionalValues);
                clear();
            }
        },
        clear,
    };
};

export const useMeasureFeaturePerformanceOnMount = (features: Features) => {
    const api = useApi();

    // It will be a new measure object each time the api changes or the features changes.
    // If it changes in between the previous measure has started and not ended yet the values will be cleared and ignored.
    const measure = useMemo(() => measureFeaturePerformance(api, features), [api, features]);

    useEffect(() => {
        measure.start();
        return () => {
            measure.clear();
        };
    }, [measure]);

    return measure.end;
};

const apiInstance = createApi({ config, sendLocaleHeaders: true });

export const countActionWithTelemetry = (action: Actions, count: number = 1): void => {
    const persistedSession = getLastActivePersistedUserSession();

    if (persistedSession?.UID) {
        // API calls will now be Authenticated with x-pm-uid header
        apiInstance.UID = persistedSession?.UID;
    }

    void sendTelemetryReport({
        api: apiInstance,
        measurementGroup: TelemetryMeasurementGroups.driveWebActions,
        event: TelemetryDriveWebFeature.actions,
        values: {
            count,
        },
        dimensions: {
            name: action,
        },
    });
};
