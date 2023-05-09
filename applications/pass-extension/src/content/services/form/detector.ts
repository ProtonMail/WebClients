import { type FNode, rulesetMaker, utils } from '@proton/pass/fathom';
import { isHTMLElement } from '@proton/pass/utils/dom';
import { invert, truthy } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';

import { PROCESSED_INPUT_ATTR } from '../../constants';
import { createFormHandles } from '../../services/handles/form';
import type { FormFields, FormHandle } from '../../types';
import { FormField, FormType } from '../../types';

const { matchClosestSiblingForms } = utils;

const { isVisible } = utils;

const ruleset = rulesetMaker();

type BoundRuleset = ReturnType<typeof ruleset.against>;
type PredictionResult<T extends string> = { fnode: FNode; type: T };
type PredictionScoreResult<T extends string> = { type: T; score: number };
type PredictionBestSelector<T extends string> = (scores: PredictionScoreResult<T>[]) => PredictionScoreResult<T>;

const isFormChild = (forms: FormHandle[]) => (el: Node) =>
    isHTMLElement(el) && forms.some((form) => form.element === el || form.element.contains(el));

/* Run the detection only if the current's frame document body
 * is visible and we have new untracked input elements in the
 * DOM. An input is considered "untracked" if it is not contained
 * in a tracked form & is not flagged by the {PROCESSED_INPUT_ATTR}
 * attribute */
const shouldRunDetection = (forms: FormHandle[]) => {
    if (!isVisible(document.body)) return false;

    const untrackedSelector = `input:not([${PROCESSED_INPUT_ATTR}="1"])`;
    const untracked = Array.from(document.querySelectorAll<HTMLInputElement>(untrackedSelector)).filter(isVisible);
    untracked.forEach((el) => el.setAttribute(PROCESSED_INPUT_ATTR, '1'));

    return untracked.filter(invert(isFormChild(forms))).length > 0;
};

const assess = (forms: FormHandle[]) => {
    const runDetection = shouldRunDetection(forms);
    const removeForms = forms.filter((form) => form.shouldRemove());
    const updateForms = forms.filter((form) => !removeForms.includes(form) && form.shouldUpdate());

    return {
        runDetection,
        removeForms,
        updateForms,
    };
};

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
    const grouping = new WeakMap<HTMLElement, FormFields>();

    fieldPredictions.forEach(({ fnode: fieldFNode, type }) => {
        const field = fieldFNode.element;

        const parent: HTMLElement =
            formPredictions.find(({ fnode: formFNode }) => {
                const form = formFNode.element;
                return form.contains(field) || matchClosestSiblingForms([formFNode])(fieldFNode) !== undefined;
            })?.fnode.element ?? document.body;

        const entry = grouping?.get(parent) ?? {};
        entry[type] = (entry[type] ?? []).concat(field) as HTMLElement[];

        return grouping.set(parent, entry);
    });

    return grouping;
};

/* In the case of a tie between a login & a register form
 * always prefer the login form. FIXME: when integrating the
 * new detectors, this should be irrelevant */
const selectBestForm = <T extends string>(scores: PredictionScoreResult<T>[]) => {
    const loginResult = scores.find(({ type }) => type === FormType.LOGIN)!;
    const registerResult = scores.find(({ type }) => type === FormType.REGISTER)!;
    const delta = registerResult.score - loginResult.score;

    return loginResult.score > 0.5 && delta > 0 && delta <= 0.1 ? loginResult : scores[0];
};

/* Runs the fathom detection and returns a form handle for each
 * detected form. FIXME: handle "dangling" fields. */
const createDetectionRunner = (ruleset: ReturnType<typeof rulesetMaker>, doc: Document) => (): FormHandle[] => {
    const boundRuleset = ruleset.against(doc.body);
    const formPredictions = getPredictionsFor(boundRuleset, Object.values(FormType), selectBestForm);
    const fieldPredictions = getPredictionsFor(boundRuleset, Object.values(FormField));
    const fieldMap = groupFields(formPredictions, fieldPredictions);

    const detected = formPredictions.map(({ fnode: formFNode, type: formType }) => {
        const form = formFNode.element;
        return createFormHandles({ form, formType, fields: fieldMap.get(form) ?? {} });
    });

    return detected;
};

export const createDetectorService = () => {
    return { assess, runDetection: createDetectionRunner(ruleset, document) };
};
export type DetectorService = ReturnType<typeof createDetectorService>;
