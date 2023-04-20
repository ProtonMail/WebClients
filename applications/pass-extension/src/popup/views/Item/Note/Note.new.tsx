import { type VFC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';
import uniqid from 'uniqid';

import { getEpoch } from '@proton/pass/utils/time';

import { ItemNewProps } from '../../../../shared/items';
import { Field } from '../../../components/Fields/Field';
import { NoteTextAreaField, NoteTitleField } from '../../../components/Fields/Note/index';
import { ItemCreatePanel } from '../../../components/Panel/ItemCreatePanel';
import { VaultSelectField } from '../../../components/Vault/VaultSelectField';
import { NoteFormValues, validateNoteForm } from './Note.validation';

const FORM_ID = 'new-note';

export const NoteNew: VFC<ItemNewProps<'note'>> = ({ shareId, onSubmit, onCancel }) => {
    const initialValues: NoteFormValues = { name: '', note: '', shareId };

    const form = useFormik<NoteFormValues>({
        initialValues,
        initialErrors: validateNoteForm(initialValues),
        onSubmit: ({ shareId, name, note }) => {
            const optimisticId = uniqid();

            onSubmit({
                type: 'note',
                optimisticId,
                shareId: shareId,
                createTime: getEpoch(),
                metadata: {
                    name,
                    note,
                    itemUuid: optimisticId,
                },
                content: {},
                extraFields: [],
            });
        },
        validate: validateNoteForm,
        validateOnChange: true,
    });

    return (
        <ItemCreatePanel
            type="note"
            formId={FORM_ID}
            valid={form.isValid}
            discardable={!form.dirty}
            handleCancelClick={onCancel}
        >
            {({ canFocus }) => (
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <Field component={VaultSelectField} label={c('Label').t`Vault`} name="shareId" />
                        <Field
                            name="name"
                            component={NoteTitleField}
                            label={c('Label').t`Name`}
                            placeholder={c('Placeholder').t`Untitled`}
                            autoFocus={canFocus}
                            key={`note-name-${canFocus}`}
                        />
                        <Field
                            component={NoteTextAreaField}
                            label={c('Label').t`Note`}
                            name="note"
                            placeholder={c('Placeholder').t`Write your note`}
                        />
                    </Form>
                </FormikProvider>
            )}
        </ItemCreatePanel>
    );
};
