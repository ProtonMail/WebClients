import { useSelector } from 'react-redux';

import type { FormikErrors, FormikProps } from 'formik';
import { FieldArray } from 'formik';

import { createExtraField } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField.utils';
import { selectExtraFieldLimits } from '@proton/pass/store/selectors';
import type { DeobfuscatedItemExtraField, ExtraFieldGroupValues, ExtraFieldType } from '@proton/pass/types';
import { autofocusInput } from '@proton/pass/utils/dom/input';

import { Field } from '../Field';
import { FieldsetCluster } from '../Layout/FieldsetCluster';
import { AddExtraFieldDropdown, type CustomButtonProps } from './AddExtraFieldDropdown';
import { ExtraFieldComponent } from './ExtraField';

export type ExtraFieldGroupProps<V extends ExtraFieldGroupValues> = {
    form: FormikProps<V>;
    hideIcon?: boolean;
    customButton?: CustomButtonProps;
};

export const ExtraFieldGroup = <T extends ExtraFieldGroupValues>({
    form,
    hideIcon = false,
    customButton,
}: ExtraFieldGroupProps<T>) => {
    const { needsUpgrade } = useSelector(selectExtraFieldLimits);

    return (
        <FieldArray
            name="extraFields"
            render={(helpers) => {
                const addCustomField = (type: ExtraFieldType) => {
                    helpers.push(createExtraField(type));
                    autofocusInput(`extraFields[${form.values.extraFields.length}]`);
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
                                        hideIcon={hideIcon}
                                        /* Formik TS type are wrong for FormikTouched */
                                        touched={(form.touched.extraFields as unknown as boolean[])?.[index]}
                                        error={
                                            form.errors.extraFields?.[index] as FormikErrors<DeobfuscatedItemExtraField>
                                        }
                                    />
                                ))}
                            </FieldsetCluster>
                        )}

                        {!needsUpgrade && <AddExtraFieldDropdown onAdd={addCustomField} {...customButton} />}
                    </>
                );
            }}
        />
    );
};
