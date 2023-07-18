import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, type ModalProps } from '@proton/components/components';
import { selectVaultLimits } from '@proton/pass/store';
import type { VaultShare } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp';
import noop from '@proton/utils/noop';

import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';
import { UpgradeButton } from '../../../shared/components/upgrade/UpgradeButton';
import { PanelHeader } from '../../components/Panel/Header';
import { Panel } from '../../components/Panel/Panel';
import { VaultEdit, FORM_ID as VaultEditFormId } from './Vault.edit';
import { type VaultFormConsumerProps } from './Vault.form';
import { VaultNew, FORM_ID as VaultNewFormId } from './Vault.new';

export type Props = {
    payload:
        | { type: 'new' }
        | {
              type: 'edit';
              vault: VaultShare;
          };
} & ModalProps;

export const VaultModal: FC<Props> = ({ payload, onClose = noop, ...props }) => {
    const [loading, setLoading] = useState(false);
    const [canSubmit, setCanSubmit] = useState(payload.type === 'edit');
    const { vaultLimitReached } = useSelector(selectVaultLimits);

    const vaultViewProps = useMemo<VaultFormConsumerProps>(
        () => ({
            onSubmit: () => setLoading(true),
            onFailure: () => setLoading(false),
            onSuccess: pipe(
                onClose,
                tap(() => setLoading(false))
            ),
            onFormValidChange: setCanSubmit,
        }),
        []
    );

    const canProcessSubmit = !vaultLimitReached || payload.type === 'edit';

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
                                disabled={loading}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                            </Button>,

                            canProcessSubmit ? (
                                <Button
                                    key="modal-submit-button"
                                    type="submit"
                                    form={payload.type === 'new' ? VaultNewFormId : VaultEditFormId}
                                    color="norm"
                                    pill
                                    loading={loading}
                                    disabled={!canSubmit || loading}
                                >
                                    {(() => {
                                        switch (payload.type) {
                                            case 'new':
                                                return loading
                                                    ? c('Action').t`Creating vault`
                                                    : c('Action').t`Create vault`;
                                            case 'edit':
                                                return loading ? c('Action').t`Saving` : c('Action').t`Save`;
                                        }
                                    })()}
                                </Button>
                            ) : (
                                <UpgradeButton key="upgrade-button" />
                            ),
                        ]}
                    />
                }
            >
                {payload.type === 'new' && <VaultNew {...vaultViewProps} />}
                {payload.type === 'edit' && <VaultEdit vault={payload.vault} {...vaultViewProps} />}
            </Panel>
        </SidebarModal>
    );
};
