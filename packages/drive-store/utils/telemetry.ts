import { useEffect, useMemo } from 'react';

import { useApi } from '@proton/components';
import { CryptoProxy } from '@proton/crypto';
import createApi from '@proton/shared/lib/api/createApi';
import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry';
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { randomHexString4 } from '@proton/shared/lib/helpers/uid';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import config from '../config';
import { sendErrorReport } from './errorHandling';
import { EnrichedError } from './errorHandling/EnrichedError';
import { getLastActivePersistedUserSession } from './lastActivePersistedUserSession';

export enum ExperimentGroup {
    control = 'control',
    treatment = 'treatment',
}

export enum Features {
    mountToFirstItemRendered = 'mountToFirstItemRendered',
    globalBootstrapApp = 'globalBootstrapApp',
    globalBootstrapAppUrls = 'globalBootstrapAppUrls',
    globalBootstrapAppUserSettings = 'globalBootstrapAppUserSettings',
    globalBootstrapAppUserInit = 'globalBootstrapAppUserInit',
    globalBootstrapAppLoadUser = 'globalBootstrapAppLoadUser',
    globalBootstrapAppUnleash = 'globalBootstrapAppUnleash',
    globalBootstrapAppCrypto = 'globalBootstrapAppCrypto',
    globalBootstrapAppUserData = 'globalBootstrapAppUserData',
    globalBootstrapAppPostLoad = 'globalBootstrapAppPostLoad',
    globalBootstrapAppUserSettingsAddress = 'globalBootstrapAppUserSettingsAddress',
    globalBootstrapAppLoadSession = 'globalBootstrapAppLoadSession',
}

/**
 * At the present time, these metrics will only work when user is authenticated
 */
export enum Actions {
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
    SignUpFlowAndRedirectCompleted = 'signUpFlowAndRedirectCompleted',
    RedirectToCorrectContextShare = 'redirectToCorrectContextShare',
    RedirectToCorrectAcceptInvitation = 'RedirectToCorrectAcceptInvitation',
    AddToBookmarkTriggeredModal = 'addToBookmarkTriggeredModal',
    DismissDocsSuggestionsOnboardingModal = 'dismissDocsSuggestionsOnboardingModal',
    // onboarding actions
    OnboardingV2Shown = 'onboardingV2Shown',
    OnboardingV2InstallMacApp = 'onboardingV2InstallMacApp',
    OnboardingV2InstallWindowsApp = 'onboardingV2InstallWindowsApp',
    OnboardingV2InstallSkip = 'onboardingV2InstallSkip',
    OnboardingV2B2BInvite = 'onboardingV2B2BInvite',
    OnboardingV2B2BInviteSkip = 'onboardingV2B2BInviteSkip',
    OnboardingV2UploadFile = 'onboardingV2UploadFile',
    OnboardingV2UploadFolder = 'onboardingV2UploadFolder',
    OnboardingV2UploadSkip = 'onboardingV2UploadSkip',
    OnboardingAlbumShown = 'onboardingAlbumShown',
    OnboardingAlbumPrimaryAction = 'onboardingAlbumPrimaryAction',

    // images
    ConvertedHEIC = 'convertedHEIC',
    ExtractedFromRaw = 'extractedFromRaw',
}

type PerformanceTelemetryAdditionalValues = {
    quantity?: number;
};

const sendTelemetryFeaturePerformance = (
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
        delay: false,
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
        end: (additionalValues?: PerformanceTelemetryAdditionalValues, differentApi?: Api) => {
            if (!ended && started) {
                ended = true;
                performance.mark(endMark);
                measureAndReport(
                    differentApi || api,
                    feature,
                    experimentGroup,
                    measureName,
                    startMark,
                    endMark,
                    additionalValues
                );
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

export const countActionWithTelemetry = (action: Actions, count: number = 1) => {
    const persistedSession = getLastActivePersistedUserSession();

    if (persistedSession?.UID) {
        // API calls will now be Authenticated with x-pm-uid header
        apiInstance.UID = persistedSession?.UID;
    }

    return sendTelemetryReport({
        api: apiInstance,
        measurementGroup: TelemetryMeasurementGroups.driveWebActions,
        event: TelemetryDriveWebFeature.actions,
        values: {
            count,
        },
        dimensions: {
            name: action,
        },
        delay: false,
    });
};

const TEN_MINUTES = 10 * 60 * 1000;

export async function getTimeBasedHash(interval: number = TEN_MINUTES) {
    const timeBase = Math.floor(Date.now() / interval) * interval;

    const encoder = new TextEncoder();
    const data = encoder.encode(timeBase.toString());
    const hashBuffer = await CryptoProxy.computeHash({ algorithm: 'SHA256', data });
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

/**
 * Tracks user actions within a specified time window, typically used for flows involving redirections.
 *
 * This function is useful when you want to log an action only if the user starts at point A
 * and finishes at point B within a given time window. It's particularly helpful in scenarios
 * where there are redirections in the middle of a flow and passing query parameters through
 * all redirections is not feasible.
 *
 * @example
 * // Sign-Up Modal flow:
 * // 1. Sign-Up Modal appears (start A)
 * // 2. User signs up, pays, redirects
 * // 3. User goes back to shared-with-me page (end B)
 * // If this happens within the time window, the flow is logged as completed.
 *
 * @param {Actions} action - The action to be tracked.
 * @param {number} [duration=TEN_MINUTES] - The time window for tracking the action, default is 10 minutes.
 *
 * @returns {Object} An object with start and end methods to initiate and complete the tracking.
 */
export const traceTelemetry = (action: Actions, duration: number = TEN_MINUTES) => {
    return {
        start: async () => {
            localStorageWithExpiry.storeData(`telemetry-trace-${action}`, await getTimeBasedHash(duration), duration);
        },
        end: async () => {
            const data = localStorageWithExpiry.getData(`telemetry-trace-${action}`);
            if (data && data === (await getTimeBasedHash(duration))) {
                countActionWithTelemetry(action);
            }
            localStorageWithExpiry.deleteData(`telemetry-trace-${action}`);
        },
    };
};
