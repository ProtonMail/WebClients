import { type FNode, editableFieldSelector, isFormOfInterest, rulesetMaker } from '@proton/pass/fathom';
import { FormField, FormType } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { logger } from '@proton/pass/utils/logger';

import { PROCESSED_ATTR } from '../../constants';
import type { CreateFormHandlesOptions } from '../../services/handles/form';
import type { DetectedField } from '../../types';
import { elementProcessable, elementProcessed, elementTrackable, setElementProcessed } from '../../utils/flags';

const ruleset = rulesetMaker();
const noopForm = document.createElement('form');
const DETECTABLE_FORMS = [FormType.LOGIN, FormType.REGISTER, FormType.RECOVERY, FormType.PASSWORD_CHANGE, FormType.MFA];

const formSelector = `form:not([role="search"]), [${PROCESSED_ATTR}]:not(input)`;
const danglingFieldSelector = `:not([${PROCESSED_ATTR}]):not([${PROCESSED_ATTR}] input)`;

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
    new Promise((resolve) => {
        requestAnimationFrame(() => {
            const forms = Array.from(document.querySelectorAll<HTMLElement>(formSelector));
            const fields = Array.from(document.querySelectorAll<HTMLInputElement>(editableFieldSelector));

            const runForForms = forms.reduce<boolean>((runDetection, form) => {
                if (elementProcessed(form)) {
                    const fields = Array.from(form.querySelectorAll<HTMLInputElement>(editableFieldSelector));
                    const unprocessedFields = fields.some(elementProcessable);

                    if (unprocessedFields) logger.debug('[Detector::assess] new untracked fields detected');
                    return runDetection || unprocessedFields;
                }

                if (isFormOfInterest(form)) {
                    logger.debug('[Detector::assess] new form of interest');
                    return true;
                }

                return runDetection;
            }, false);

            if (runForForms) return resolve(true);

            const danglingFields = fields.filter((el) => el.matches(danglingFieldSelector) && elementTrackable(el));
            const runForFields = danglingFields.length > 0;
            danglingFields.forEach(setElementProcessed);
            return resolve(runForFields);
        });
    });

/* for a given detection type, returns the score for a given FNode */
const getScores = <T extends string>(fnode: FNode, types: T[]): PredictionScoreResult<T>[] =>
    types.map((type) => ({ type, score: fnode.scoreFor(type) }));

const getPredictionsFor = <T extends string>(
    boundRuleset: BoundRuleset,
    types: T[],
    selectBest: PredictionBestSelector<T> = (scores) => scores[0]
): PredictionResult<T>[] => {
    const predictions: FNode[] = types.map((type) => boundRuleset.get(type));
    const candidates = Array.from(new Set(predictions.flat()));

    return candidates
        .map((fnode) => {
            const scores = getScores(fnode, types).sort(sortOn('score', 'DESC'));
            const best = selectBest(scores);

            if (best.score > 0.5) return { fnode, type: best.type };
        })
        .filter(truthy);
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
            })?.fnode.element ?? noopForm;

        const entry = grouping?.get(parent) ?? [];
        entry.push({ fieldType, field });

        return grouping.set(parent, entry);
    });

    return grouping;
};

/* Always prefer login - in case of misprediction it's less
 * deceptive to the user */
const selectBestForm = <T extends string>(scores: PredictionScoreResult<T>[]) => {
    const loginResult = scores.find(({ type }) => type === FormType.LOGIN)!;
    return loginResult.score > 0.5 ? loginResult : scores[0];
};

/* Runs the fathom detection and returns a form handle for each
 * detected form. FIXME: handle "dangling" fields. */
const createDetectionRunner =
    (ruleset: ReturnType<typeof rulesetMaker>, doc: Document) =>
    (): { forms: CreateFormHandlesOptions[]; fields: DetectedField[] } => {
        const boundRuleset = ruleset.against(doc.body);

        const formPredictions = getPredictionsFor(boundRuleset, DETECTABLE_FORMS, selectBestForm);
        const fieldPredictions = getPredictionsFor(boundRuleset, Object.values(FormField));
        const fieldMap = groupFields(formPredictions, fieldPredictions);

        return {
            forms: formPredictions.map(({ fnode: formFNode, type: formType }) => ({
                form: formFNode.element,
                formType,
                fields: fieldMap.get(formFNode.element) ?? [],
            })),
            fields: (fieldMap.get(noopForm) ?? []).filter(({ fieldType }) => fieldType === FormField.EMAIL),
        };
    };

export const createDetectorService = () => {
    return {
        shouldRunDetection,
        runDetection: createDetectionRunner(ruleset, document),
    };
};

export type DetectorService = ReturnType<typeof createDetectorService>;
