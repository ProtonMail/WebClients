import { useMemo } from 'react';

import { useFormik } from 'formik';

import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { validateCustomItemForm } from '@proton/pass/lib/validation/custom-item';
import type { ItemCustomType, ItemRevision } from '@proton/pass/types';
import type { CustomItemFormValues } from '@proton/pass/types';

import { CustomForm } from './Custom.form';
import { getEditCustomInitialValues, getEditIntent } from './Custom.utils';

const FORM_ID = 'edit-custom';

export const CustomEdit = <T extends ItemCustomType>({ revision, share, onSubmit, onCancel }: ItemEditViewProps<T>) => {
    const { shareId } = share;
    const { data, itemId, revision: lastRevision } = revision as ItemRevision<ItemCustomType>;
    const item = useDeobfuscatedItem(data);

    const initialValues = useMemo(() => getEditCustomInitialValues(item, shareId), []);
    const initialErrors = useMemo(() => validateCustomItemForm(initialValues), []);

    const form = useFormik<CustomItemFormValues>({
        initialValues,
        initialErrors,
        validate: validateCustomItemForm,
        validateOnBlur: true,
        onSubmit: (values) => {
            const updatedItem = getEditIntent<T>(values, item, itemId, lastRevision);
            onSubmit(updatedItem);
        },
    });

    useItemDraft<CustomItemFormValues>(form, {
        mode: 'edit',
        itemId,
        revision: lastRevision,
        shareId: form.values.shareId,
    });

    return (
        <ItemEditPanel
            discardable={!form.dirty}
            formId={FORM_ID}
            handleCancelClick={onCancel}
            type="custom"
            valid={form.isValid && form.dirty && !form.status?.isBusy}
        >
            {({ didEnter }) => <CustomForm form={form} revision={revision} formId={FORM_ID} didEnter={didEnter} />}
        </ItemEditPanel>
    );
};
