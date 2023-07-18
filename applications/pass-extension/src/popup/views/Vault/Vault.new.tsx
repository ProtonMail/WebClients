import { type VFC, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { selectPassPlan, selectVaultLimits, vaultCreationIntent } from '@proton/pass/store';
import { vaultCreate } from '@proton/pass/store/actions/requests';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';
import { uniqueId } from '@proton/pass/utils/string';

import { useRequestStatusEffect } from '../../../shared/hooks/useRequestStatusEffect';
import { ItemCard } from '../../components/Item/ItemCard';
import { VaultForm, type VaultFormConsumerProps, type VaultFormValues } from './Vault.form';
import { validateVaultVaultsWithEffect } from './Vault.validation';

export const FORM_ID = 'vault-create';

export const VaultNew: VFC<VaultFormConsumerProps> = ({ onSubmit, onSuccess, onFailure, onFormValidChange }) => {
    const dispatch = useDispatch();
    const { vaultLimitReached } = useSelector(selectVaultLimits);
    const passPlan = useSelector(selectPassPlan);

    const optimisticId = useMemo(() => uniqueId(), []);
    const requestId = useMemo(() => vaultCreate(optimisticId), [optimisticId]);
    useRequestStatusEffect(requestId, { onSuccess, onFailure });

    const form = useFormik<VaultFormValues>({
        initialValues: {
            name: '',
            description: '',
            color: VaultColor.COLOR1,
            icon: VaultIcon.ICON1,
        },
        validateOnChange: true,
        validate: validateVaultVaultsWithEffect((errors) => onFormValidChange?.(Object.keys(errors).length === 0)),
        onSubmit: ({ name, description, color, icon }) => {
            onSubmit?.();
            dispatch(
                vaultCreationIntent({
                    id: optimisticId,
                    content: {
                        name,
                        description,
                        display: {
                            color,
                            icon,
                        },
                    },
                })
            );
        },
    });

    return (
        <>
            {vaultLimitReached && (
                <ItemCard className="mb-4">
                    {c('Info').t`You have reached the limit of vaults you can create.`}
                    {passPlan === UserPassPlan.FREE && c('Info').t` Upgrade to a paid plan to create multiple vaults.`}
                </ItemCard>
            )}
            <FormikProvider value={form}>
                <VaultForm form={form} formId={FORM_ID} />
            </FormikProvider>
        </>
    );
};
