import type { FC } from 'react';

import { FieldArray, type FormikContextType, type FormikErrors } from 'formik';
import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import { ExtraFieldComponent } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField';
import { getNewField } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { CollapsibleSection } from '@proton/pass/components/Layout/Collapsible/CollapsibleSection';
import { DropdownMenuBase } from '@proton/pass/components/Layout/Dropdown/DropdownMenuBase';
import type { IdentityField, IdentityFieldSection } from '@proton/pass/hooks/identity/useIdentityFormSections';
import type { IdentityItemFormValues, UnsafeItemExtraField } from '@proton/pass/types';

type IdentityCollapsibleSectionProps = IdentityFieldSection & {
    form: FormikContextType<IdentityItemFormValues>;
    onAdd: (v: string) => void;
};

export const IdentityCollapsibleSection: FC<IdentityCollapsibleSectionProps> = ({
    name,
    expanded,
    optionalFields,
    fields,
    form,
    onAdd,
}) => (
    <CollapsibleSection label={name} expanded={expanded}>
        <FieldArray
            name={optionalFields?.extraFieldKey || name}
            render={(helpers) => {
                const extraFieldName = optionalFields?.extraFieldKey || name;
                const extraFields = helpers.form.values[extraFieldName];

                return (
                    <>
                        <FieldsetCluster>
                            {fields.map((item) => (
                                <Field
                                    key={item.name}
                                    component={item.component ?? TextField}
                                    mask={item.mask}
                                    type="text"
                                    {...item}
                                />
                            ))}
                            {extraFields?.map(({ type }: IdentityField, index: number) => (
                                <Field
                                    key={`${extraFieldName}[${index}]`}
                                    component={ExtraFieldComponent}
                                    type={type ?? 'text'}
                                    name={`${extraFieldName}[${index}]`}
                                    onDelete={() => helpers.remove(index)}
                                    /* Formik TS type are wrong for FormikTouched */
                                    touched={
                                        (form.touched as unknown as Record<string, Record<number, boolean>>)?.[
                                            extraFieldName
                                        ]?.[index]
                                    }
                                    error={
                                        (
                                            form.errors as unknown as Record<
                                                string,
                                                Record<number, FormikErrors<UnsafeItemExtraField>>
                                            >
                                        )?.[extraFieldName]?.[index]
                                    }
                                    autoFocus
                                />
                            ))}
                        </FieldsetCluster>
                        {optionalFields && Boolean(optionalFields?.fields.length) && (
                            <DropdownMenuBase
                                className="mb-2"
                                dropdownOptions={optionalFields.fields.map(
                                    ({ name: fieldName, placeholder, type }) => ({
                                        value: fieldName,
                                        label: placeholder,
                                        onClick: () => {
                                            if (fieldName.includes('extra')) {
                                                helpers.push(getNewField(type ?? 'text'));
                                            } else {
                                                onAdd(fieldName);
                                            }
                                        },
                                    })
                                )}
                            >
                                <div className="flex items-center">
                                    <Icon name="plus" />
                                    <div className="ml-2 text-semibold">{c('Action').t`Add more`}</div>
                                </div>
                            </DropdownMenuBase>
                        )}
                    </>
                );
            }}
        />
    </CollapsibleSection>
);
