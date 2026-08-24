import type { FC } from 'react';
import { useSelector } from 'react-redux';

import type { FieldArrayRenderProps } from 'formik';
import { FieldArray, type FormikContextType } from 'formik';
import { c } from 'ttag';

import { IcPlus } from '@proton/icons/icons/IcPlus';

import { UpsellRef } from '../../../constants';
import type { IdentityFormSection } from '../../../hooks/identity/useIdentityForm';
import { usePortal } from '../../../hooks/usePortal';
import type { ExtraFieldErrors } from '../../../lib/validation/extra-field';
import { selectPassPlan } from '../../../store/selectors';
import type {
    DeobfuscatedItemExtraField,
    ExtraFieldType,
    IdentityFieldName,
    IdentityItemFormValues,
    Maybe,
} from '../../../types';
import { UserPassPlan } from '../../../types/api/plan';
import { autofocusInput } from '../../../utils/dom/input';
import { ExtraFieldComponent } from '../../Form/Field/ExtraFieldGroup/ExtraField';
import { createExtraField, getExtraFieldOptions } from '../../Form/Field/ExtraFieldGroup/ExtraField.utils';
import { Field } from '../../Form/Field/Field';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { TextField } from '../../Form/Field/TextField';
import { CollapsibleSection } from '../../Layout/Collapsible/CollapsibleSection';
import type { DropdownMenuOption } from '../../Layout/Dropdown/DropdownMenuBase';
import { DROPDOWN_SEPARATOR, DropdownMenuBase } from '../../Layout/Dropdown/DropdownMenuBase';
import { useUpselling } from '../../Upsell/UpsellingProvider';

type IdentityCollapsibleSectionProps = IdentityFormSection & {
    form: FormikContextType<IdentityItemFormValues>;
    onAddOptionalField: (fieldName: IdentityFieldName) => void;
};

export const IdentitySection: FC<IdentityCollapsibleSectionProps> = ({
    customFieldsKey,
    expanded,
    fields,
    form,
    name,
    optionalFields,
    onAddOptionalField,
}) => {
    const { ParentPortal: AddNewPortal, openPortal } = usePortal();
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const upsell = useUpselling();
    const canCreateField = Boolean(optionalFields || customFieldsKey);

    const getDropdownOptions = (helpers: FieldArrayRenderProps, focusIndex: number): DropdownMenuOption[] => {
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

        const newFieldOptions = (optionalFields ?? []).map<DropdownMenuOption>((field) => ({
            value: field.name,
            label: field.label,
            icon: 'card-identity',
            onClick: () => {
                onAddOptionalField(field.name);
                autofocusInput(field.name);
            },
        }));

        return [
            ...newFieldOptions,
            ...(newFieldOptions.length > 0 ? [DROPDOWN_SEPARATOR] : []),
            ...getExtraFieldOptions(createCustomField),
        ];
    };

    return (
        <CollapsibleSection label={name} expanded={expanded}>
            <FieldsetCluster>
                {fields.map((field) => (
                    <Field
                        key={field.name}
                        component={field.component ?? TextField}
                        hidden={field.hidden}
                        type="text"
                        {...field}
                    />
                ))}

                {customFieldsKey && (
                    <FieldArray
                        name={customFieldsKey}
                        render={(helpers) => {
                            const customFields = form.values[customFieldsKey];
                            return (
                                <>
                                    {customFields?.map(({ type }, index) => (
                                        <Field
                                            key={`${customFieldsKey}::${index}`}
                                            component={ExtraFieldComponent}
                                            type={type ?? 'text'}
                                            name={`${customFieldsKey}[${index}]`}
                                            onDelete={() => helpers.remove(index)}
                                            touched={Boolean(form.touched?.[customFieldsKey]?.[index])}
                                            error={form.errors?.[customFieldsKey]?.[index] as Maybe<ExtraFieldErrors>}
                                            hideIcon
                                        />
                                    ))}

                                    {openPortal(
                                        canCreateField && (
                                            <DropdownMenuBase
                                                className="mb-2"
                                                dropdownOptions={getDropdownOptions(helpers, customFields.length)}
                                            >
                                                <div className="flex items-center">
                                                    <IcPlus />
                                                    <div className="ml-2 text-semibold">{c('Action').t`Add more`}</div>
                                                </div>
                                            </DropdownMenuBase>
                                        )
                                    )}
                                </>
                            );
                        }}
                    />
                )}
            </FieldsetCluster>
            {AddNewPortal}
        </CollapsibleSection>
    );
};
