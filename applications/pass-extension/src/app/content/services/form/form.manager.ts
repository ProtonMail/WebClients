import { withContext } from 'proton-pass-extension/app/content/context/context';
import type {
    FrameMessageBroker,
    FrameMessageHandler,
} from 'proton-pass-extension/app/content/services/client/client.channel';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clearDetectionCache } from '@proton/pass/fathom';
import { FieldType, FormType } from '@proton/pass/fathom/labels';
import { logger } from '@proton/pass/utils/logger';
import throttle from '@proton/utils/throttle';

import type { FormHandle } from './form';
import { createFormHandles } from './form';

type FormManagerOptions = {
    channel: FrameMessageBroker;
    onDetection: (forms: FormHandle[]) => void;
};

export type FormManagerState = {
    /* form manager state flag */
    active: boolean;
    /** last detection run */
    detectionAt: number;
    /** number of detections executed */
    detectionCount: number;
    /* detection request */
    detectionRequest: number;
    /* tracked forms have been detected */
    trackedForms: Map<HTMLElement, FormHandle>;
};

export const createFormManager = ({ onDetection, channel }: FormManagerOptions) => {
    const state: FormManagerState = {
        active: true,
        detectionAt: 0,
        detectionCount: 0,
        detectionRequest: -1,
        trackedForms: new Map(),
    };

    const getTrackedForms = () => Array.from(state.trackedForms.values());
    const getTrackedFields = () => Array.from(getTrackedForms().flatMap((form) => form.getFields()));

    const getFormById = (formId: string) => getTrackedForms().find((form) => form.formId === formId);

    const detachTrackedForm = (formEl: HTMLElement) => {
        state.trackedForms.get(formEl)?.detach();
        state.trackedForms.delete(formEl);
    };

    const sync = withContext((_) => {
        state.trackedForms.forEach((form) => {
            form.getFields().forEach((field) => field.sync());
        });
    });

    /* Garbage collection is used to detach tracked forms if they have been
     * removed from the DOM - this may be the case in SPA apps. Once a form
     * is detected, it will be tracked until removed */
    const garbagecollect = (didDetach: boolean = false): boolean => {
        state.trackedForms.forEach((form) => {
            if (form.detached) {
                detachTrackedForm(form.element);
                didDetach = true;
            }
        });

        return didDetach;
    };

    /**
     * Asynchronously runs form detection with throttling to optimize performance.
     * Uses a combination of throttle, leading/trailing edge, and requestIdleCallback
     * mechanisms to prevent UI blocking and efficiently manage detection tasks.
     * - Recycles and/or creates form handles for each detected form and reconciliates accordingly.
     * - Performs autosave reconciliation on each detection run to capture any changes made to form data.
     * - Returns a boolean flag indicating whether the detection was executed successfully
     */
    const runDetection = throttle(
        withContext<(reason: string) => Promise<boolean>>(async (ctx, reason: string) => {
            const settings = ctx?.getSettings();
            const { Autofill, Autofill2FA, CreditCard } = ctx?.getFeatures() ?? {};
            const detectIdentity = Boolean(Autofill && settings?.autofill.identity);
            const excludedFieldTypes: FieldType[] = [];

            if (!detectIdentity) excludedFieldTypes.push(FieldType.IDENTITY);
            if (!Autofill2FA) excludedFieldTypes.push(FieldType.OTP);
            if (!CreditCard) excludedFieldTypes.push(FieldType.CREDIT_CARD);

            /* if there is an on-going detection, early return */
            if (state.detectionRequest !== -1) return false;
            const gcd = garbagecollect();

            if (await ctx?.service.detector.shouldPredict()) {
                state.detectionRequest = requestIdleCallback(() => {
                    if (state.active) {
                        logger.debug(`[FormTracker::Detector] Running detection for "${reason}"`);

                        try {
                            const forms = ctx?.service.detector.predictAll({ excludedFieldTypes });
                            forms?.forEach((options) => {
                                const formHandle = state.trackedForms.get(options.form) ?? createFormHandles(options);
                                state.trackedForms.set(options.form, formHandle);
                                formHandle.reconciliate(options.formType, options.fields);
                            });

                            onDetection(getTrackedForms());
                        } catch (err) {
                            logger.warn(`[FormTracker::Detector] ${err}`);
                        }
                    }

                    /* reset detection state when finished */
                    state.detectionRequest = -1;
                    state.detectionCount++;
                });

                return true;
            }

            if (gcd || state.detectionCount === 0) void ctx?.service.autosave.reconciliate();
            clearDetectionCache();

            return false;
        }),
        250,
        { leading: true, trailing: true }
    );

    const detect = async (options: { reason: string }) => {
        /* If `detect` calls are inundated due to concurrent DOM mutations or transition events,
         * this function cancels ongoing detection requests if they occur too closely together—
         * set heuristically to 150ms. This prevents triggering detectors on a transitioning page,
         * which may still have DOM nodes affecting final prediction results. This condition only
         * applies to subsequent detection runs, prioritizing the speed of the initial detection. */
        const now = Date.now();
        const cancel = !state.active || (state.detectionCount > 0 && now - state.detectionAt < 150);
        state.detectionAt = now;

        if (cancel) {
            cancelIdleCallback(state.detectionRequest);
            state.detectionRequest = -1;
        }

        if (!state.active) return;

        void runDetection(options.reason);
    };

    const onCheckForm: FrameMessageHandler<WorkerMessageType.AUTOFILL_CHECK_FORM> = (_, sendResponse) => {
        const trackedForms = getTrackedForms();
        const hasLoginForm = trackedForms?.some(({ formType }) => formType === FormType.LOGIN);
        sendResponse({ hasLoginForm });

        return true;
    };

    channel.register(WorkerMessageType.AUTOFILL_CHECK_FORM, onCheckForm);

    const destroy = () => {
        channel.unregister(WorkerMessageType.AUTOFILL_CHECK_FORM, onCheckForm);

        cancelIdleCallback(state.detectionRequest);
        runDetection.cancel();

        state.active = false;
        state.detectionRequest = -1;
        state.detectionCount = 0;

        state.trackedForms.forEach((form) => detachTrackedForm(form.element));
        state.trackedForms.clear();
    };

    return { getFormById, getTrackedFields, getTrackedForms, detect, sync, destroy };
};

export type FormManager = ReturnType<typeof createFormManager>;
