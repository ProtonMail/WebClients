import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, type ModalProps } from '@proton/components/components';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

import { VaultEdit, FORM_ID as VaultEditFormId } from './Vault.edit';
import { type VaultFormConsumerProps } from './Vault.form';
import { VaultNew, FORM_ID as VaultNewFormId } from './Vault.new';

export type Props = {
    payload: { type: 'new'; onVaultCreated: (shareId: string) => void } | { type: 'edit'; vault: VaultShareItem };
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
                {payload.type === 'new' && <VaultNew onVaultCreated={payload.onVaultCreated} {...vaultViewProps} />}
                {payload.type === 'edit' && <VaultEdit vault={payload.vault} {...vaultViewProps} />}
            </Panel>
        </SidebarModal>
    );
};
