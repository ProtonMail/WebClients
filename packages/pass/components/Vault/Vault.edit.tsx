import { type FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalProps } from '@proton/components';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { validateVaultValues } from '@proton/pass/lib/validation/vault';
import { vaultEditIntent } from '@proton/pass/store/actions';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';
import noop from '@proton/utils/noop';

import { VaultForm, type VaultFormValues } from './Vault.form';

type Props = Omit<ModalProps, 'onSubmit'> & { vault: VaultShareItem; onSuccess: () => void };

export const FORM_ID = 'vault-edit';

export const VaultEdit: FC<Props> = ({ vault, onSuccess, ...modalProps }) => {
    const editVault = useActionRequest(vaultEditIntent, { onSuccess });

    const form = useFormik<VaultFormValues>({
        initialValues: {
            name: vault.content.name,
            description: vault.content.description,
            color: vault.content.display.color ?? VaultColor.COLOR1,
            icon: vault.content.display.icon ?? VaultIcon.ICON1,
        },
        validateOnChange: true,
        validate: validateVaultValues,
        onSubmit: async ({ name, description, color, icon }) => {
            editVault.dispatch({
                shareId: vault.shareId,
                content: { name, description, display: { color, icon } },
            });
        },
    });

    return (
        <SidebarModal {...modalProps} open onBackdropClick={noop} disableCloseOnEscape>
            {(didEnter) => (
                <Panel
                    header={
                        <PanelHeader
                            actions={[
                                <Button
                                    key="modal-close-button"
                                    className="shrink-0"
                                    icon
                                    pill
                                    shape="solid"
                                    onClick={modalProps.onClose}
                                    disabled={editVault.loading}
                                >
                                    <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                                </Button>,
                                <Button
                                    key="modal-submit-button"
                                    type="submit"
                                    form={FORM_ID}
                                    color="norm"
                                    pill
                                    loading={editVault.loading}
                                    disabled={!form.isValid || editVault.loading}
                                >
                                    {editVault.loading ? c('Action').t`Saving` : c('Action').t`Save`}
                                </Button>,
                            ]}
                        />
                    }
                >
                    <FormikProvider value={form}>
                        <Form id={FORM_ID} className="flex flex-column gap-y-4">
                            <VaultForm form={form} autoFocus={didEnter} disabled={editVault.loading} />
                        </Form>
                    </FormikProvider>
                </Panel>
            )}
        </SidebarModal>
    );
};
