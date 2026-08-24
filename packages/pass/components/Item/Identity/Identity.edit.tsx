import type { FC } from 'react';

import { useFormik } from 'formik';

import { useDeobfuscatedItem } from '../../../hooks/useDeobfuscatedItem';
import { useItemDraft } from '../../../hooks/useItemDraft';
import { filesFormInitializer } from '../../../lib/file-attachments/helpers';
import { validateIdentityForm } from '../../../lib/validation/identity';
import type { IdentityItemFormValues } from '../../../types';
import { obfuscate } from '../../../utils/obfuscate/xor';
import type { ItemEditViewProps } from '../../Views/types';
import { IdentityForm } from './Identity.form';

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
