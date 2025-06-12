import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
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
import type { ItemCreateIntent, ItemCustomType, ShareId } from '@proton/pass/types';
import { type CustomItemFormValues } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { WifiSecurity } from '@proton/pass/types/protobuf/item-v1';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import clsx from '@proton/utils/clsx';

import { CustomFormSections } from './CustomFormSections';
import { type CustomTemplate, customTemplateToFormFields, getGroupedTemplates } from './CustomTemplates';

const getInitialValues = <T extends ItemCustomType>(
    type: ItemCustomType,
    shareId: ShareId
): CustomItemFormValues<T> => {
    const base = {
        name: '',
        note: '',
        shareId,
        sections: [],
        extraFields: [],
        files: filesFormInitializer(),
    };

    const values = ((): CustomItemFormValues<ItemCustomType> => {
        switch (type) {
            case 'custom':
                return { ...base, type };
            case 'sshKey':
                return { ...base, type, privateKey: '', publicKey: '' };
            case 'wifi':
                return { ...base, type, password: '', security: WifiSecurity.UnspecifiedWifiSecurity, ssid: '' };
        }
    })();

    return values as CustomItemFormValues<T>;
};

const getCreateIntent = <T extends ItemCustomType>(values: CustomItemFormValues): ItemCreateIntent<T> => {
    const optimisticId = uniqueId();
    const { shareId, name, note, sections, extraFields, files } = values;

    const base = {
        optimisticId,
        shareId,
        metadata: { name, note: obfuscate(note), itemUuid: optimisticId },
        extraFields: obfuscateExtraFields(extraFields),
        extraData: [],
        files,
    };

    const create = ((): ItemCreateIntent<ItemCustomType> => {
        switch (values.type) {
            case 'custom':
                return { ...base, type: 'custom', content: { sections } };

            case 'sshKey':
                const { privateKey, publicKey } = values;
                return { ...base, type: 'sshKey', content: { sections, privateKey: obfuscate(privateKey), publicKey } };

            case 'wifi':
                const { password, ssid, security } = values;
                return { ...base, type: 'wifi', content: { sections, password: obfuscate(password), ssid, security } };
        }
    })();

    return create as ItemCreateIntent<T>;
};

const extraTypeFieldValues = (template: CustomTemplate, values: CustomItemFormValues): CustomItemFormValues => {
    const base = { ...values, extraFields: customTemplateToFormFields(template) };
    const { type } = template;

    switch (type) {
        case 'custom':
            return { ...base, type } satisfies CustomItemFormValues<'custom'>;

        case 'wifi':
            return {
                ...base,
                type,
                ssid: '',
                password: '',
                security: WifiSecurity.UnspecifiedWifiSecurity,
            } satisfies CustomItemFormValues<'wifi'>;

        case 'sshKey':
            return {
                ...base,
                type,
                publicKey: '',
                privateKey: '',
            } satisfies CustomItemFormValues<'sshKey'>;
    }
};

const FORM_ID = 'new-custom';

const StartFromScratch: FC<{ onClick: () => void }> = ({ onClick }) => (
    <Button pill color="norm" onClick={onClick} className="ui-violet flex flex-nowrap gap-2">
        <Icon name="pencil" className="shrink-0" />
        <span className="text-ellipsis">{c('Action').t`Start from scratch`}</span>
    </Button>
);

const wifiSecurityLabel: Record<WifiSecurity, () => string> = {
    [WifiSecurity.UnspecifiedWifiSecurity]: () => c('Label').t`Unspecified`,
    [WifiSecurity.WPA]: () => 'WPA',
    [WifiSecurity.WPA2]: () => 'WPA2',
    [WifiSecurity.WPA3]: () => 'WPA3',
    [WifiSecurity.WEP]: () => 'WEP',
};

const WifiSecurities = Object.values(WifiSecurity).filter((val) => typeof val === 'number') as WifiSecurity[];

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
                        {WifiSecurities.map((value) => {
                            const label = wifiSecurityLabel[value]();
                            return (
                                <Option value={value} title={label} key={value}>
                                    {label}
                                </Option>
                            );
                        })}
                    </Field>
                </FieldsetCluster>
            );
    }
};

export const CustomNew = <T extends ItemCustomType>({ type, shareId, onSubmit, onCancel }: ItemNewViewProps<T>) => {
    const { ParentPortal, openPortal } = usePortal();
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const [showForm, setShowForm] = useState(false);
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;

    const initialValues = useMemo(() => getInitialValues(type, shareId), []);
    const initialErrors = useMemo(() => validateCustomItemForm(initialValues), []);
    const groups = useMemo(getGroupedTemplates, []);

    const form = useFormik<CustomItemFormValues>({
        initialValues,
        initialErrors,
        validate: validateCustomItemForm,
        validateOnBlur: true,
        onSubmit: (values) => {
            const create = getCreateIntent<T>(values);
            onSubmit(create);
        },
    });

    const onSelectTemplate = async (template: CustomTemplate) => {
        const values = extraTypeFieldValues(template, initialValues);
        await form.setValues(values);
        form.resetForm({ values });
        setShowForm(true);
    };

    const handleCancelClick = () => (showForm ? setShowForm(false) : onCancel());

    const SubmitButton = (() => {
        if (!showForm) return <StartFromScratch onClick={() => setShowForm(true)} />;
        if (isFreePlan) return <UpgradeButton key="upgrade-button" upsellRef={UpsellRef.CUSTOM_ITEMS} />;
    })();

    return (
        <ItemCreatePanel
            discardable={!form.dirty}
            formId={FORM_ID}
            handleCancelClick={handleCancelClick}
            cancelIcon={showForm ? 'arrow-left' : 'cross'}
            type={form.values.type}
            valid={form.isValid && !form.status?.isBusy}
            actions={ParentPortal}
            submitButton={SubmitButton}
        >
            {({ didEnter }) => (
                <>
                    {!showForm &&
                        groups.map(({ label, theme, templates }) => (
                            <div key={label} className={clsx(theme, 'mb-4')}>
                                <div className="mb-2 color-weak">{label}</div>
                                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                                    {templates.map((template) => (
                                        <Button
                                            key={template.label}
                                            pill
                                            color="weak"
                                            shape="solid"
                                            className="w-full"
                                            onClick={() => onSelectTemplate(template)}
                                        >
                                            <div className="flex items-center w-full text-left flex-nowrap">
                                                <Icon name={template.icon} className="shrink-0 mr-2" />
                                                <span className="text-ellipsis">{template.label}</span>
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
