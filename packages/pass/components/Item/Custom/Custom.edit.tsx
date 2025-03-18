import { type FC } from 'react';

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
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { validateCustomItemForm } from '@proton/pass/lib/validation/custom-item';
import { type CustomItemFormValues } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

import { FileAttachmentsFieldEdit } from '../../FileAttachments/FileAttachmentsFieldEdit';
import { ExtraTypeFields } from './Custom.new';
import { CustomFormSections } from './CustomFormSections';

const FORM_ID = 'edit-custom';

export const CustomEdit: FC<ItemEditViewProps<'custom'>> = ({ revision, share, onSubmit, onCancel }) => {
    const { shareId } = share;
    const { data: item, itemId, revision: lastRevision } = revision;

    const { metadata, content, extraFields, ...uneditable } = useDeobfuscatedItem(item);

    const { sections, ...rest } = content;

    const initialValues: CustomItemFormValues = {
        name: metadata.name,
        note: metadata.note,
        shareId,
        sections,
        extraFields,
        type: revision.data.type,
        files: filesFormInitializer(),
        ...rest,
    };

    const form = useFormik<CustomItemFormValues>({
        initialValues,
        initialErrors: validateCustomItemForm(initialValues),
        validate: validateCustomItemForm,
        validateOnBlur: true,
        onSubmit: ({ shareId, name, note, sections, extraFields, files, type, ...rest }) => {
            const updatedItem = {
                ...uneditable,
                type: type as any,
                itemId,
                lastRevision,
                shareId,
                metadata: { ...metadata, name, note: obfuscate(note) },
                extraFields: obfuscateExtraFields(extraFields),
                files,
                content: {
                    sections,
                    ...rest,
                },
            };

            onSubmit(updatedItem);
        },
    });

    return (
        <ItemEditPanel
            discardable={!form.dirty}
            formId={FORM_ID}
            handleCancelClick={onCancel}
            type="custom"
            valid={form.isValid}
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
