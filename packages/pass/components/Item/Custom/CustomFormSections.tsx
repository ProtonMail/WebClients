import type { FC } from 'react';

import type { FieldArrayRenderProps } from 'formik';
import { FieldArray, type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Icon } from '@proton/components';
import { DeleteButton, ExtraFieldComponent } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField';
import { createExtraField } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { IdentityAddNewSection } from '@proton/pass/components/Item/Identity/Identity.modal';
import { CollapsibleSection } from '@proton/pass/components/Layout/Collapsible/CollapsibleSection';
import { DropdownMenuBase } from '@proton/pass/components/Layout/Dropdown/DropdownMenuBase';
import type { ExtraSectionsError } from '@proton/pass/lib/validation/identity';
import type { CustomItemFormValues, DeobfuscatedItemExtraField, ExtraFieldType, Maybe } from '@proton/pass/types';
import { autofocusInput } from '@proton/pass/utils/dom/input';

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
    const getDropdownOptions = (helpers: FieldArrayRenderProps, focusIndex: number) => {
        const createCustomField = (type: ExtraFieldType) => {
            helpers.push<DeobfuscatedItemExtraField>(createExtraField(type));
            autofocusInput(`${helpers.name}[${focusIndex}]`);
        };

        return [
            { value: 'text', label: c('Label').t`Custom text field`, onClick: () => createCustomField('text') },
            { value: 'hidden', label: c('Label').t`Custom hidden field`, onClick: () => createCustomField('hidden') },
        ];
    };

    return (
        <FieldArray
            name="sections"
            render={(extraSectionsHelpers) => (
                <>
                    {form.values.sections.map(({ sectionName, sectionFields }, sectionIndex) => {
                        const sectionKey = `sections[${sectionIndex}].sectionFields`;
                        return (
                            <CollapsibleSection
                                key={sectionKey}
                                label={sectionName}
                                expanded
                                suffix={
                                    <DeleteButton
                                        size="small"
                                        onDelete={() => extraSectionsHelpers.remove(sectionIndex)}
                                    />
                                }
                            >
                                <FieldArray
                                    name={sectionKey}
                                    render={(helpers) => (
                                        <>
                                            <FieldsetCluster>
                                                {sectionFields.map(({ type }, index) => (
                                                    <Field
                                                        {...getSectionFieldProps(form, sectionIndex, index)}
                                                        key={`${sectionName}::${index}`}
                                                        component={ExtraFieldComponent}
                                                        type={type}
                                                        name={`${sectionKey}[${index}]`}
                                                        onDelete={() => helpers.remove(index)}
                                                        showIcon={false}
                                                    />
                                                ))}
                                            </FieldsetCluster>
                                            <DropdownMenuBase
                                                className="mb-2"
                                                dropdownOptions={getDropdownOptions(helpers, sectionFields.length)}
                                            >
                                                <div className="flex items-center">
                                                    <Icon name="plus" />
                                                    <div className="ml-2 text-semibold">{c('Action').t`Add more`}</div>
                                                </div>
                                            </DropdownMenuBase>
                                        </>
                                    )}
                                />
                            </CollapsibleSection>
                        );
                    })}

                    <hr className="my-4" />

                    <IdentityAddNewSection
                        onAdd={(sectionName: string) =>
                            extraSectionsHelpers.push({
                                sectionName,
                                sectionFields: [],
                            })
                        }
                    />
                </>
            )}
        />
    );
};
