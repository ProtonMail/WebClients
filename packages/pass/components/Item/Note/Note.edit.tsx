import type { VFC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Field } from '@proton/pass/components/Form/Field/Field';
import { BaseTextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { BaseTitleField } from '@proton/pass/components/Form/Field/TitleField';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { useDraftSync } from '@proton/pass/hooks/useItemDraft';
import { validateNoteForm } from '@proton/pass/lib/validation/note';
import type { NoteFormValues } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

const FORM_ID = 'edit-note';

export const NoteEdit: VFC<ItemEditViewProps<'note'>> = ({ vault: { shareId }, revision, onSubmit, onCancel }) => {
    const { data: item, itemId, revision: lastRevision } = revision;
    const { metadata, extraFields } = item;
    const { name, itemUuid } = metadata;
    const note = useDeobfuscatedValue(metadata.note);

    const form = useFormik<NoteFormValues>({
        initialValues: { name, note, shareId },
        onSubmit: ({ name, note }) => {
            onSubmit({
                type: 'note',
                itemId,
                shareId,
                lastRevision,
                metadata: { note: obfuscate(note), name, itemUuid },
                content: {},
                extraFields,
            });
        },
        validate: validateNoteForm,
        validateOnChange: true,
    });

    useDraftSync<NoteFormValues>(form, {
        type: 'note',
        mode: 'edit',
        itemId: itemId,
        shareId: form.values.shareId,
    });

    return (
        <ItemEditPanel
            type="note"
            formId={FORM_ID}
            valid={form.isValid && form.dirty}
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
                    </Form>
                </FormikProvider>
            )}
        </ItemEditPanel>
    );
};
