import { useMemo } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { ExtraFieldGroup } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { validateCustomItemForm } from '@proton/pass/lib/validation/custom-item';
import type { DeobfuscatedItem, ItemCustomType, ItemEditIntent, ItemRevision, ShareId } from '@proton/pass/types';
import { type CustomItemFormValues } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

import { FileAttachmentsFieldEdit } from '../../FileAttachments/FileAttachmentsFieldEdit';
import { ExtraTypeFields } from './Custom.new';
import { CustomFormSections } from './CustomFormSections';

const FORM_ID = 'edit-custom';

const getInitialValues = <T extends ItemCustomType>(
    item: DeobfuscatedItem<ItemCustomType>,
    shareId: ShareId
): CustomItemFormValues<T> => {
    const { metadata, content, extraFields } = item;

    const base = {
        name: metadata.name,
        note: metadata.note,
        shareId,
        sections: content.sections,
        extraFields,
        files: filesFormInitializer(),
    };

    const values = ((): CustomItemFormValues<ItemCustomType> => {
        switch (item.type) {
            case 'custom':
                return { ...base, type: 'custom' };

            case 'sshKey':
                const { privateKey, publicKey } = item.content;
                return { ...base, type: 'sshKey', privateKey, publicKey };

            case 'wifi':
                const { password, security, ssid } = item.content;
                return { ...base, type: 'wifi', password, security, ssid };
        }
    })();

    return values as CustomItemFormValues<T>;
};

const getEditIntent = <T extends ItemCustomType>(
    values: CustomItemFormValues,
    item: DeobfuscatedItem<ItemCustomType>,
    itemId: string,
    lastRevision: number
): ItemEditIntent<T> => {
    const { shareId, name, note, sections, extraFields, files } = values;

    const base = {
        itemId,
        lastRevision,
        shareId,
        metadata: { ...item.metadata, name, note: obfuscate(note) },
        extraFields: obfuscateExtraFields(extraFields),
        files,
    };

    const update = ((): ItemEditIntent<ItemCustomType> => {
        switch (values.type) {
            case 'custom':
                return { ...base, type: 'custom', content: { sections } };

            case 'sshKey':
                const { privateKey, publicKey } = values;
                return { ...base, type: 'sshKey', content: { sections, privateKey: obfuscate(privateKey), publicKey } };

            case 'wifi':
                const { password, security, ssid } = values;
                return { ...base, type: 'wifi', content: { sections, password: obfuscate(password), security, ssid } };
        }
    })();

    return update as ItemEditIntent<T>;
};

export const CustomEdit = <T extends ItemCustomType>({ revision, share, onSubmit, onCancel }: ItemEditViewProps<T>) => {
    const { shareId } = share;
    const { data, itemId, revision: lastRevision } = revision as ItemRevision<ItemCustomType>;
    const item = useDeobfuscatedItem(data);

    const initialValues = useMemo(() => getInitialValues(item, shareId), []);
    const initialErrors = useMemo(() => validateCustomItemForm(initialValues), []);

    const form = useFormik<CustomItemFormValues>({
        initialValues,
        initialErrors,
        validate: validateCustomItemForm,
        validateOnBlur: true,
        onSubmit: (values) => {
            const updatedItem = getEditIntent<T>(values, item, itemId, lastRevision);
            onSubmit(updatedItem);
        },
    });

    useItemDraft<CustomItemFormValues>(form, {
        mode: 'edit',
        itemId,
        revision: lastRevision,
        shareId: form.values.shareId,
    });

    return (
        <ItemEditPanel
            discardable={!form.dirty}
            formId={FORM_ID}
            handleCancelClick={onCancel}
            type="custom"
            valid={form.isValid && form.dirty && !form.status?.isBusy}
        >
            {({ didEnter }) => (
                <>
                    <FormikProvider value={form}>
                        <Form id={FORM_ID} className="ui-violet">
                            <FieldsetCluster>
                                <Field
                                    lengthLimiters
                                    name="name"
                                    label={c('Label').t`Title`}
                                    placeholder={c('Placeholder').t`Untitled`}
                                    component={TitleField}
                                    autoFocus={didEnter}
                                    key={`custom-name-${didEnter}`}
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
                                    component={FileAttachmentsFieldEdit}
                                    shareId={shareId}
                                    itemId={itemId}
                                    revision={lastRevision}
                                />
                            </FieldsetCluster>

                            <CustomFormSections form={form} />
                        </Form>
                    </FormikProvider>
                </>
            )}
        </ItemEditPanel>
    );
};
