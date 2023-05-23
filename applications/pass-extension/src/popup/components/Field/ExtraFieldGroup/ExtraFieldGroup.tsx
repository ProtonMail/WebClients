import type { FormikErrors, FormikProps } from 'formik';
import { FieldArray } from 'formik';

import type { ExtraFieldType } from '@proton/pass/types';

import { Field } from '../Field';
import { FieldsetCluster } from '../Layout/FieldsetCluster';
import { AddExtraFieldDropdown } from './AddExtraFieldDropdown';
import { ExtraFieldComponent } from './ExtraField';

/* here we flatten the ItemExtraField type for
 * simplicity when using it with form fields */
export type ExtraFieldFormValue = { fieldName: string; type: ExtraFieldType; value: string };
export type ExtraFieldGroupValues = { extraFields: ExtraFieldFormValue[] };
export type ExtraFieldGroupProps<V extends ExtraFieldGroupValues> = { form: FormikProps<V> };

export const ExtraFieldGroup = <T extends ExtraFieldGroupValues>({ form }: ExtraFieldGroupProps<T>) => {
    return (
        <FieldArray
            name="extraFields"
            render={(helpers) => {
                const addCustomField = (type: ExtraFieldType) => {
                    const newField: ExtraFieldFormValue = {
                        type,
                        fieldName: '',
                        value: '',
                    };

                    return helpers.push(newField);
                };

                return (
                    <>
                        {Boolean(form.values.extraFields.length) && (
                            <FieldsetCluster>
                                {form.values.extraFields.map(({ type }, index) => (
                                    <Field
                                        key={index}
                                        component={ExtraFieldComponent}
                                        onDelete={() => helpers.remove(index)}
                                        name={`extraFields[${index}]`}
                                        type={type}
                                        error={form.errors.extraFields?.[index] as FormikErrors<ExtraFieldFormValue>}
                                    />
                                ))}
                            </FieldsetCluster>
                        )}

                        <AddExtraFieldDropdown onAdd={addCustomField} />
                    </>
                );
            }}
        />
    );
};
