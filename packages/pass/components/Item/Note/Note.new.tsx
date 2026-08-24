import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../constants';
import { useInitialValues } from '../../../hooks/items/useInitialValues';
import { useItemDraft } from '../../../hooks/useItemDraft';
import { usePortal } from '../../../hooks/usePortal';
import { filesFormInitializer } from '../../../lib/file-attachments/helpers';
import { obfuscateExtraFields } from '../../../lib/items/item.obfuscation';
import { bindOTPSanitizer, sanitizeExtraField } from '../../../lib/items/item.utils';
import { validateNoteForm } from '../../../lib/validation/note';
import { selectVaultLimits } from '../../../store/selectors';
import type { NoteFormValues } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { obfuscate } from '../../../utils/obfuscate/xor';
import { uniqueId } from '../../../utils/string/unique-id';
import { FeatureFlag } from '../../Core/WithFeatureFlag';
import { FileAttachmentsField } from '../../FileAttachments/FileAttachmentsField';
import { ExtraFieldGroup } from '../../Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '../../Form/Field/Field';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { TextAreaField } from '../../Form/Field/TextareaField';
import { BaseTitleField } from '../../Form/Field/TitleField';
import { VaultPickerField } from '../../Form/Field/VaultPickerField';
import { ItemCreatePanel } from '../../Layout/Panel/ItemCreatePanel';
import type { ItemNewViewProps } from '../../Views/types';

const FORM_ID = 'new-note';

export const NoteNew: FC<ItemNewViewProps<'note'>> = ({ shareId, onSubmit, onCancel }) => {
    const initialValues = useInitialValues<NoteFormValues>((options) => {
        const clone = options?.clone.type === 'note' ? options.clone : null;
        return {
            name: clone?.metadata.name ?? '',
            note: clone?.metadata.note ?? '',
            shareId: options?.shareId ?? shareId,
            extraFields: clone?.extraFields ?? [],
            files: filesFormInitializer(),
        };
    });

    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { ParentPortal, openPortal } = usePortal();

    const form = useFormik<NoteFormValues>({
        initialValues,
        initialErrors: validateNoteForm(initialValues),
        onSubmit: ({ shareId, name, note, files, extraFields }) => {
            const optimisticId = uniqueId();
            const sanitizeOTP = bindOTPSanitizer(name);

            onSubmit({
                type: 'note',
                optimisticId,
                shareId: shareId,
                metadata: { name, note: obfuscate(note), itemUuid: optimisticId },
                files,
                content: {},
                extraFields: obfuscateExtraFields(extraFields.map(sanitizeExtraField(sanitizeOTP))),
            });
        },
        validate: validateNoteForm,
        validateOnChange: true,
    });

    const draft = useItemDraft<NoteFormValues>(form, { mode: 'new', type: 'note' });

    return (
        <ItemCreatePanel
            type="note"
            formId={FORM_ID}
            valid={form.isValid && !form.status?.isBusy}
            discardable={!form.dirty}
            handleCancelClick={onCancel}
            actions={ParentPortal}
        >
            {({ didEnter }) => (
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        {vaultTotalCount > 1 && openPortal(<Field component={VaultPickerField} name="shareId" dense />)}

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
                        <FieldsetCluster className="mt-4">
                            <Field name="files" component={FileAttachmentsField} shareId={form.values.shareId} />
                        </FieldsetCluster>
                    </Form>
                </FormikProvider>
            )}
        </ItemCreatePanel>
    );
};
