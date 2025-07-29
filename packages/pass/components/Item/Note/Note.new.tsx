import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { FeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { FileAttachmentsField } from '@proton/pass/components/FileAttachments/FileAttachmentsField';
import { ExtraFieldGroup } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { BaseTitleField } from '@proton/pass/components/Form/Field/TitleField';
import { VaultPickerField } from '@proton/pass/components/Form/Field/VaultPickerField';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { useInitialValues } from '@proton/pass/hooks/items/useInitialValues';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { bindOTPSanitizer, sanitizeExtraField } from '@proton/pass/lib/items/item.utils';
import { validateNoteForm } from '@proton/pass/lib/validation/note';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import type { NoteFormValues } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

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
