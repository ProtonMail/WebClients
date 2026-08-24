import type { FC } from 'react';

import { useFormik } from 'formik';

import { useInitialValues } from '../../../hooks/items/useInitialValues';
import { useItemDraft } from '../../../hooks/useItemDraft';
import { filesFormInitializer } from '../../../lib/file-attachments/helpers';
import { itemBuilder } from '../../../lib/items/item.builder';
import { validateIdentityForm } from '../../../lib/validation/identity';
import type { IdentityItemFormValues } from '../../../types';
import { obfuscate } from '../../../utils/obfuscate/xor';
import { uniqueId } from '../../../utils/string/unique-id';
import type { ItemNewViewProps } from '../../Views/types';
import { IdentityForm } from './Identity.form';

export const IdentityNew: FC<ItemNewViewProps<'identity'>> = ({ shareId, onSubmit, onCancel }) => {
    const initialValues = useInitialValues<IdentityItemFormValues>((options) => {
        const clone = options?.clone.type === 'identity' ? options.clone : null;

        return {
            extraFields: clone?.extraFields ?? [],
            files: filesFormInitializer(),
            name: clone?.metadata.name ?? '',
            note: clone?.metadata.note ?? '',
            shareId: options?.shareId ?? shareId,
            ...(clone?.content ?? itemBuilder('identity').data.content),
        };
    });

    const form = useFormik<IdentityItemFormValues>({
        initialValues,
        initialErrors: validateIdentityForm(initialValues),
        onSubmit: ({ shareId, name, note, files, ...content }) => {
            const id = uniqueId();
            onSubmit({
                type: 'identity',
                optimisticId: id,
                shareId,
                metadata: { name, note: obfuscate(note), itemUuid: id },
                files,
                content,
                extraFields: [],
            });
        },
        validate: validateIdentityForm,
        validateOnBlur: true,
    });

    useItemDraft<IdentityItemFormValues>(form, { mode: 'new', type: 'identity' });

    return <IdentityForm form={form} onCancel={onCancel} />;
};
