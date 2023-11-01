import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { ItemCard } from '@proton/pass/components/Item/ItemCard';
import { type RequestEntryFromAction, useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { validateVaultVaultsWithEffect } from '@proton/pass/lib/validation/vault';
import type { vaultCreationSuccess } from '@proton/pass/store/actions';
import { vaultCreationIntent } from '@proton/pass/store/actions';
import { vaultCreateRequest } from '@proton/pass/store/actions/requests';
import { selectPassPlan, selectVaultLimits } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { VaultForm, type VaultFormConsumerProps, type VaultFormValues } from './Vault.form';

type Props = VaultFormConsumerProps & { onVaultCreated: (shareId: string) => void };
export const FORM_ID = 'vault-create';

export const VaultNew: VFC<Props> = ({ onSubmit, onSuccess, onFailure, onFormValidChange, onVaultCreated }) => {
    const { vaultLimitReached } = useSelector(selectVaultLimits);
    const passPlan = useSelector(selectPassPlan);

    const createVault = useActionRequest({
        action: vaultCreationIntent,
        requestId: () => vaultCreateRequest(uniqueId()),
        onSuccess: (req: RequestEntryFromAction<ReturnType<typeof vaultCreationSuccess>>) => {
            onVaultCreated?.(req.data.shareId);
            onSuccess?.();
        },
        onFailure,
    });

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

            void createVault.dispatch({
                content: {
                    name,
                    description,
                    display: { color, icon },
                },
            });
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
                <Form id={FORM_ID} className="flex flex-column gap-y-4">
                    <VaultForm form={form} />
                </Form>
            </FormikProvider>
        </>
    );
};
