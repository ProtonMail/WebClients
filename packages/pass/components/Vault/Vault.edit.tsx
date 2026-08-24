import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import noop from '@proton/utils/noop';

import { useActionRequest } from '../../hooks/useRequest';
import { validateVaultValues } from '../../lib/validation/vault';
import { vaultEditIntent } from '../../store/actions';
import type { VaultShareItem } from '../../store/reducers';
import { VaultColor, VaultIcon } from '../../types/protobuf/vault-v1.static';
import { SidebarModal } from '../Layout/Modal/SidebarModal';
import { Panel } from '../Layout/Panel/Panel';
import { PanelHeader } from '../Layout/Panel/PanelHeader';
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
        onSubmit: ({ name, description, color, icon }) =>
            editVault.dispatch({
                shareId: vault.shareId,
                content: { name, description, display: { color, icon } },
            }),
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
                                    <IcCrossBig className="modal-close-icon" alt={c('Action').t`Close`} />
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
