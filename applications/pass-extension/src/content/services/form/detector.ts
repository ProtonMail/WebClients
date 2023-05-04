import { FNode, rulesetMaker, trainees, utils } from '@proton/pass/fathom';
import { isHTMLElement } from '@proton/pass/utils/dom';
import { invert } from '@proton/pass/utils/fp/predicates';

import { PROCESSED_INPUT_ATTR } from '../../constants';
import { createFormHandles } from '../../services/handles/form';
import { FieldsForForm, FormField, FormFieldTypeMap, FormFields, FormHandle, FormType } from '../../types';

const { matchClosestSiblingForms } = utils;

const { isVisible } = utils;

type BoundRuleset = ReturnType<typeof ruleset.against>;
type TypedFNode<T = HTMLElement> = FNode & { element: T };
type Predictor = <T extends HTMLElement = HTMLElement>(type: string) => TypedFNode<T>[];
type FieldForFormOptions = { form: TypedFNode<HTMLFormElement>; predictor: Predictor };

const ruleset = rulesetMaker();

const isFormChild = (forms: FormHandle[]) => (el: Node) =>
    isHTMLElement(el) && forms.some((form) => form.element === el || form.element.contains(el));

/* Run the detection only if the current's frame
 * document body is visible and we have new untracked
 * input elements in the DOM. An input is considered
 * "untracked" if it is not contained in a currently
 * tracked form & is not flagged by the {PROCESSED_INPUT_ATTR}
 * attribute */
const shouldRunDetection = (forms: FormHandle[]) => {
    if (!isVisible(document.body)) return false;

    const untracked = Array.from(
        document.querySelectorAll<HTMLInputElement>(`input:not([${PROCESSED_INPUT_ATTR}="1"])`)
    ).filter(isVisible);

    untracked.forEach((el) => el.setAttribute(PROCESSED_INPUT_ATTR, '1'));
    return untracked.filter(invert(isFormChild(forms))).length > 0;
};

const reconciliate = (forms: FormHandle[]) => {
    const runDetection = shouldRunDetection(forms);
    const removeForms = forms.filter((form) => form.shouldRemove());
    const updateForms = forms.filter((form) => !removeForms.includes(form) && form.shouldUpdate());

    return {
        runDetection,
        removeForms,
        updateForms,
    };
};

/* Returns the sorted fnode predictions
 * for a specific type. Descending prediction
 * score : highest first */
const getPredictionsFor =
    (boundRuleset: BoundRuleset) =>
    <T extends Element = Element>(type: string): TypedFNode<T>[] => {
        return (boundRuleset.get(type) as FNode[])
            .filter((fnode) => fnode.scoreFor(type) > 0.5)
            .sort((fnodeA, fnodeB) => {
                const aScore = fnodeA.scoreFor(type);
                const bScore = fnodeB.scoreFor(type);
                return bScore - aScore;
            });
    };

/* Gets the highest scoring predictions for a field
 * type and keeps the one that belong to the current
 * form. If the element is a button and is not contained
 * in the form, try to match closest sibling form for
 * "outside" fields inclusion */
const getFieldsByType =
    <T extends FormField>({ form, predictor }: FieldForFormOptions) =>
    (fieldType: T) => {
        return predictor<FormFieldTypeMap[T]>(fieldType)
            .filter(
                (fnode) =>
                    form.element.contains(fnode.element) ||
                    (fnode.element.tagName === 'BUTTON' && matchClosestSiblingForms([form])(fnode) !== undefined)
            )
            .map((fnode) => fnode.element);
    };

const getFieldsForForm =
    <T extends FormType>({ form, predictor }: FieldForFormOptions) =>
    (...fieldTypes: FieldsForForm<T>[]): FormFields<T> =>
        fieldTypes.reduce((fields, fieldType) => {
            return {
                ...fields,
                [fieldType]: getFieldsByType({ form, predictor })(fieldType),
            };
        }, {} as FormFields<T>);

/* Runs the fathom detection and returns
 * a form handle for each detected form */
const runDetection = (doc: Document): FormHandle[] => {
    const boundRuleset = ruleset.against(doc.body);
    const predictor = getPredictionsFor(boundRuleset);

    const loginForms = predictor<HTMLFormElement>(trainees.login.name).map((form) =>
        createFormHandles({
            form: form.element,
            formType: FormType.LOGIN,
            fields: getFieldsForForm<FormType.LOGIN>({ form, predictor })(
                FormField.USERNAME,
                FormField.PASSWORD,
                FormField.SUBMIT
            ),
        })
    );

    const registerForms = predictor<HTMLFormElement>(trainees.register.name).map((form) =>
        createFormHandles({
            form: form.element,
            formType: FormType.REGISTER,
            fields: getFieldsForForm<FormType.REGISTER>({ form, predictor })(
                FormField.USERNAME,
                FormField.PASSWORD,
                FormField.SUBMIT
            ),
        })
    );

    return [loginForms, registerForms].flat();
};

export const createDetectorService = () => ({ reconciliate, runDetection });
export type DetectorService = ReturnType<typeof createDetectorService>;
