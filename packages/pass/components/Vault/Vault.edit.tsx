import { type VFC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';

import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { validateVaultVaultsWithEffect } from '@proton/pass/lib/validation/vault';
import { vaultEditIntent } from '@proton/pass/store/actions';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';

import { VaultForm, type VaultFormConsumerProps, type VaultFormValues } from './Vault.form';

type Props = VaultFormConsumerProps & { vault: VaultShareItem };

export const FORM_ID = 'vault-edit';

export const VaultEdit: VFC<Props> = ({ vault, onSubmit, onSuccess, onFailure, onFormValidChange }) => {
    const editVault = useActionRequest({ action: vaultEditIntent, onSuccess, onFailure });

    const form = useFormik<VaultFormValues>({
        initialValues: {
            name: vault.content.name,
            description: vault.content.description,
            color: vault.content.display.color ?? VaultColor.COLOR1,
            icon: vault.content.display.icon ?? VaultIcon.ICON1,
        },
        validateOnChange: true,
        validate: validateVaultVaultsWithEffect((errors) => onFormValidChange?.(Object.keys(errors).length === 0)),
        onSubmit: async ({ name, description, color, icon }) => {
            onSubmit?.();

            editVault.dispatch({
                shareId: vault.shareId,
                content: { name, description, display: { color, icon } },
            });
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
