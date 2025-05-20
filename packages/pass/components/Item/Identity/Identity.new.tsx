import { type FC, useMemo } from 'react';

import { useFormik } from 'formik';

import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { validateIdentityForm } from '@proton/pass/lib/validation/identity';
import type { IdentityItemFormValues } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { IdentityForm } from './Identity.form';

export const IdentityNew: FC<ItemNewViewProps<'identity'>> = ({ shareId, onSubmit, onCancel }) => {
    const initialValues: IdentityItemFormValues = useMemo(
        () => ({ shareId, name: '', note: '', files: filesFormInitializer(), ...itemBuilder('identity').data.content }),
        []
    );

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
