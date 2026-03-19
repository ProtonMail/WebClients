import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import useNotifications from '@proton/components/hooks/useNotifications';
import { ClickToCopy } from '@proton/pass/components/Form/Field/Control/ClickToCopy';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { selectSshKeyItems } from '@proton/pass/store/selectors/items';
import type { Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const SshAgent: FC = DESKTOP_BUILD
    ? () => {
          const { createNotification } = useNotifications();
          const sshKeys = useSelector(selectSshKeyItems);

          const [socketPath, setSocketPath] = useState<Maybe<string>>(undefined);

          const enabled = Boolean(socketPath);

          const { getSshAgentStatus, sendSshKeyItems, stopSshAgent, startSshAgent } = window.ctxBridge!;

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
                      await sendSshKeyItems(sshKeys);
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
              } else {
                  await handleStartAgent();
              }
              //   dispatch(settingsEditIntent('ssh-agent', { sshAgentEnabled: !enabled }));
          };

          useEffect(() => {
              void updateStatus();
          }, [updateStatus]);

          const commandToCopy = socketPath ? `export SSH_AUTH_SOCK=${socketPath}` : null;

          return (
              <SettingsPanel title={c('Title').t`SSH Agent`}>
                  <div className="flex flex-column gap-2">
                      <Checkbox checked={enabled} onChange={handleSshAgentToggle}>
                          <span>
                              {c('Label').t`Use ${PASS_APP_NAME} as SSH agent`}
                              <span className="block color-weak text-sm">
                                  {c('Info').t`${PASS_APP_NAME} will use the SSH keys saved in your vaults.`}
                              </span>
                          </span>
                      </Checkbox>
                      {sshKeys.length === 0 && (
                          <div className="text-sm color-weak">
                              {c('Info')
                                  .t`No SSH keys found in ${PASS_SHORT_APP_NAME}. Create SSH key items to use with the agent.`}
                          </div>
                      )}
                      {BUILD_TARGET !== 'windows' && commandToCopy && (
                          <div className="color-weak mt-4 flex flex-column gap-1">
                              <div>{c('Info')
                                  .t`Paste the following command in your terminal (or .bashrc / .zshrc file) to use ${PASS_APP_NAME} SSH agent:`}</div>
                              <ClickToCopy value={commandToCopy}>
                                  <code className="text-small bg-weak">{commandToCopy}</code>
                              </ClickToCopy>
                          </div>
                      )}
                      {BUILD_TARGET === 'windows' && enabled && (
                          <div className="color-weak mt-4 flex-col gap-1">
                              <div>{`To use ${PASS_APP_NAME} SSH agent on Windows, the OpenSSH service must be disabled.`}</div>
                              <ol className="mt-2 mb-0">
                                  <li>
                                      {c('Info')
                                          .t`Open "Services" (you can use the Windows search bar or press Win+R and enter services.msc).`}
                                  </li>
                                  <li>{c('Info').t`Find "OpenSSH Authentication Agent", right-click Properties.`}</li>
                                  <li>{c('Info').t`Set "Startup type" to Disabled, click OK.`}</li>
                              </ol>
                          </div>
                      )}
                  </div>
              </SettingsPanel>
          );
      }
    : noop;
