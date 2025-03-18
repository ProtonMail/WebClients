import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Option } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { FileAttachmentsField } from '@proton/pass/components/FileAttachments/FileAttachmentsField';
import { ExtraFieldGroup } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { SelectField } from '@proton/pass/components/Form/Field/SelectField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { VaultPickerField } from '@proton/pass/components/Form/Field/VaultPickerField';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '@proton/pass/constants';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { validateCustomItemForm } from '@proton/pass/lib/validation/custom-item';
import { selectVaultLimits } from '@proton/pass/store/selectors/limits';
import { selectPassPlan } from '@proton/pass/store/selectors/user';
import type { DeobfuscatedItemExtraField } from '@proton/pass/types';
import { type CustomItemFormValues } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import clsx from '@proton/utils/clsx';

import { CustomFormSections } from './CustomFormSections';
import { type Template, groupedTemplates } from './templates';

const templateToFormFields = (template: Template): DeobfuscatedItemExtraField[] =>
    template.fields.map(
        (f) =>
            ({
                fieldName: f.label,
                type: f.type,
                data: f.type === 'timestamp' ? { timestamp: '' } : { content: '' },
            }) as DeobfuscatedItemExtraField
    ); // TODO(@djankovic): FIXME

const extraTypeFieldValues = (type?: 'wifi' | 'sshKey' | 'custom') => {
    switch (type) {
        case 'wifi':
            return {
                ssid: '',
                password: '',
                security: 0,
            };
        case 'sshKey':
            return {
                publicKey: '',
                privateKey: '',
            };
        default:
            return {};
    }
};

const FORM_ID = 'new-custom';

const StartFromScratch: FC<{ onClick: () => void }> = ({ onClick }) => (
    <Button pill color="norm" onClick={onClick} className="ui-violet">
        <Icon name="pencil" className="mr-2" />
        <span>{c('Action').t`Start from scratch`}</span>
    </Button>
);

export const ExtraTypeFields: FC<{ type: 'sshKey' | 'wifi' | 'custom' }> = ({ type }) => {
    switch (type) {
        case 'sshKey':
            return (
                <FieldsetCluster>
                    <Field
                        label={c('Label').t`Public key`}
                        name="publicKey"
                        placeholder={c('Placeholder').t`Add hidden text`}
                        component={TextField}
                        hidden
                    />
                    <Field
                        label={c('Label').t`Private key`}
                        name="privateKey"
                        placeholder={c('Placeholder').t`Add hidden text`}
                        component={TextField}
                        hidden
                    />
                </FieldsetCluster>
            );
        case 'wifi':
            return (
                <FieldsetCluster>
                    <Field
                        label={c('Label').t`Name (SSID)`}
                        name="ssid"
                        placeholder={c('Placeholder').t`Add text`}
                        component={TextField}
                    />
                    <Field
                        label={c('Label').t`Password`}
                        name="password"
                        placeholder={c('Placeholder').t`Add hidden text`}
                        component={TextField}
                        hidden
                    />
                    <Field
                        label={c('Label').t`Security`}
                        name="security"
                        placeholder={c('Placeholder').t`Select option`}
                        component={SelectField}
                    >
                        <Option value={0} title="WPA">
                            Unspecified
                        </Option>
                        <Option value={1} title="WPA">
                            WPA
                        </Option>
                        <Option value={2} title="WPA2">
                            WPA2
                        </Option>
                        <Option value={3} title="WPA3">
                            WPA3
                        </Option>
                        <Option value={4} title="WEP">
                            WEP
                        </Option>
                    </Field>
                </FieldsetCluster>
            );
    }
};

export const CustomNew: FC<ItemNewViewProps<'custom'>> = ({ shareId, onSubmit, onCancel }) => {
    const { ParentPortal, openPortal } = usePortal();
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const [showForm, setShowForm] = useState(false);
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;

    const initialValues: CustomItemFormValues = {
        name: '',
        note: '',
        shareId,
        sections: [],
        extraFields: [],
        files: filesFormInitializer(),
        type: 'custom',
    };

    const form = useFormik<CustomItemFormValues>({
        initialValues,
        initialErrors: validateCustomItemForm(initialValues),
        validate: validateCustomItemForm,
        validateOnBlur: true,
        onSubmit: ({ shareId, name, note, sections, extraFields, files, type, ...rest }) => {
            const optimisticId = uniqueId();

            onSubmit({
                // TODO(@djankovic): FIXME
                type: type as any,
                optimisticId,
                shareId,
                metadata: { name, note: obfuscate(note), itemUuid: optimisticId },
                extraFields: obfuscateExtraFields(extraFields),
                extraData: [],
                files,
                content: {
                    ...rest,
                    sections,
                },
            });
        },
    });

    const onSelectTemplate = async (template: Template) => {
        const values: CustomItemFormValues = {
            ...form.values,
            type: template.type ?? 'custom',
            extraFields: templateToFormFields(template),
            ...extraTypeFieldValues(template.type),
        } as any;

        await form.setValues(values);
        form.resetForm({ values });

        setShowForm(true);
    };

    const handleCancelClick = () => (showForm ? setShowForm(false) : onCancel());

    const SubmitButton = (() => {
        if (!showForm) {
            return <StartFromScratch onClick={() => setShowForm(true)} />;
        }

        if (isFreePlan) {
            return <UpgradeButton key="upgrade-button" upsellRef={UpsellRef.CUSTOM_ITEMS} />;
        }
    })();

    return (
        <ItemCreatePanel
            discardable={!form.dirty}
            formId={FORM_ID}
            handleCancelClick={handleCancelClick}
            cancelIcon={showForm ? 'arrow-left' : 'cross'}
            type={form.values.type}
            valid={form.isValid}
            actions={ParentPortal}
            submitButton={SubmitButton}
        >
            {({ didEnter }) => (
                <>
                    {!showForm &&
                        groupedTemplates.map((g) => (
                            <div key={g.label} className={clsx(g.theme, 'mb-4')}>
                                <div className="mb-2 color-weak">{g.label}</div>
                                <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    {g.templates.map((t) => (
                                        <Button
                                            key={t.label}
                                            pill
                                            color="weak"
                                            shape="solid"
                                            className="w-full"
                                            onClick={() => onSelectTemplate(t)}
                                        >
                                            <div className="flex items-center w-full text-left">
                                                <Icon name={t.icon} className="mr-2" />
                                                <span>{t.label}</span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    {showForm && (
                        <FormikProvider value={form}>
                            <Form id={FORM_ID} className="ui-violet">
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

                                <ExtraTypeFields type={form.values.type} />

                                <ExtraFieldGroup form={form} />

                                <FieldsetCluster>
                                    <Field
                                        name="note"
                                        label={c('Label').t`Note`}
                                        placeholder={c('Placeholder').t`Add note`}
                                        component={TextAreaField}
                                        icon="note"
                                        maxLength={MAX_ITEM_NOTE_LENGTH}
                                    />
                                </FieldsetCluster>

                                <FieldsetCluster>
                                    <Field
                                        name="files"
                                        component={FileAttachmentsField}
                                        shareId={form.values.shareId}
                                    />
                                </FieldsetCluster>

                                <CustomFormSections form={form} />
                            </Form>
                        </FormikProvider>
                    )}
                </>
            )}
        </ItemCreatePanel>
    );
};
