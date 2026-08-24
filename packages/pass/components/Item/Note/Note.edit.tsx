import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../constants';
import { useDeobfuscatedValue } from '../../../hooks/useDeobfuscatedValue';
import { useItemDraft } from '../../../hooks/useItemDraft';
import { filesFormInitializer } from '../../../lib/file-attachments/helpers';
import { deobfuscateExtraFields, obfuscateExtraFields } from '../../../lib/items/item.obfuscation';
import { bindOTPSanitizer, sanitizeExtraField } from '../../../lib/items/item.utils';
import { validateNoteForm } from '../../../lib/validation/note';
import type { NoteFormValues } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { obfuscate } from '../../../utils/obfuscate/xor';
import { FeatureFlag } from '../../Core/WithFeatureFlag';
import { FileAttachmentsFieldEdit } from '../../FileAttachments/FileAttachmentsFieldEdit';
import { ExtraFieldGroup } from '../../Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '../../Form/Field/Field';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { TextAreaField } from '../../Form/Field/TextareaField';
import { BaseTitleField } from '../../Form/Field/TitleField';
import { ItemEditPanel } from '../../Layout/Panel/ItemEditPanel';
import type { ItemEditViewProps } from '../../Views/types';

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
            const sanitizeOTP = bindOTPSanitizer(name);

            onSubmit({
                ...uneditable,
                itemId,
                lastRevision,
                extraFields: obfuscateExtraFields(extraFields.map(sanitizeExtraField(sanitizeOTP))),
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
                                minRows={10}
                            />
                        </FieldsetCluster>
                        <FeatureFlag feature={PassFeature.PassCustomTypeV1}>
                            <ExtraFieldGroup
                                form={form}
                                customButton={{ shape: 'solid', color: 'weak', label: c('Action').t`Add field` }}
                            />
                        </FeatureFlag>
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
