import { type FC } from 'react';

import { FieldArray, Form, type FormikErrors, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, useModalState } from '@proton/components/components';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { DeleteButton, ExtraFieldComponent } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { CollapsibleItem } from '@proton/pass/components/Layout/Collapsible/CollapsibleItem';
import { DropdownMenuBase } from '@proton/pass/components/Layout/Dropdown/DropdownMenuBase';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { useIdentityFormSections } from '@proton/pass/hooks/identity/useIdentityFormSections';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { validateIdentityForm } from '@proton/pass/lib/validation/identity';
import type { IdentityItemFormValues, UnsafeItemExtraField } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

import { IdentityAddNewSection } from './Identity.modal';
import { EMPTY_CUSTOM_FIELD } from './Identity.new';

const FORM_ID = 'edit-identity';

export const IdentityEdit: FC<ItemEditViewProps<'identity'>> = ({ vault, revision, onSubmit, onCancel }) => {
    const { shareId } = vault;
    const { data: item, itemId, revision: lastRevision } = revision;
    const { metadata, content } = useDeobfuscatedItem(item);
    const { sections, updateSectionFields } = useIdentityFormSections(content);
    const [showWarningMessage, setShowWarningMessage] = useModalState();

    const form = useFormik<IdentityItemFormValues>({
        initialValues: { ...content, name: metadata.name, note: metadata.note, shareId },
        onSubmit: ({ shareId, name, note, ...content }) => {
            onSubmit({
                type: 'identity',
                shareId,
                metadata: { ...metadata, name, note: obfuscate(note) },
                content,
                extraFields: [],
                itemId,
                lastRevision,
            });
        },
        validate: validateIdentityForm,
        validateOnBlur: true,
    });

    useItemDraft<IdentityItemFormValues>(form, {
        mode: 'edit',
        itemId,
        revision: lastRevision,
        shareId: form.values.shareId,
    });

    return (
        <ItemCreatePanel
            discardable={!form.dirty}
            formId={FORM_ID}
            handleCancelClick={onCancel}
            type="identity"
            valid={form.isValid}
        >
            {({ didEnter }) => (
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <FieldsetCluster>
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
                                        {form.values.extraSections.map(
                                            ({ sectionName, sectionFields }, sectionIndex) => {
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
                                                                                            (
                                                                                                form.errors as unknown as IdentityItemFormValues
                                                                                            ).extraSections?.[
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
        </ItemCreatePanel>
    );
};
