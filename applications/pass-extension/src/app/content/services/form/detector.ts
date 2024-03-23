import { MAX_MAX_DETECTION_TIME, MIN_MAX_DETECTION_TIME } from 'proton-pass-extension/app/content/constants.static';
import type { DetectedField, DetectedForm } from 'proton-pass-extension/app/content/types';

import type { FieldType } from '@proton/pass/fathom';
import {
    FormType,
    clearDetectionCache,
    fieldTypes,
    formTypes,
    prepass,
    rulesetMaker,
    shouldRunClassifier,
} from '@proton/pass/fathom';
import type { Fnode } from '@proton/pass/fathom/fathom';
import { logger } from '@proton/pass/utils/logger';
import { withMaxExecutionTime } from '@proton/pass/utils/time/performance';
import { wait } from '@proton/shared/lib/helpers/promise';

const ruleset = rulesetMaker();
const NOOP_EL = document.createElement('form');

type BoundRuleset = ReturnType<typeof ruleset.against>;
type PredictionResult<T extends string> = { fnode: Fnode; type: T; score: number };
type PredictionBestSelector<T extends string> = (a: PredictionResult<T>, b: PredictionResult<T>) => PredictionResult<T>;

/* We should run the detection when :
 * - a stale form is now considered of interest
 * - a tracked form has new visible input fields
 * - new dangling inputs can be clustered
 *
 * To keep track of these we leverage the `PROCESSED_INPUT_ATTR`
 * attribute which is added to processed fields. Run in async
 * `requestIdleCallback` to avoid blocking the UI on costly
 * visibility checks
 *
 * When considering dangling fields, only look
 * for fields not in a processed form and that is actually visible
 * to avoid flagging input fields as processed and missing out
 * on detection */
const shouldRunDetection = (): Promise<boolean> =>
    new Promise(async (resolve) => {
        await wait(50);
        requestIdleCallback(() => {
            prepass();
            resolve(shouldRunClassifier());
        });
    });

const getPredictionsFor = <T extends string>(
    boundRuleset: BoundRuleset,
    options: {
        type: 'form' | 'field';
        subTypes: T[];
        selectBest: PredictionBestSelector<T>;
    }
): PredictionResult<T>[] => {
    /* The following `get` call is necessary to trigger the
     * `allThrough` effect which will flag the nodes */
    boundRuleset.get(options.type);

    const predictions = options.subTypes.reduce<Map<Fnode, PredictionResult<T>>>((results, subType) => {
        const fnodes: Fnode[] = boundRuleset.get(subType);
        fnodes.forEach((fnode) => {
            const score = fnode.hasType('cache') ? 1 : fnode.scoreFor(subType);
            const candidate = { type: subType, fnode, score };
            const bestSoFar = results.get(fnode);

            if (!bestSoFar) results.set(fnode, candidate);
            else results.set(fnode, options.selectBest(candidate, bestSoFar));
        });

        return results;
    }, new Map());

    return Array.from(predictions.values());
};

/* cluster each predicted field by its parent predicted
 * form. If no such form exists, keep a reference to all
 * "dangling" fields in order to process them accordingly */
const groupFields = (
    formPredictions: PredictionResult<FormType>[],
    fieldPredictions: PredictionResult<FieldType>[]
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

const selectBest = <T extends string>(a: PredictionResult<T>, b: PredictionResult<T>): PredictionResult<T> =>
    a.score > b.score ? a : b;

/* if we have a tie with a login form : always prefer the login type
 * as it is less deceptive for the user. FIXME: on tie between login &
 * register, we should query the autofillable candidates and adapt the
 * form-type accordingly */
const selectBestForm = (a: PredictionResult<FormType>, b: PredictionResult<FormType>): PredictionResult<FormType> => {
    if (a.type !== FormType.LOGIN && b.type !== FormType.LOGIN) return selectBest(a, b);
    return a.type === FormType.LOGIN ? a : b;
};

/* Runs the fathom detection and returns a form handle for each detected form.. */
const createDetectionRunner =
    (ruleset: ReturnType<typeof rulesetMaker>, doc: Document) =>
    (options: { onBottleneck: (data: {}) => void }): DetectedForm[] => {
        const [formPredictions, fieldPredictions] = withMaxExecutionTime(
            (): [PredictionResult<FormType>[], PredictionResult<FieldType>[]] => {
                const boundRuleset = ruleset.against(doc.body);
                return [
                    getPredictionsFor<FormType>(boundRuleset, {
                        type: 'form',
                        subTypes: formTypes,
                        selectBest: selectBestForm,
                    }),
                    getPredictionsFor(boundRuleset, {
                        type: 'field',
                        subTypes: fieldTypes,
                        selectBest,
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

        /* only start tracking forms which have a positive detection result or
         * dangling forms which have at least one detected field */
        const formsToTrack = forms.filter(({ formType, fields }) => formType !== FormType.NOOP || fields.length > 0);

        clearDetectionCache(); /* clear visibility cache on each detection run */

        return formsToTrack;
    };

export const createDetectorService = () => {
    return {
        shouldRunDetection,
        runDetection: createDetectionRunner(ruleset, document),
    };
};

export type DetectorService = ReturnType<typeof createDetectorService>;
