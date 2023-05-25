import { useState } from 'react';

import type { FormikErrors, FormikProps } from 'formik';
import { FieldArray } from 'formik';

import type { ExtraFieldType, ItemExtraField } from '@proton/pass/types';

import { Field } from '../Field';
import { FieldsetCluster } from '../Layout/FieldsetCluster';
import { AddExtraFieldDropdown } from './AddExtraFieldDropdown';
import { ExtraFieldComponent } from './ExtraField';

export type ExtraFieldGroupValues = { extraFields: ItemExtraField[] };
export type ExtraFieldGroupProps<V extends ExtraFieldGroupValues> = { form: FormikProps<V> };

const getNewField = <T extends ExtraFieldType>(type: T): ItemExtraField => {
    switch (type) {
        case 'text':
        case 'hidden':
            return { type, fieldName: '', data: { content: '' } };
        case 'totp':
            return { type, fieldName: '', data: { totpUri: '' } };
        default:
            throw new Error('Unsupported field type');
    }
};

export const ExtraFieldGroup = <T extends ExtraFieldGroupValues>({ form }: ExtraFieldGroupProps<T>) => {
    const [autofocusIndex, setAutofocusIndex] = useState<number>();

    return (
        <FieldArray
            name="extraFields"
            render={(helpers) => {
                const addCustomField = (type: ExtraFieldType) => {
                    helpers.push(getNewField(type));
                    setAutofocusIndex(form.values.extraFields.length);
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
                                        /* Formik TS type are wrong for FormikTouched */
                                        touched={(form.touched.extraFields as unknown as boolean[])?.[index]}
                                        error={form.errors.extraFields?.[index] as FormikErrors<ItemExtraField>}
                                        autoFocus={autofocusIndex === index} /* focus on add only */
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
