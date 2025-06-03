import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { FileAttachmentsFieldEdit } from '@proton/pass/components/FileAttachments/FileAttachmentsFieldEdit';
import { ExtraFieldGroup } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { BaseTitleField } from '@proton/pass/components/Form/Field/TitleField';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { deobfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { obfuscateLabeledExtraFields } from '@proton/pass/lib/items/item.utils';
import { validateNoteForm } from '@proton/pass/lib/validation/note';
import type { NoteFormValues } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

const FORM_ID = 'edit-note';

export const NoteEdit: FC<ItemEditViewProps<'note'>> = ({ share, revision, onSubmit, onCancel }) => {
    const { shareId } = share;
    const { data: item, itemId, revision: lastRevision } = revision;
    const { metadata, ...uneditable } = item;
    const note = useDeobfuscatedValue(metadata.note);

    const form = useFormik<NoteFormValues>({
        initialValues: {
            name: metadata.name,
            note,
            extraFields: deobfuscateExtraFields(item.extraFields),
            files: filesFormInitializer(),
            shareId,
        },
        onSubmit: ({ name, note, files, extraFields }) => {
            onSubmit({
                ...uneditable,
                itemId,
                lastRevision,
                extraFields: obfuscateLabeledExtraFields({ extraFields, label: name, issuer: name }),
                files,
                metadata: { ...metadata, name, note: obfuscate(note) },
                shareId,
            });
        },
        validate: validateNoteForm,
        validateOnChange: true,
        validateOnMount: true,
    });

    useItemDraft<NoteFormValues>(form, {
        mode: 'edit',
        itemId: itemId,
        revision: lastRevision,
        shareId: form.values.shareId,
    });

    return (
        <ItemEditPanel
            type="note"
            formId={FORM_ID}
            valid={form.isValid && form.dirty && !form.status?.isBusy}
            discardable={!form.dirty}
            handleCancelClick={onCancel}
        >
            {() => (
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <Field
                            dense
                            className="mb-4"
                            component={BaseTitleField}
                            label={c('Label').t`Name`}
                            labelContainerClassName="sr-only"
                            name="name"
                            placeholder={c('Placeholder').t`Untitled`}
                            maxLength={MAX_ITEM_NAME_LENGTH}
                        />
                        <FieldsetCluster className="mt-4">
                            <Field
                                component={TextAreaField}
                                name="note"
                                placeholder={c('Label').t`Note`}
                                maxLength={MAX_ITEM_NOTE_LENGTH}
                                rows={25}
                                minRows={2}
                            />
                        </FieldsetCluster>
                        <ExtraFieldGroup
                            form={form}
                            customButton={{ shape: 'solid', color: 'weak', label: c('Action').t`Add field` }}
                        />
                        <FieldsetCluster className="bg-weak mt-4" mode="read">
                            <Field
                                name="files"
                                component={FileAttachmentsFieldEdit}
                                shareId={shareId}
                                itemId={itemId}
                                revision={lastRevision}
                            />
                        </FieldsetCluster>
                    </Form>
                </FormikProvider>
            )}
        </ItemEditPanel>
    );
};
