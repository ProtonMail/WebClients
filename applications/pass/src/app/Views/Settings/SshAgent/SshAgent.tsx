import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import useNotifications from '@proton/components/hooks/useNotifications';
import { InfoButton } from '@proton/pass/components/Layout/Button/InfoButton';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { selectVisibleNonTrashedSshKeyItems } from '@proton/pass/store/selectors/items';
import { type Maybe, SpotlightMessage } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { SSHAgentInstructionsModal } from './SSHAgentInstructionsModal';

export const SshAgent: FC = DESKTOP_BUILD
    ? () => {
          const { createNotification } = useNotifications();
          const sshKeys = useSelector(selectVisibleNonTrashedSshKeyItems);
          const instructionsSpotlight = useSpotlightFor(SpotlightMessage.SSH_AGENT_INSTRUCTIONS);

          const [socketPath, setSocketPath] = useState<Maybe<string>>(undefined);
          const [modal, setModal] = useState<{ show: true; hideFooter: boolean } | { show: false }>({
              show: false,
          });

          const enabled = Boolean(socketPath);

          const { getSshAgentStatus, setSshKeyItems, stopSshAgent, startSshAgent, setSshAgentSettingEnabled } =
              window.ctxBridge!;

          const updateStatus = useCallback(async () => {
              try {
                  const status = await getSshAgentStatus();
                  setSocketPath(status.socketPath);
              } catch (error) {
                  logger.error('[SSH agent] Could not get status:', error);
                  setSocketPath(undefined);
              }
          }, []);

          const handleStartAgent = async () => {
              try {
                  await startSshAgent();
                  logger.info('[SSH agent] Started');

                  if (sshKeys.length > 0) {
                      await setSshKeyItems(sshKeys);
                      logger.info('[SSH agent] Keys sent');
                  }

                  await updateStatus();
                  createNotification({ text: c('Notification').t`SSH agent successfully started` });
              } catch (error) {
                  createNotification({
                      text: c('Notification').t`Failed to start SSH agent: ${error}`,
                      type: 'error',
                  });
                  logger.error('[SSH agent] Could not be started:', error);
              }
          };

          const handleStopAgent = async () => {
              try {
                  await stopSshAgent();
                  await updateStatus();
                  createNotification({ text: c('Notification').t`SSH agent successfully stopped` });
              } catch (error) {
                  createNotification({
                      text: c('Notification').t`Failed to stop SSH agent: ${error}`,
                      type: 'error',
                  });
                  logger.error('[SSH agent] Could not be stopped:', error);
              }
          };

          const handleSshAgentToggle = async () => {
              if (enabled) {
                  await handleStopAgent();
                  await setSshAgentSettingEnabled(false);
              } else {
                  await handleStartAgent();
                  await setSshAgentSettingEnabled(true);
                  if (instructionsSpotlight.open) {
                      setModal({ show: true, hideFooter: false });
                  }
              }
          };

          const handleModalCancel = async () => {
              setModal({ show: false });
              await handleStopAgent();
              await setSshAgentSettingEnabled(false);
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
              <SettingsPanel title={c('Title').t`SSH Agent`}>
                  <div className="flex flex-column gap-2">
                      <div className="flex items-start items-center gap-2">
                          <Checkbox id="ssh-agent-checkbox" checked={enabled} onChange={handleSshAgentToggle} />
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
      }
    : noop;
