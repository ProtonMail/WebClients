import type { FC } from 'react';
import { useSelector } from 'react-redux';

import type { FieldArrayRenderProps } from 'formik';
import { FieldArray, type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Icon } from '@proton/components';
import { DeleteButton, ExtraFieldComponent } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField';
import {
    createExtraField,
    getExtraFieldOptions,
} from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField.utils';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { BaseTextField } from '@proton/pass/components/Form/Field/TextField';
import { CustomNewSection } from '@proton/pass/components/Item/Custom/Custom.sections.new';
import { CollapsibleSection } from '@proton/pass/components/Layout/Collapsible/CollapsibleSection';
import { DropdownMenuBase } from '@proton/pass/components/Layout/Dropdown/DropdownMenuBase';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import type { ExtraSectionsError } from '@proton/pass/lib/validation/custom-item';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { DeobfuscatedItemExtraField, ExtraFieldType, IdentityItemFormValues, Maybe } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { autofocusInput } from '@proton/pass/utils/dom/input';

type Props = { form: FormikContextType<IdentityItemFormValues> };

const getSectionFieldProps = (
    form: FormikContextType<IdentityItemFormValues>,
    sectionIndex: number,
    fieldIndex: number
) => {
    const touched = Boolean(form.touched.extraSections?.[sectionIndex]?.sectionFields?.[fieldIndex]);
    const sectionErrors = form.errors?.extraSections?.[sectionIndex] as Maybe<ExtraSectionsError>;
    const fieldErrors = sectionErrors?.sectionFields?.[fieldIndex];
    return { touched, error: fieldErrors };
};

export const IdentityCustomSections: FC<Props> = ({ form }) => {
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const upsell = useUpselling();

    const getDropdownOptions = (helpers: FieldArrayRenderProps, focusIndex: number) => {
        const createCustomField = (type: ExtraFieldType) => {
            if (isFreePlan) {
                return upsell({
                    type: 'pass-plus',
                    upsellRef: UpsellRef.IDENTITY_CUSTOM_FIELDS,
                });
            }

            helpers.push<DeobfuscatedItemExtraField>(createExtraField(type));
            autofocusInput(`${helpers.name}[${focusIndex}]`);
        };

        return getExtraFieldOptions(createCustomField);
    };

    return (
        <FieldArray
            name="extraSections"
            render={(extraSectionsHelpers) => (
                <>
                    {form.values.extraSections.map(({ sectionName, sectionFields }, sectionIndex) => {
                        const sectionKey = `extraSections[${sectionIndex}]`;
                        const sectionErrors = form.errors?.extraSections?.[sectionIndex] as Maybe<ExtraSectionsError>;

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

                    <CustomNewSection
                        upsellRef={UpsellRef.IDENTITY_CUSTOM_FIELDS}
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
