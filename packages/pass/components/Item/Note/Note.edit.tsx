import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { FileAttachmentsFieldEdit } from '@proton/pass/components/FileAttachments/FileAttachmentsFieldEdit';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { BaseTextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { BaseTitleField } from '@proton/pass/components/Form/Field/TitleField';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
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
        initialValues: { name: metadata.name, note, files: filesFormInitializer(), shareId },
        onSubmit: ({ name, note, files }) => {
            onSubmit({
                ...uneditable,
                itemId,
                lastRevision,
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
                        <Field
                            component={BaseTextAreaField}
                            label={c('Label').t`Note`}
                            labelContainerClassName="sr-only"
                            name="note"
                            placeholder={c('Placeholder').t`Write your note`}
                            maxLength={MAX_ITEM_NOTE_LENGTH}
                            minRows={5}
                            rows={Number.MAX_SAFE_INTEGER}
                        />
                        <FieldsetCluster className="sticky bottom-0">
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
