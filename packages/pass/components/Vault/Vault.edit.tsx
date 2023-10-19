import { type VFC, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';

import { useRequestStatusEffect } from '@proton/pass/hooks/useRequestStatusEffect';
import { validateVaultVaultsWithEffect } from '@proton/pass/lib/validation/vault';
import { vaultEditIntent } from '@proton/pass/store/actions';
import { vaultEdit } from '@proton/pass/store/actions/requests';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';

import { VaultForm, type VaultFormConsumerProps, type VaultFormValues } from './Vault.form';

type Props = VaultFormConsumerProps & { vault: VaultShareItem };

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
            <Form id={FORM_ID} className="flex flex-column gap-y-4">
                <VaultForm form={form} />
            </Form>
        </FormikProvider>
    );
};
