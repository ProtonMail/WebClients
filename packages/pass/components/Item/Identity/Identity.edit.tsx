import type { FC } from 'react';

import { useFormik } from 'formik';

import { IdentityForm } from '@proton/pass/components/Item/Identity/Identity.form';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { validateIdentityForm } from '@proton/pass/lib/validation/identity';
import type { IdentityItemFormValues } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

export const IdentityEdit: FC<ItemEditViewProps<'identity'>> = ({ share, revision, onSubmit, onCancel }) => {
    const { shareId } = share;
    const { data: item, itemId, revision: lastRevision } = revision;
    const { metadata, content } = useDeobfuscatedItem(item);

    const form = useFormik<IdentityItemFormValues>({
        initialValues: {
            ...content,
            extraFields: [],
            files: filesFormInitializer(),
            name: metadata.name,
            note: metadata.note,
            shareId,
        },
        onSubmit: ({ shareId, name, note, files, ...content }) => {
            onSubmit({
                type: 'identity',
                shareId,
                metadata: { ...metadata, name, note: obfuscate(note) },
                content,
                extraFields: [],
                itemId,
                lastRevision,
                files,
            });
        },
        validate: validateIdentityForm,
        validateOnBlur: true,
        validateOnMount: true,
    });

    useItemDraft<IdentityItemFormValues>(form, {
        mode: 'edit',
        itemId,
        revision: lastRevision,
        shareId: form.values.shareId,
    });

    return <IdentityForm form={form} onCancel={onCancel} revision={revision} />;
};
