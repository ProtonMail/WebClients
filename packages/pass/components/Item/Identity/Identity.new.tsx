import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FieldArray, Form, type FormikErrors, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { ExtraFieldComponent } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { VaultPickerField } from '@proton/pass/components/Form/Field/VaultPickerField';
import { CollapsibleItem } from '@proton/pass/components/Layout/Collapsible/CollapsibleItem';
import { DropdownMenuBase } from '@proton/pass/components/Layout/Dropdown/DropdownMenuBase';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { getInitialState, useIdentityFormSections } from '@proton/pass/hooks/useIdentityFormSections';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { type IdentityItemFormValues, validateIdentityForm } from '@proton/pass/lib/validation/identity';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import type { UnsafeItemExtraField } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';

const FORM_ID = 'new-identity';
const EMPTY_CUSTOM_FIELD = { type: 'text', fieldName: '', data: { content: '' } };

export const IdentityNew: FC<ItemNewViewProps<'identity'>> = ({ shareId, onSubmit, onCancel }) => {
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { ParentPortal, openPortal } = usePortal();
    const { sections, actions } = useIdentityFormSections();

    const initialValues: IdentityItemFormValues = useMemo(() => getInitialState(shareId), []);

    const form = useFormik<IdentityItemFormValues>({
        initialValues,
        initialErrors: validateIdentityForm(initialValues),
        onSubmit: ({ shareId, name, note, ...identityValues }) => {
            const id = uniqueId();
            onSubmit({
                type: 'identity',
                optimisticId: id,
                shareId,
                createTime: getEpoch(),
                metadata: { name, note: obfuscate(note), itemUuid: id },
                content: identityValues,
                extraData: {},
                extraFields: [],
            });
        },
        validate: validateIdentityForm,
        validateOnBlur: true,
    });

    useItemDraft<IdentityItemFormValues>(form, { mode: 'new', type: 'identity' });

    return (
        <ItemCreatePanel
            discardable={!form.dirty}
            formId={FORM_ID}
            handleCancelClick={onCancel}
            type="identity"
            valid={form.isValid}
            actions={ParentPortal}
        >
            {({ didEnter }) => (
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <FieldsetCluster>
                            {vaultTotalCount > 1 &&
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

                        {sections.map(({ name, expanded, fields, addButton }, index) => (
                            <CollapsibleItem key={name} label={name} expanded={expanded}>
                                <FieldArray
                                    name={addButton?.customFieldName || ''}
                                    render={(helpers) => {
                                        const extraFieldName = addButton?.customFieldName;
                                        const extraFields = helpers.form.values[extraFieldName || ''];

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
                                                            key={index}
                                                            component={ExtraFieldComponent}
                                                            type="text"
                                                            name={`${extraFieldName}[${index}]`}
                                                            onDelete={() => helpers.remove(index)}
                                                            /* Formik TS type are wrong for FormikTouched */
                                                            touched={
                                                                (
                                                                    form.touched[
                                                                        extraFieldName!
                                                                    ] as unknown as boolean[]
                                                                )?.[index]
                                                            }
                                                            error={
                                                                form.errors[extraFieldName!]?.[
                                                                    index
                                                                ] as FormikErrors<UnsafeItemExtraField>
                                                            }
                                                            autoFocus
                                                        />
                                                    ))}
                                                </FieldsetCluster>
                                                {addButton && Boolean(addButton?.fields.length) && (
                                                    <DropdownMenuBase
                                                        className="mb-2"
                                                        dropdownOptions={addButton.fields.map(
                                                            ({ name: fieldName, placeholder }) => ({
                                                                value: fieldName,
                                                                label: placeholder,
                                                                onClick: () => {
                                                                    actions.updateSectionFields?.(index, fieldName);

                                                                    if (fieldName.includes('extra')) {
                                                                        helpers.push(EMPTY_CUSTOM_FIELD);
                                                                    }
                                                                },
                                                            })
                                                        )}
                                                    >
                                                        <div className="flex items-center">
                                                            <Icon name="plus" />
                                                            <div className="ml-2 text-semibold">{addButton.label}</div>
                                                        </div>
                                                    </DropdownMenuBase>
                                                )}
                                            </>
                                        );
                                    }}
                                />
                            </CollapsibleItem>
                        ))}
                        <hr />
                        <Button
                            className="rounded-full w-full"
                            style={{ backgroundColor: 'var(--interaction-weak)' }}
                            onClick={() => {}}
                            color="norm"
                            shape="ghost"
                        >
                            <div className="flex items-center justify-center">
                                <Icon name="plus" />
                                <div className="ml-2 text-semibold">{c('Label').t`Add section`}</div>
                            </div>
                        </Button>
                    </Form>
                </FormikProvider>
            )}
        </ItemCreatePanel>
    );
};
