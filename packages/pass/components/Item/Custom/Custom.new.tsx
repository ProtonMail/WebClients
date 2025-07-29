import { type FC, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { useInitialValues } from '@proton/pass/hooks/items/useInitialValues';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { validateCustomItemForm } from '@proton/pass/lib/validation/custom-item';
import { selectPassPlan } from '@proton/pass/store/selectors/user';
import type { ItemCustomType } from '@proton/pass/types';
import { type CustomItemFormValues } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';

import { CustomForm } from './Custom.form';
import { CustomSelect } from './Custom.select';
import { type CustomTemplate, EMPTY_CUSTOM_ITEM } from './Custom.templates';
import { getCreateIntent, getNewCustomInitialValues } from './Custom.utils';

const FORM_ID = 'new-custom';

const StartFromScratch: FC<{ onClick: () => void }> = ({ onClick }) => (
    <Button pill color="norm" onClick={onClick} className="ui-violet flex flex-nowrap gap-2">
        <Icon name="pencil" className="shrink-0" />
        <span className="text-ellipsis">{c('Action').t`Start from scratch`}</span>
    </Button>
);

export const CustomNew = <T extends ItemCustomType>({ type, shareId, onSubmit, onCancel }: ItemNewViewProps<T>) => {
    const { ParentPortal, openPortal } = usePortal();
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;

    const fromClone = useRef<boolean>(false);

    const initialValues = useInitialValues((options) => {
        const clone = options?.clone.type === type ? options.clone : null;
        if (clone) fromClone.current = true;

        return getNewCustomInitialValues({ type, shareId: options?.shareId ?? shareId, clone });
    });

    const initialErrors = useMemo(() => validateCustomItemForm(initialValues), []);

    const [showForm, setShowForm] = useState(() => fromClone.current);

    const form = useFormik<CustomItemFormValues>({
        initialValues,
        initialErrors,
        validate: validateCustomItemForm,
        validateOnBlur: true,
        onSubmit: (values) => {
            const create = getCreateIntent<T>(values);
            onSubmit(create);
        },
    });

    useItemDraft<CustomItemFormValues>(form, {
        mode: 'new',
        type: form.values.type,
        canSave: showForm,
        onHydrated: (draft) => draft && setShowForm(true),
    });

    const onSelectTemplate = async (template: CustomTemplate) => {
        const values = getNewCustomInitialValues({ type: template.type, template, shareId });
        await form.setValues(values);
        form.resetForm({ values });
        setShowForm(true);
    };

    const handleCancelClick = () => (showForm ? setShowForm(false) : onCancel());

    const SubmitButton = (() => {
        if (!showForm) return <StartFromScratch onClick={() => onSelectTemplate(EMPTY_CUSTOM_ITEM)} />;
        if (isFreePlan) return <UpgradeButton key="upgrade-button" upsellRef={UpsellRef.CUSTOM_ITEMS} />;
    })();

    return (
        <ItemCreatePanel
            discardable={!(form.dirty && showForm)}
            formId={FORM_ID}
            handleCancelClick={handleCancelClick}
            cancelIcon={showForm ? 'arrow-left' : 'cross'}
            type={form.values.type}
            valid={form.isValid && !form.status?.isBusy}
            actions={ParentPortal}
            submitButton={SubmitButton}
        >
            {({ didEnter }) =>
                showForm ? (
                    <CustomForm form={form} didEnter={didEnter} panelPortal={openPortal} formId={FORM_ID} />
                ) : (
                    <CustomSelect onSelect={onSelectTemplate} />
                )
            }
        </ItemCreatePanel>
    );
};
