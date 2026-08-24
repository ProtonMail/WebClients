import { useMemo } from 'react';

import { useFormik } from 'formik';

import { useDeobfuscatedItem } from '../../../hooks/useDeobfuscatedItem';
import { useItemDraft } from '../../../hooks/useItemDraft';
import { validateCustomItemForm } from '../../../lib/validation/custom-item';
import type { CustomItemFormValues, ItemCustomType, ItemRevision } from '../../../types';
import { ItemEditPanel } from '../../Layout/Panel/ItemEditPanel';
import type { ItemEditViewProps } from '../../Views/types';
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
