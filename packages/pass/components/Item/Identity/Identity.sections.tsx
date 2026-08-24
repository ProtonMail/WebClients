import type { FC } from 'react';
import { useSelector } from 'react-redux';

import type { FieldArrayRenderProps } from 'formik';
import { FieldArray, type FormikContextType } from 'formik';
import { c } from 'ttag';

import { IcPlus } from '@proton/icons/icons/IcPlus';

import { UpsellRef } from '../../../constants';
import type { ExtraSectionsError } from '../../../lib/validation/custom-item';
import { selectPassPlan } from '../../../store/selectors';
import type { DeobfuscatedItemExtraField, ExtraFieldType, IdentityItemFormValues, Maybe } from '../../../types';
import { UserPassPlan } from '../../../types/api/plan';
import { autofocusInput } from '../../../utils/dom/input';
import { DeleteButton, ExtraFieldComponent } from '../../Form/Field/ExtraFieldGroup/ExtraField';
import { createExtraField, getExtraFieldOptions } from '../../Form/Field/ExtraFieldGroup/ExtraField.utils';
import { Field } from '../../Form/Field/Field';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { BaseTextField } from '../../Form/Field/TextField';
import { CollapsibleSection } from '../../Layout/Collapsible/CollapsibleSection';
import { DropdownMenuBase } from '../../Layout/Dropdown/DropdownMenuBase';
import { useUpselling } from '../../Upsell/UpsellingProvider';
import { CustomNewSection } from '../Custom/Custom.sections.new';

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
                                                    <IcPlus />
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
