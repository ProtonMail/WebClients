import { type FC } from 'react';
import { useSelector } from 'react-redux';

import type { FieldArrayRenderProps } from 'formik';
import { FieldArray, type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import { ExtraFieldComponent } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField';
import { createExtraField } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { CollapsibleSection } from '@proton/pass/components/Layout/Collapsible/CollapsibleSection';
import { DropdownMenuBase } from '@proton/pass/components/Layout/Dropdown/DropdownMenuBase';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { UpsellRef } from '@proton/pass/constants';
import type { IdentityFormSection } from '@proton/pass/hooks/identity/useIdentityForm';
import { usePortal } from '@proton/pass/hooks/usePortal';
import type { ExtraFieldErrors } from '@proton/pass/lib/validation/extra-field';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type {
    ExtraFieldType,
    IdentityFieldName,
    IdentityItemFormValues,
    Maybe,
    UnsafeItemExtraField,
} from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { autofocusInput } from '@proton/pass/utils/dom/input';

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
    const spotlight = useSpotlight();
    const canCreateField = Boolean(optionalFields || customFieldsKey);

    const openUpsell = () => spotlight.setUpselling({ type: 'pass-plus', upsellRef: UpsellRef.IDENTITY_CUSTOM_FIELDS });

    const getDropdownOptions = (helpers: FieldArrayRenderProps, focusIndex: number) => {
        const createCustomField = (type: ExtraFieldType) => {
            if (isFreePlan) return openUpsell();

            helpers.push<UnsafeItemExtraField>(createExtraField(type));
            autofocusInput(`${helpers.name}[${focusIndex}]`);
        };

        const newFieldOptions = (optionalFields ?? []).map((field) => ({
            value: field.name,
            label: field.label,
            onClick: () => {
                onAddOptionalField(field.name);
                autofocusInput(field.name);
            },
        }));

        const customFieldOptions = customFieldsKey
            ? [
                  {
                      value: `${customFieldsKey}-text`,
                      label: c('Label').t`Custom text field`,
                      onClick: () => createCustomField('text'),
                  },
                  {
                      value: `${customFieldsKey}-hidden`,
                      label: c('Label').t`Custom hidden field`,
                      onClick: () => createCustomField('hidden'),
                  },
              ]
            : [];

        return [...newFieldOptions, ...customFieldOptions];
    };

    return (
        <CollapsibleSection label={name} expanded={expanded}>
            <FieldsetCluster>
                {fields.map((field) => (
                    <Field
                        key={field.name}
                        component={field.component ?? TextField}
                        mask={field.mask}
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
                                            showIcon={false}
                                        />
                                    ))}

                                    {openPortal(
                                        canCreateField && (
                                            <DropdownMenuBase
                                                className="mb-2"
                                                dropdownOptions={getDropdownOptions(helpers, customFields.length)}
                                            >
                                                <div className="flex items-center">
                                                    <Icon name="plus" />
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
