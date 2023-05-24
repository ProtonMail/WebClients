import type { FormikErrors, FormikProps } from 'formik';
import { FieldArray } from 'formik';

import type { ExtraFieldType, ItemExtraField } from '@proton/pass/types';

import { Field } from '../Field';
import { FieldsetCluster } from '../Layout/FieldsetCluster';
import { AddExtraFieldDropdown } from './AddExtraFieldDropdown';
import { ExtraFieldComponent } from './ExtraField';

export type ExtraFieldGroupValues = { extraFields: ItemExtraField[] };
export type ExtraFieldGroupProps<V extends ExtraFieldGroupValues> = { form: FormikProps<V> };

export const ExtraFieldGroup = <T extends ExtraFieldGroupValues>({ form }: ExtraFieldGroupProps<T>) => {
    return (
        <FieldArray
            name="extraFields"
            render={(helpers) => {
                const addCustomField = (type: ExtraFieldType) => {
                    const newField: ItemExtraField = {
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
                                        error={form.errors.extraFields?.[index] as FormikErrors<ItemExtraField>}
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
