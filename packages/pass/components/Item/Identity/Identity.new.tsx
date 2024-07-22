import { type FC, useMemo } from 'react';

import { useFormik } from 'formik';

import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { getIdentityInitialValues } from '@proton/pass/hooks/identity/useIdentityFormSections';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { validateIdentityForm } from '@proton/pass/lib/validation/identity';
import type { IdentityItemFormValues } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { IdentityForm } from './Identity.form';

export const IdentityNew: FC<ItemNewViewProps<'identity'>> = ({ shareId, onSubmit, onCancel }) => {
    const initialValues: IdentityItemFormValues = useMemo(
        () => ({ shareId, name: '', note: '', ...getIdentityInitialValues() }),
        []
    );

    const form = useFormik<IdentityItemFormValues>({
        initialValues,
        initialErrors: validateIdentityForm(initialValues),
        onSubmit: ({ shareId, name, note, ...content }) => {
            const id = uniqueId();
            onSubmit({
                type: 'identity',
                optimisticId: id,
                shareId,
                createTime: getEpoch(),
                metadata: { name, note: obfuscate(note), itemUuid: id },
                content,
                extraData: {},
                extraFields: [],
            });
        },
        validate: validateIdentityForm,
        validateOnBlur: true,
    });

    useItemDraft<IdentityItemFormValues>(form, { mode: 'new', type: 'identity' });

    return <IdentityForm form={form} onCancel={onCancel} />;
};
