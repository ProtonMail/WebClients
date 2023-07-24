import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, type ModalProps } from '@proton/components/components';
import { selectVaultWithItemsCount } from '@proton/pass/store';
import { ShareRole } from '@proton/pass/types';

import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';
import type { InviteFormValues } from '../../../shared/form/types';
import { validateShareInviteValues } from '../../../shared/form/validator/validate-vaultInvite';
import { PanelHeader } from '../Panel/Header';
import { Panel } from '../Panel/Panel';
import { SharedVaultItem } from '../Vault/SharedVaultItem';
import { FORM_ID, VaultInviteForm } from './VaultInviteForm';

type Props = ModalProps & { shareId: string };

export const VaultInvite: FC<Props> = ({ shareId, onClose, ...props }) => {
    const vault = useSelector(selectVaultWithItemsCount(shareId));

    const form = useFormik<InviteFormValues>({
        initialValues: { step: 'email', email: '', role: ShareRole.WRITE },
        validateOnChange: true,
        validate: validateShareInviteValues,
        onSubmit: ({ email, role, step }, { setFieldValue }) => {
            switch (step) {
                case 'email':
                    return setFieldValue('step', 'permissions');
                case 'permissions':
                    /* create invitation */
                    console.log('create invitation for', email, role);
                    return;
            }
        },
    });

    return (
        <SidebarModal {...props} onClose={onClose}>
            <Panel
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="modal-close-button"
                                className="flex-item-noshrink"
                                icon
                                pill
                                shape="solid"
                                onClick={onClose}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                            </Button>,

                            <Button
                                key="modal-submit-button"
                                type="submit"
                                color="norm"
                                pill
                                disabled={!form.isValid || !form.dirty}
                                form={FORM_ID}
                            >
                                {form.values.step === 'email' ? c('Action').t`Continue` : c('Action').t`Send invite`}
                            </Button>,
                        ]}
                    />
                }
            >
                <SharedVaultItem vault={vault} className="mt-3 mb-6" />
                <FormikProvider value={form}>
                    <VaultInviteForm vault={vault} form={form} />
                </FormikProvider>
            </Panel>
        </SidebarModal>
    );
};
