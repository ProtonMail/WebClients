import type { FC } from 'react';

import type { FieldArrayRenderProps } from 'formik';
import { FieldArray, type FormikContextType } from 'formik';
import { c } from 'ttag';

import { AddExtraFieldDropdown } from '@proton/pass/components/Form/Field/ExtraFieldGroup/AddExtraFieldDropdown';
import { DeleteButton, ExtraFieldComponent } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField';
import { createExtraField } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField.utils';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { BaseTextField } from '@proton/pass/components/Form/Field/TextField';
import { CollapsibleSection } from '@proton/pass/components/Layout/Collapsible/CollapsibleSection';
import { UpsellRef } from '@proton/pass/constants';
import type { ExtraSectionsError } from '@proton/pass/lib/validation/custom-item';
import type { CustomItemFormValues, DeobfuscatedItemExtraField, ExtraFieldType, Maybe } from '@proton/pass/types';
import { autofocusInput } from '@proton/pass/utils/dom/input';

import { CustomNewSection } from './Custom.sections.new';

type Props = { form: FormikContextType<CustomItemFormValues> };

const getSectionFieldProps = (
    form: FormikContextType<CustomItemFormValues>,
    sectionIndex: number,
    fieldIndex: number
) => {
    const touched = Boolean(form.touched.sections?.[sectionIndex]?.sectionFields?.[fieldIndex]);
    const sectionErrors = form.errors?.sections?.[sectionIndex] as Maybe<ExtraSectionsError>;
    const fieldErrors = sectionErrors?.sectionFields?.[fieldIndex];
    return { touched, error: fieldErrors };
};

export const CustomFormSections: FC<Props> = ({ form }) => {
    const createCustomField = (helpers: FieldArrayRenderProps, focusIndex: number) => {
        return (type: ExtraFieldType) => {
            helpers.push<DeobfuscatedItemExtraField>(createExtraField(type));
            autofocusInput(`${helpers.name}[${focusIndex}]`);
        };
    };

    return (
        <FieldArray
            name="sections"
            render={(extraSectionsHelpers) => (
                <>
                    {form.values.sections.map(({ sectionName, sectionFields }, sectionIndex) => {
                        const sectionKey = `sections[${sectionIndex}]`;
                        const sectionErrors = form.errors?.sections?.[sectionIndex] as Maybe<ExtraSectionsError>;

                        return (
                            <CollapsibleSection
                                key={sectionKey}
                                label={
                                    <Field
                                        name={`${sectionKey}.sectionName`}
                                        component={BaseTextField}
                                        onClick={(evt) => evt.stopPropagation()}
                                        placeholder={c('Action').t`Section name`}
                                        error={sectionErrors?.sectionName}
                                        dense
                                        inputClassName={
                                            sectionErrors?.sectionName ? 'placeholder-danger' : 'color-weak'
                                        }
                                    />
                                }
                                expanded
                                suffix={<DeleteButton onDelete={() => extraSectionsHelpers.remove(sectionIndex)} />}
                            >
                                <FieldArray
                                    name={`${sectionKey}.sectionFields`}
                                    render={(helpers) => (
                                        <>
                                            <FieldsetCluster>
                                                {sectionFields.map(({ type }, index) => (
                                                    <Field
                                                        {...getSectionFieldProps(form, sectionIndex, index)}
                                                        key={`${sectionName}::${index}`}
                                                        component={ExtraFieldComponent}
                                                        type={type}
                                                        name={`${sectionKey}.sectionFields[${index}]`}
                                                        onDelete={() => helpers.remove(index)}
                                                        hideIcon
                                                    />
                                                ))}
                                            </FieldsetCluster>

                                            <AddExtraFieldDropdown
                                                onAdd={createCustomField(helpers, sectionFields.length)}
                                            />
                                        </>
                                    )}
                                />
                            </CollapsibleSection>
                        );
                    })}

                    <CustomNewSection
                        upsellRef={UpsellRef.CUSTOM_ITEMS}
                        onAdd={(sectionName: string) =>
                            extraSectionsHelpers.push({
                                sectionName,
                                sectionFields: [],
                            })
                        }
                    />

                    <hr className="my-4" />
                </>
            )}
        />
    );
};
