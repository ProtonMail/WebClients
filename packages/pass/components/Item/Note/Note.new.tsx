import type { VFC } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { BaseTextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { BaseTitleField } from '@proton/pass/components/Form/Field/TitleField';
import { VaultSelectField } from '@proton/pass/components/Form/Field/VaultSelectField';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { useDraftSync } from '@proton/pass/hooks/useItemDraft';
import { validateNoteForm } from '@proton/pass/lib/validation/note';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import type { NoteFormValues } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';

const FORM_ID = 'new-note';

export const NoteNew: VFC<ItemNewViewProps<'note'>> = ({ shareId, onSubmit, onCancel }) => {
    const initialValues: NoteFormValues = { name: '', note: '', shareId };
    const { vaultTotalCount } = useSelector(selectVaultLimits);

    const form = useFormik<NoteFormValues>({
        initialValues,
        initialErrors: validateNoteForm(initialValues),
        onSubmit: ({ shareId, name, note }) => {
            const optimisticId = uniqueId();

            onSubmit({
                type: 'note',
                optimisticId,
                shareId: shareId,
                createTime: getEpoch(),
                metadata: { name, note: obfuscate(note), itemUuid: optimisticId },
                content: {},
                extraFields: [],
            });
        },
        validate: validateNoteForm,
        validateOnChange: true,
    });

    const draft = useDraftSync<NoteFormValues>(form, {
        type: 'note',
        mode: 'new',
        itemId: 'draft-note',
        shareId: form.values.shareId,
    });

    return (
        <ItemCreatePanel
            type="note"
            formId={FORM_ID}
            valid={form.isValid}
            discardable={!form.dirty}
            handleCancelClick={onCancel}
        >
            {({ didEnter }) => (
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        {vaultTotalCount > 1 && (
                            <FieldsetCluster className="mb-4">
                                <Field component={VaultSelectField} label={c('Label').t`Vault`} name="shareId" />
                            </FieldsetCluster>
                        )}

                        <Field
                            dense
                            name="name"
                            className="mb-4"
                            component={BaseTitleField}
                            label={c('Label').t`Name`}
                            labelContainerClassName="sr-only"
                            placeholder={c('Placeholder').t`Untitled`}
                            autoFocus={!draft && didEnter}
                            key={`note-name-${didEnter}`}
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
        </ItemCreatePanel>
    );
};
