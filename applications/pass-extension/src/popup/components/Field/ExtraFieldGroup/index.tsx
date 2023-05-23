import type { FormikProps } from 'formik';
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
                const addCustomField = (type: ExtraFieldType) =>
                    helpers.push({
                        type,
                        fieldName: '',
                        content: {
                            content: '',
                        },
                    });

                return (
                    <>
                        {Boolean(form.values.extraFields.length) && (
                            <FieldsetCluster>
                                {form.values.extraFields.map(({ type }, index) => (
                                    <Field
                                        component={ExtraFieldComponent}
                                        key={index}
                                        onDelete={() => helpers.remove(index)}
                                        name={`extraFields[${index}]`}
                                        type={type}
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
