import { FNode, rulesetMaker, trainees, utils } from '@proton/pass/fathom';

import { createFormHandles } from '../handles/form';
import { FieldsForForm, FormField, FormFieldTypeMap, FormFields, FormHandles, FormType } from '../types';

const { matchClosestSiblingForms } = utils;

type BoundRuleset = ReturnType<typeof ruleset.against>;
type TypedFNode<T = HTMLElement> = FNode & { element: T };
type Predictor = <T extends HTMLElement = HTMLElement>(type: string) => TypedFNode<T>[];
type FieldForFormOptions = { form: TypedFNode<HTMLFormElement>; predictor: Predictor };

const ruleset = rulesetMaker();

/**
 * Returns the sorted fnode predictions
 * for a specific type. Descending prediction
 * score : highest first.
 */
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

/**
 * Gets the highest scoring predictions for a field
 * type and keeps the one that belong to the current
 * form. If the element is a button and is not contained
 * in the form, try to match closest sibling form for
 * "outside" fields inclusion
 */
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

/**
 * Runs the fathom detection and returns
 * a form handle for each detected form
 */
export const runDetection = (doc: Document): FormHandles[] => {
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
