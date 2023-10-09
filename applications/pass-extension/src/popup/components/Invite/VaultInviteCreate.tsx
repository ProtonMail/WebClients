import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { inviteCreationIntent, selectVaultWithItemsCount } from '@proton/pass/store';
import { ShareRole } from '@proton/pass/types';

import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';
import type { InviteFormValues } from '../../../shared/form/types';
import { validateShareInviteValues } from '../../../shared/form/validator/validate-vaultInvite';
import { useActionWithRequest } from '../../../shared/hooks/useActionWithRequest';
import { useInviteContext } from '../../context/invite/InviteContextProvider';
import { PanelHeader } from '../Panel/Header';
import { Panel } from '../Panel/Panel';
import { SharedVaultItem } from '../Vault/SharedVaultItem';
import { FORM_ID, VaultInviteForm } from './VaultInviteForm';

type Props = { shareId: string };

export const VaultInviteCreate: FC<Props> = ({ shareId }) => {
    const { close, manageAccess } = useInviteContext();

    const vault = useSelector(selectVaultWithItemsCount(shareId));
    const createInvite = useActionWithRequest({ action: inviteCreationIntent, onSuccess: () => manageAccess(shareId) });

    const form = useFormik<InviteFormValues>({
        initialValues: { step: 'email', email: '', role: ShareRole.READ },
        validateOnChange: true,
        validate: validateShareInviteValues,
        onSubmit: ({ email, role, step }, { setFieldValue }) => {
            switch (step) {
                case 'email':
                    return setFieldValue('step', 'permissions');
                case 'permissions':
                    createInvite.dispatch({ email, role, shareId });
                    break;
            }
        },
    });

    const submitText = vault.shared ? c('Action').t`Send invite` : c('Action').t`Share vault`;

    return (
        <SidebarModal onClose={close} open>
            <Panel
                loading={createInvite.loading}
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="modal-close-button"
                                className="flex-item-noshrink"
                                icon
                                pill
                                shape="solid"
                                onClick={close}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                            </Button>,

                            <Button
                                key="modal-submit-button"
                                type="submit"
                                color="norm"
                                pill
                                disabled={createInvite.loading || !form.isValid || !form.dirty}
                                loading={createInvite.loading}
                                form={FORM_ID}
                            >
                                {form.values.step === 'email' ? c('Action').t`Continue` : submitText}
                            </Button>,
                        ]}
                    />
                }
            >
                <SharedVaultItem vault={vault} className="mt-3 mb-6" />
                <FormikProvider value={form}>
                    <VaultInviteForm form={form} />
                </FormikProvider>
            </Panel>
        </SidebarModal>
    );
};
