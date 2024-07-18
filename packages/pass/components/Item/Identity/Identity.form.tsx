import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FieldArray, Form, type FormikContextType, type FormikErrors, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, useModalState } from '@proton/components/components';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { DeleteButton, ExtraFieldComponent } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { VaultPickerField } from '@proton/pass/components/Form/Field/VaultPickerField';
import { IdentityAddNewSection } from '@proton/pass/components/Item/Identity/Identity.modal';
import { EMPTY_CUSTOM_FIELD } from '@proton/pass/components/Item/Identity/Identity.new';
import { CollapsibleItem } from '@proton/pass/components/Layout/Collapsible/CollapsibleItem';
import { DropdownMenuBase } from '@proton/pass/components/Layout/Dropdown/DropdownMenuBase';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { useIdentityFormSections } from '@proton/pass/hooks/identity/useIdentityFormSections';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import type {
    IdentityItemFormValues,
    IdentityValues,
    UnsafeItemExtraField,
    UnsafeItemExtraSection,
} from '@proton/pass/types';

type IdentityFormType = {
    form: FormikContextType<IdentityItemFormValues>;
    onCancel: () => void;
    editing?: boolean;
    content?: IdentityValues;
};

export const IdentityForm: FC<IdentityFormType> = ({ content, form, editing = false, onCancel }) => {
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { sections, updateSectionFields } = useIdentityFormSections(content);
    const [showWarningMessage, setShowWarningMessage] = useModalState();
    const { ParentPortal, openPortal } = usePortal();
    const [ItemPanel, formId] = useMemo(
        () => (editing ? [ItemEditPanel, 'edit-identity'] : [ItemCreatePanel, 'new-identity']),
        [editing]
    );

    return (
        <ItemPanel
            discardable={!form.dirty}
            formId={formId}
            handleCancelClick={onCancel}
            type="identity"
            valid={form.isValid}
            actions={ParentPortal}
        >
            {({ didEnter }) => (
                <FormikProvider value={form}>
                    <Form id={formId}>
                        <FieldsetCluster>
                            {!editing &&
                                vaultTotalCount > 1 &&
                                openPortal(<Field component={VaultPickerField} name="shareId" dense />)}
                            <Field
                                lengthLimiters
                                name="name"
                                label={c('Label').t`Title`}
                                placeholder={c('Placeholder').t`Untitled`}
                                component={TitleField}
                                autoFocus={didEnter}
                                key={`identity-name-${didEnter}`}
                                maxLength={MAX_ITEM_NAME_LENGTH}
                            />
                        </FieldsetCluster>
                        {sections.map(({ name, expanded, fields, optionalFields }, index) => (
                            <CollapsibleItem key={name} label={name} expanded={expanded}>
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
                                                    {extraFields?.map((_: unknown, index: number) => (
                                                        <Field
                                                            key={`${extraFieldName}[${index}]`}
                                                            component={ExtraFieldComponent}
                                                            type="text"
                                                            name={`${extraFieldName}[${index}]`}
                                                            onDelete={() => helpers.remove(index)}
                                                            /* Formik TS type are wrong for FormikTouched */
                                                            touched={
                                                                (
                                                                    form.touched as unknown as Record<
                                                                        string,
                                                                        Record<number, boolean>
                                                                    >
                                                                )?.[extraFieldName]?.[index]
                                                            }
                                                            error={
                                                                (
                                                                    form.errors as unknown as Record<
                                                                        string,
                                                                        Record<
                                                                            number,
                                                                            FormikErrors<UnsafeItemExtraField>
                                                                        >
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
                                                            ({ name: fieldName, placeholder }) => ({
                                                                value: fieldName,
                                                                label: placeholder,
                                                                onClick: () => {
                                                                    if (fieldName.includes('extra')) {
                                                                        helpers.push(EMPTY_CUSTOM_FIELD);
                                                                    } else {
                                                                        updateSectionFields?.(index, fieldName);
                                                                    }
                                                                },
                                                            })
                                                        )}
                                                    >
                                                        <div className="flex items-center">
                                                            <Icon name="plus" />
                                                            <div className="ml-2 text-semibold">{c('Action')
                                                                .t`Add more`}</div>
                                                        </div>
                                                    </DropdownMenuBase>
                                                )}
                                            </>
                                        );
                                    }}
                                />
                            </CollapsibleItem>
                        ))}

                        <FieldArray
                            name="extraSections"
                            render={(extraSectionsHelpers) => {
                                return (
                                    <>
                                        {extraSectionsHelpers.form.values.extraSections.map(
                                            (
                                                { sectionName, sectionFields }: UnsafeItemExtraSection,
                                                sectionIndex: number
                                            ) => {
                                                const sectionKey = `extraSections[${sectionIndex}].sectionFields`;
                                                return (
                                                    <CollapsibleItem
                                                        key={sectionKey}
                                                        label={sectionName}
                                                        expanded
                                                        suffix={
                                                            <DeleteButton
                                                                size="small"
                                                                onDelete={() =>
                                                                    extraSectionsHelpers.remove(sectionIndex)
                                                                }
                                                            />
                                                        }
                                                    >
                                                        <FieldArray
                                                            name={sectionKey}
                                                            render={(helpers) => {
                                                                return (
                                                                    <>
                                                                        <FieldsetCluster>
                                                                            {sectionFields.map(
                                                                                (_: unknown, index: number) => (
                                                                                    <Field
                                                                                        key={`${sectionName}[${index}]`}
                                                                                        component={ExtraFieldComponent}
                                                                                        type="text"
                                                                                        name={`${sectionKey}[${index}]`}
                                                                                        onDelete={() => {
                                                                                            if (index === 0) {
                                                                                                setShowWarningMessage(
                                                                                                    true
                                                                                                );
                                                                                            } else {
                                                                                                helpers.remove(index);
                                                                                            }
                                                                                        }}
                                                                                        /* Formik TS type are wrong for FormikTouched */
                                                                                        touched={
                                                                                            (form.touched as any)
                                                                                                .extraSections?.[
                                                                                                sectionIndex
                                                                                            ]?.sectionFields?.[index]
                                                                                        }
                                                                                        error={
                                                                                            (form.errors as any)
                                                                                                .extraSections?.[
                                                                                                sectionIndex
                                                                                            ]?.sectionFields?.[index]
                                                                                        }
                                                                                        autoFocus
                                                                                    />
                                                                                )
                                                                            )}
                                                                        </FieldsetCluster>
                                                                        <Button
                                                                            className="mb-2 rounded-full"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    'var(--interaction-weak)',
                                                                            }}
                                                                            color="norm"
                                                                            shape="ghost"
                                                                            onClick={() =>
                                                                                helpers.push(EMPTY_CUSTOM_FIELD)
                                                                            }
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <Icon name="plus" />
                                                                                <div className="ml-2 text-semibold">{c(
                                                                                    'Action'
                                                                                ).t`Add custom field`}</div>
                                                                            </div>
                                                                        </Button>
                                                                    </>
                                                                );
                                                            }}
                                                        />
                                                        <ConfirmationModal
                                                            open={showWarningMessage.open}
                                                            onClose={showWarningMessage.onClose}
                                                            onSubmit={() => extraSectionsHelpers.remove(sectionIndex)}
                                                            submitText={c('Action').t`Delete section`}
                                                            title={c('Title').t`Remove section?`}
                                                            alertText={c('Warning')
                                                                .t`Removing the last field will remove the custom section.`}
                                                        />
                                                    </CollapsibleItem>
                                                );
                                            }
                                        )}
                                        <hr />
                                        <IdentityAddNewSection
                                            onAdd={(sectionName: string) => {
                                                extraSectionsHelpers.push({
                                                    sectionName,
                                                    sectionFields: [EMPTY_CUSTOM_FIELD],
                                                });
                                            }}
                                        />
                                    </>
                                );
                            }}
                        />
                    </Form>
                </FormikProvider>
            )}
        </ItemPanel>
    );
};
