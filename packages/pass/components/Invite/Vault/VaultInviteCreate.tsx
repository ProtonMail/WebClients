import { type FC, type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider } from 'formik';
import { c } from 'ttag';

import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import type { InviteStepAttributes } from '@proton/pass/components/Invite/Steps/InviteStepActions';
import { InviteStepActions } from '@proton/pass/components/Invite/Steps/InviteStepActions';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useInviteForm } from '@proton/pass/hooks/invite/useInviteForm';
import { AccessTarget } from '@proton/pass/lib/access/types';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import type { SelectedShare, ShareType } from '@proton/pass/types';
import { type VaultInviteFormValues } from '@proton/pass/types';

import { FORM_ID, VaultInviteForm } from './VaultInviteForm';

export const VaultInviteCreate: FC<SelectedShare> = ({ shareId }) => {
    const { close, manageVaultAccess } = useInviteActions();
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));

    const { form, emailFieldRef, validator, loading } = useInviteForm<VaultInviteFormValues>({
        onSuccess: ({ shareId }) => manageVaultAccess(shareId),
        initialValues: {
            step: 'members',
            members: [],
            target: AccessTarget.Vault,
            shareId,
        },
    });

    const attributes = ((): InviteStepAttributes => {
        const submitDisabled = loading || validator?.loading || !form.isValid;

        switch (form.values.step) {
            case 'members':
                return {
                    closeAction: close,
                    closeIcon: 'cross-big',
                    closeLabel: c('Action').t`Close`,
                    submitDisabled,
                    submitText: c('Action').t`Continue`,
                };

            case 'permissions':
                return {
                    closeAction: () => form.setFieldValue('step', 'members'),
                    closeIcon: 'chevron-left',
                    closeLabel: c('Action').t`Back`,
                    submitDisabled,
                    submitText: c('Action').t`Continue`,
                };

            case 'review':
                return {
                    closeAction: () => form.setFieldValue('step', 'permissions'),
                    closeIcon: 'chevron-left',
                    closeLabel: c('Action').t`Back`,
                    submitDisabled,
                    submitLoading: loading,
                    submitText: vault.shared ? c('Action').t`Send invite` : c('Action').t`Share vault`,
                };
        }
    })();

    return (
        <SidebarModal open className={`pass-invite--${form.values.step}`}>
            {(didEnter): ReactNode => (
                <Panel loading={loading} header={<PanelHeader actions={InviteStepActions(FORM_ID, attributes)} />}>
                    <FormikProvider value={form}>
                        <Form id={FORM_ID} className="flex-1">
                            <VaultInviteForm
                                form={form}
                                autoFocus={didEnter}
                                ref={emailFieldRef}
                                validator={validator}
                            />
                        </Form>
                    </FormikProvider>
                </Panel>
            )}
        </SidebarModal>
    );
};
