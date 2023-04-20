import { type VFC, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { FormikProvider, useFormik } from 'formik';

import { vaultEditIntent } from '@proton/pass/store';
import { vaultEdit } from '@proton/pass/store/actions/requests';
import type { VaultShare } from '@proton/pass/types';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';

import { useRequestStatusEffect } from '../../../shared/hooks/useRequestStatusEffect';
import { VaultForm, type VaultFormConsumerProps, type VaultFormValues } from './Vault.form';
import { validateVaultVaultsWithEffect } from './Vault.validation';

type Props = VaultFormConsumerProps & { vault: VaultShare };

export const FORM_ID = 'vault-edit';

export const VaultEdit: VFC<Props> = ({ vault, onSubmit, onSuccess, onFailure, onFormValidChange }) => {
    const dispatch = useDispatch();

    const requestId = useMemo(() => vaultEdit(vault.shareId), [vault.shareId]);
    useRequestStatusEffect(requestId, { onSuccess, onFailure });

    const form = useFormik<VaultFormValues>({
        initialValues: {
            name: vault.content.name,
            description: vault.content.description,
            color: vault.content.display.color ?? VaultColor.COLOR1,
            icon: vault.content.display.icon ?? VaultIcon.ICON1,
        },
        validateOnChange: true,
        validate: validateVaultVaultsWithEffect((errors) => onFormValidChange?.(Object.keys(errors).length === 0)),
        onSubmit: ({ name, description, color, icon }) => {
            onSubmit?.();
            dispatch(
                vaultEditIntent({
                    id: vault.shareId,
                    content: { name, description, display: { color, icon } },
                })
            );
        },
    });

    return (
        <FormikProvider value={form}>
            <VaultForm form={form} formId={FORM_ID} />
        </FormikProvider>
    );
};
