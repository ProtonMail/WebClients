import { type FC, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { selectVaultWithItemsCount, vaultInviteCreationIntent } from '@proton/pass/store';
import { ShareRole } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string';

import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';
import type { InviteFormValues } from '../../../shared/form/types';
import { validateShareInviteValues } from '../../../shared/form/validator/validate-vaultInvite';
import { useRequestStatusEffect } from '../../../shared/hooks/useRequestStatusEffect';
import { useInviteContext } from '../../context/invite/InviteContextProvider';
import { PanelHeader } from '../Panel/Header';
import { Panel } from '../Panel/Panel';
import { SharedVaultItem } from '../Vault/SharedVaultItem';
import { FORM_ID, VaultInviteForm } from './VaultInviteForm';

type Props = { shareId: string };

export const VaultInvite: FC<Props> = ({ shareId }) => {
    const { close, manage } = useInviteContext();

    const dispatch = useDispatch();

    const vault = useSelector(selectVaultWithItemsCount(shareId));
    const inviteId = useMemo(() => uniqueId(), []);
    const [loading, setLoading] = useState(false);

    const form = useFormik<InviteFormValues>({
        initialValues: { step: 'email', email: '', role: ShareRole.READ },
        validateOnChange: true,
        validate: validateShareInviteValues,
        onSubmit: ({ email, role, step }, { setFieldValue }) => {
            switch (step) {
                case 'email':
                    return setFieldValue('step', 'permissions');
                case 'permissions':
                    dispatch(vaultInviteCreationIntent(inviteId, { email, role, shareId }));
                    break;
            }
        },
    });

    useRequestStatusEffect(inviteId, {
        onStart: () => setLoading(true),
        onFailure: () => setLoading(false),
        onSuccess: () => {
            setLoading(false);
            manage(shareId);
        },
    });

    return (
        <SidebarModal onClose={close} open>
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
                                onClick={close}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                            </Button>,

                            <Button
                                key="modal-submit-button"
                                type="submit"
                                color="norm"
                                pill
                                disabled={loading || !form.isValid || !form.dirty}
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
