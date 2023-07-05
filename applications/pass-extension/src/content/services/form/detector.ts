import {
    DETECTED_FORM_TYPE_ATTR,
    type FNode,
    clearVisibilityCache,
    fieldOfInterestSelector,
    isFormOfInterest,
    isVisible,
    isVisibleField,
    rulesetMaker,
    setIgnoreType,
} from '@proton/pass/fathom';
import { FormField, FormType } from '@proton/pass/types';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { logger } from '@proton/pass/utils/logger';
import { withMaxExecutionTime } from '@proton/pass/utils/time';
import { wait } from '@proton/shared/lib/helpers/promise';

import { MAX_MAX_DETECTION_TIME, MIN_MAX_DETECTION_TIME } from '../../constants';
import type { DetectedField, DetectedForm } from '../../types';
import {
    fieldProcessable,
    fieldTrackable,
    formProcessed,
    selectAllForms,
    selectDanglingFields,
    setFieldProcessed,
    setFormProcessed,
} from '../../utils/nodes';

const ruleset = rulesetMaker();
const NOOP_EL = document.createElement('form');
const DETECTABLE_FORMS = Object.values(FormType).filter((type) => type !== FormType.NOOP);
const DETECTABLE_FIELDS = Object.values(FormField).filter((type) => type !== FormField.NOOP);
const LOGIN_DELTA_TOLERANCE = 0.15;

type BoundRuleset = ReturnType<typeof ruleset.against>;
type PredictionResult<T extends string> = { fnode: FNode; type: T };
type PredictionScoreResult<T extends string> = { type: T; score: number };
type PredictionBestSelector<T extends string> = (scores: PredictionScoreResult<T>[]) => PredictionScoreResult<T>;

/* We should run the detection when :
 * - a stale form is now considered of interest
 * - a tracked form has new visible input fields
 * - new dangling inputs can be clustered
 *
 * To keep track of these we leverage the `PROCESSED_INPUT_ATTR`
 * attribute which is added to processed fields. Run in async
 * `requestAnimationFrame` to avoid blocking the UI on costly
 * visibility checks
 *
 * When considering dangling fields, only look
 * for fields not in a processed form and that is actually visible
 * to avoid flagging input fields as processed and missing out
 * on detection */
const shouldRunDetection = (): Promise<boolean> =>
    new Promise(async (resolve) => {
        await wait(50);
        requestAnimationFrame(() => {
            const runForForms = selectAllForms().reduce<boolean>((runDetection, form) => {
                if (formProcessed(form)) {
                    const fields = Array.from(form.querySelectorAll<HTMLInputElement>(fieldOfInterestSelector));
                    const unprocessedFields = fields.some(fieldProcessable);

                    if (unprocessedFields) {
                        logger.info('[Detector::assess] new tracked form fields detected');
                        /* in case the form type should change due to field updates :
                         * remove the current cached detection result */
                        form.removeAttribute(DETECTED_FORM_TYPE_ATTR);
                    }
                    return runDetection || unprocessedFields;
                }

                if (isFormOfInterest(form)) {
                    logger.info('[Detector::assess] new form of interest');
                    return true;
                }

                return runDetection;
            }, false);

            if (runForForms) return resolve(true);

            const danglingFields = selectDanglingFields().filter(fieldTrackable);
            const runForFields = danglingFields.length > 0;
            if (runForFields) logger.debug('[Detector::assess] new unprocessed fields');

            return resolve(runForFields);
        });
    });

/* for a given detection type, returns the score for a given FNode */
const getScores = <T extends string>(fnode: FNode, types: T[]): PredictionScoreResult<T>[] =>
    types.map((type) => ({ type, score: fnode.scoreFor(type) }));

const getPredictionsFor = <T extends string>(
    boundRuleset: BoundRuleset,
    options: {
        type: 'form-el' | 'field';
        subTypes: T[];
        fallbackType: T;
        selectBest?: PredictionBestSelector<T>;
    }
): PredictionResult<T>[] => {
    const candidates: FNode[] = boundRuleset.get(options.type);

    /* first check if we have any pre-detected candidates which
     * will not be emitted on the base `options.type` as these will
     * have by-passed the classification pipeline */
    const preDetected = options.subTypes.flatMap((subType) => {
        const detected: FNode[] = boundRuleset.get(subType);
        return detected.map((fnode) => ({ fnode, type: subType }));
    });

    const predictions = candidates.map((fnode) => {
        const fieldTypes = options.subTypes.filter((subType) => fnode.hasType(subType));
        const scores = getScores(fnode, fieldTypes).sort(sortOn('score', 'DESC'));
        const best = options.selectBest?.(scores) ?? scores?.[0] ?? 0;
        return { fnode, type: best.score > 0.5 ? best.type : options.fallbackType };
    });

    return preDetected.concat(predictions);
};

/* cluster each predicted field by its parent predicted
 * form. If no such form exists, keep a reference to all
 * "dangling" fields in order to process them accordingly */
const groupFields = (
    formPredictions: PredictionResult<FormType>[],
    fieldPredictions: PredictionResult<FormField>[]
) => {
    const grouping = new WeakMap<HTMLElement, DetectedField[]>();

    fieldPredictions.forEach(({ fnode: fieldFNode, type: fieldType }) => {
        const field = fieldFNode.element as HTMLInputElement;
        const parent: HTMLElement =
            formPredictions.find(({ fnode: formFNode }) => {
                const form = formFNode.element;
                return form.contains(field);
            })?.fnode.element ?? NOOP_EL;

        const entry = grouping?.get(parent) ?? [];
        entry.push({ fieldType, field });

        return grouping.set(parent, entry);
    });

    return grouping;
};

/* Always prefer login - in case of misprediction it's less
 * deceptive to the user */
const selectBestForm = <T extends string>(scores: PredictionScoreResult<T>[]) => {
    const best = scores[0];
    const loginResult = scores.find(({ type }) => type === FormType.LOGIN);

    if (!loginResult) return best;

    const delta = Math.abs(loginResult.score - best.score);
    return loginResult.score > 0.5 && delta < LOGIN_DELTA_TOLERANCE ? loginResult : best;
};

/* Runs the fathom detection and returns a form handle for each detected form.. */
const createDetectionRunner =
    (ruleset: ReturnType<typeof rulesetMaker>, doc: Document) =>
    (options: { onBottleneck: (data: {}) => void }): DetectedForm[] => {
        const [formPredictions, fieldPredictions] = withMaxExecutionTime(
            (): [PredictionResult<FormType>[], PredictionResult<FormField>[]] => {
                const boundRuleset = ruleset.against(doc.body);
                return [
                    getPredictionsFor<FormType>(boundRuleset, {
                        type: 'form-el',
                        subTypes: DETECTABLE_FORMS,
                        fallbackType: FormType.NOOP,
                        selectBest: selectBestForm,
                    }),
                    getPredictionsFor(boundRuleset, {
                        type: 'field',
                        subTypes: DETECTABLE_FIELDS,
                        fallbackType: FormField.NOOP,
                    }),
                ];
            },
            {
                maxTime: MIN_MAX_DETECTION_TIME,
                onMaxTime: (ms) => {
                    const host = window.location.hostname;
                    logger.info(`[Detector::run] detector slow down detected on ${host} (took ${ms}ms)`);

                    if (ms >= MAX_MAX_DETECTION_TIME) {
                        options.onBottleneck({ ms, host });
                        throw new Error();
                    }
                },
            }
        )();

        const fieldMap = groupFields(formPredictions, fieldPredictions);

        const forms = formPredictions.map(({ fnode: formFNode, type: formType }) => ({
            form: formFNode.element as HTMLElement,
            formType,
            fields: fieldMap.get(formFNode.element) ?? [],
        }));

        /* Form / fields flagging :
         * each detected form should be flagged via the `data-protonpass-form` attribute so as to
         * avoid triggering unnecessary detections if nothing of interest has changed in the DOM.
         * · `formPredictions` will include only visible forms : flag them with prediction class
         * · all form fields which have been detected should be flagged as processed with the
         *   `data-protonpass-field` attr. The remaining fields without classification results
         *   should only be flagged as processed if they are visible or `[type="hidden"]`. This
         *   heuristic flagging allows detection triggers to monitor new fields correctly.
         * · query all unprocessed forms (including invisible ones) and flag them as `NOOP` */
        formPredictions.forEach(({ fnode: { element }, type }) => setFormProcessed(element, type));

        forms.forEach(({ fields }) =>
            fields.forEach(({ field, fieldType }) => {
                const hidden = field.type === 'hidden';
                const detected = fieldType !== FormField.NOOP;

                if (!detected && hidden) setIgnoreType(field);
                if (detected || hidden || (isVisibleField(field) && isVisible(field, { opacity: true }))) {
                    setFieldProcessed(field, fieldType);
                }
            })
        );

        /* only start tracking forms which have a positive detection result or
         * dangling forms which have at least one detected field */
        const formsToTrack = forms.filter(
            ({ formType, fields }) =>
                formType !== FormType.NOOP || fields.some(({ fieldType }) => fieldType !== FormField.NOOP)
        );

        clearVisibilityCache(); /* clear visibility cache on each detection run */
        return formsToTrack;
    };

export const createDetectorService = () => {
    return {
        shouldRunDetection,
        runDetection: createDetectionRunner(ruleset, document),
    };
};

export type DetectorService = ReturnType<typeof createDetectorService>;
