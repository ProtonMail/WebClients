import type { VFC } from 'react';

import { Field, Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import type { ItemEditProps } from '../../../../shared/items';
import { NoteTextAreaField, NoteTitleField } from '../../../components/Fields/Note/index';
import { ItemEditPanel } from '../../../components/Panel/ItemEditPanel';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../Item/Item.validation';
import type { NoteFormValues } from './Note.validation';
import { validateNoteForm } from './Note.validation';

const FORM_ID = 'edit-note';

export const NoteEdit: VFC<ItemEditProps<'note'>> = ({ vault: { shareId }, revision, onSubmit, onCancel }) => {
    const { data: item, itemId, revision: lastRevision } = revision;
    const { metadata, extraFields } = item;
    const { name, note, itemUuid } = metadata;

    const form = useFormik<NoteFormValues>({
        initialValues: { name, note, shareId },
        onSubmit: ({ name, note }) => {
            onSubmit({
                type: 'note',
                itemId,
                shareId,
                lastRevision,
                metadata: { note, name, itemUuid },
                content: {},
                extraFields,
            });
        },
        validate: validateNoteForm,
        validateOnChange: true,
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
                            component={NoteTitleField}
                            label={c('Label').t`Name`}
                            name="name"
                            placeholder={c('Placeholder').t`Untitled`}
                            maxLength={MAX_ITEM_NAME_LENGTH}
                        />
                        <Field
                            component={NoteTextAreaField}
                            label={c('Label').t`Note`}
                            name="note"
                            placeholder={c('Placeholder').t`Write your note`}
                            maxLength={MAX_ITEM_NOTE_LENGTH}
                        />
                    </Form>
                </FormikProvider>
            )}
        </ItemEditPanel>
    );
};
