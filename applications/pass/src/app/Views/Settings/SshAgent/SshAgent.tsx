import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { sshAgent } from 'proton-pass-web/lib/ssh-agent';
import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import useNotifications from '@proton/components/hooks/useNotifications';
import { InfoButton } from '@proton/pass/components/Layout/Button/InfoButton';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { selectVisibleNonTrashedSshKeyItems } from '@proton/pass/store/selectors/items';
import { type Maybe, SpotlightMessage } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { logger } from '@proton/pass/utils/logger';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { SSHAgentInstructionsModal } from './SSHAgentInstructionsModal';

const SshAgentDesktop: FC = () => {
    const { createNotification } = useNotifications();
    const sshKeys = useSelector(selectVisibleNonTrashedSshKeyItems);
    const instructionsSpotlight = useSpotlightFor(SpotlightMessage.SSH_AGENT_INSTRUCTIONS);

    const [socketPath, setSocketPath] = useState<Maybe<string>>(undefined);
    const [modal, setModal] = useState<{ show: true; hideFooter: boolean } | { show: false }>({
        show: false,
    });
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;

    const [loading, setLoading] = useState(false);
    const enabled = Boolean(socketPath);
    const bridge = window.ctxBridge!;

    const updateStatus = useCallback(async () => {
        try {
            const status = await bridge.getSshAgentStatus();
            setSocketPath(status.socketPath);
        } catch (error) {
            logger.error('[SSH agent] Could not get status:', error);
            setSocketPath(undefined);
        }
    }, []);

    const handleSshAgentToggle = async () => {
        setLoading(true);
        try {
            if (enabled) {
                await bridge.setSshAgentSettingEnabled(false);
                await sshAgent?.stop();
                await updateStatus();
                createNotification({ text: c('Success').t`SSH agent successfully stopped` });
            } else {
                await sshAgent?.start();
                await sshAgent?.sync(sshKeys);
                await updateStatus();
                await bridge.setSshAgentSettingEnabled(true);
                createNotification({ text: c('Success').t`SSH agent successfully started` });
                if (instructionsSpotlight.open) {
                    setModal({ show: true, hideFooter: false });
                }
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            createNotification({
                text: enabled
                    ? c('Error').t`Failed to stop SSH agent: ${errorMessage}`
                    : c('Error').t`Failed to start SSH agent: ${errorMessage}`,
                type: 'error',
            });
            logger.error(`[SSH agent] Could not toggle`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleModalCancel = async () => {
        setModal({ show: false });
        await bridge.setSshAgentSettingEnabled(false);
        await sshAgent?.stop();
        await updateStatus();
    };

    const handleModalClose = () => setModal({ show: false });

    const handleModalDone = (dontShowAgain?: boolean) => {
        handleModalClose();
        if (dontShowAgain) instructionsSpotlight.close();
    };

    const handleInfoClick = () => setModal({ show: true, hideFooter: true });

    useEffect(() => {
        void updateStatus();
    }, [updateStatus]);

    return (
        <SettingsPanel
            title={c('Title').t`SSH Agent`}
            {...(isFreePlan
                ? {
                      contentClassname: 'opacity-50 py-4',
                      actions: [
                          <UpgradeButton upsellRef={UpsellRef.SSH_AGENT} inline className="text-sm" key="upgrade" />,
                      ],
                      subTitle: c('Warning').t`SSH agent requires using SSH keys, which is not available in your plan.`,
                  }
                : {})}
        >
            <div className="flex flex-column gap-2">
                <div className="flex items-start items-center gap-2">
                    <Checkbox
                        id="ssh-agent-checkbox"
                        checked={enabled}
                        onChange={handleSshAgentToggle}
                        loading={loading}
                        // Free plan should never have this enabled in the first place, but still
                        // allow user to disable (e.g after downgrade)
                        disabled={isFreePlan && !enabled}
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-1">
                            <label htmlFor="ssh-agent-checkbox" className="cursor-pointer">
                                {c('Label').t`Use ${PASS_APP_NAME} as SSH agent`}
                            </label>
                            <InfoButton onClick={handleInfoClick} />
                        </div>
                        <span className="block color-weak text-sm">
                            {c('Info').t`${PASS_APP_NAME} will use the SSH keys saved in your vaults.`}
                        </span>
                    </div>
                </div>
                {sshKeys.length === 0 && (
                    <div className="text-sm color-weak">
                        {c('Info')
                            .t`No SSH keys found in ${PASS_SHORT_APP_NAME}. Create SSH key items to use with the agent.`}
                    </div>
                )}
                {modal.show && (
                    <SSHAgentInstructionsModal
                        socketPath={socketPath}
                        onClose={handleModalClose}
                        onCancel={handleModalCancel}
                        onDone={handleModalDone}
                        hideFooter={modal.hideFooter}
                    />
                )}
            </div>
        </SettingsPanel>
    );
};

export const SshAgent: FC = () => {
    if (!DESKTOP_BUILD) return null;
    return <SshAgentDesktop />;
};
