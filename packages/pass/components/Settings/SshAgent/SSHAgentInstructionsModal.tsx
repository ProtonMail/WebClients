import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import windowsScreenshot from '../../../assets/settings/windows_openssh.png';
import type { Maybe } from '../../../types';
import { useSwitchableSessionCount } from '../../Core/SessionsProvider';
import { ClickToCopy } from '../../Form/Field/Control/ClickToCopy';
import { PassModal } from '../../Layout/Modal/PassModal';

type SSHAgentInstructionsValues = { dontShowAgain: boolean };

type Props = {
    socketPath: Maybe<string>;
    onClose: () => void;
    onCancel: () => void;
    onDone: (dontShowAgain: boolean) => void;
    hideFooter?: boolean;
};
const FORM_ID = 'ssh-agent-instructions';

export const SSHAgentInstructionsModal: FC<Props> = ({ socketPath, onClose, onCancel, onDone, hideFooter = false }) => {
    const hasMultiSessions = useSwitchableSessionCount() > 1;

    const commandToCopy = `export SSH_AUTH_SOCK=${socketPath ?? '~/.ssh/proton-pass-ssh-agent.sock'}`;
    const gitSshCommand = 'git config --global core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe"';
    const gitSigningCommand = 'git config --global gpg.ssh.program "C:/Windows/System32/OpenSSH/ssh-keygen.exe"';
    const isWindowsBuild = BUILD_TARGET === 'win32';

    const form = useFormik<SSHAgentInstructionsValues>({
        initialValues: { dontShowAgain: true },
        onSubmit: ({ dontShowAgain }) => onDone(dontShowAgain),
    });

    return (
        <PassModal
            open={true}
            onClose={onClose}
            size={isWindowsBuild ? 'xlarge' : 'medium'}
            className={clsx(hideFooter && 'pb-4')}
        >
            <ModalHeader title={c('Title').t`Setup ${PASS_APP_NAME} SSH Agent`} />
            <ModalContent>
                {!isWindowsBuild && (
                    <div className="flex flex-column gap-4">
                        <div>{c('Info').t`Paste the following command in your terminal:`}</div>
                        <ClickToCopy value={commandToCopy}>
                            <code className="text-small bg-weak color-weak">{commandToCopy}</code>
                        </ClickToCopy>
                        <div className="color-weak ">
                            {c('Info')
                                .t`Tip: add it to your .bashrc or .zshrc file so it runs automatically when you open the terminal.`}
                        </div>
                    </div>
                )}
                {isWindowsBuild && (
                    <div className="color-weak flex-col gap-2">
                        <div>{c('Info')
                            .t`To use ${PASS_APP_NAME} SSH agent on Windows, the OpenSSH service must be disabled.`}</div>
                        <ol>
                            <li>
                                {c('Info')
                                    .t`Open "Services" (you can use the Windows search bar or press Win+R and enter services.msc).`}
                            </li>
                            <li>{c('Info').t`Find "OpenSSH Authentication Agent", right-click Properties.`}</li>
                            <li>{c('Info').t`Set "Startup type" to Disabled, click OK.`}</li>
                        </ol>
                        <img src={windowsScreenshot} alt={c('Title').t`Screenshot of OpenSSH service on Windows`} />
                        <div className="mt-4">
                            {c('Info')
                                .t`To make Git work with ${PASS_APP_NAME} SSH agent, Git must use Windows OpenSSH. This can be done by running this command:`}
                        </div>
                        <ClickToCopy value={gitSshCommand}>
                            <code className="text-small bg-weak color-weak">{gitSshCommand}</code>
                        </ClickToCopy>
                        <div className="mt-4">
                            {c('Info').t`If you sign your Git commits with your SSH key, also run this command:`}
                        </div>
                        <ClickToCopy value={gitSigningCommand}>
                            <code className="text-small bg-weak color-weak">{gitSigningCommand}</code>
                        </ClickToCopy>
                    </div>
                )}

                <Banner noIcon className="mt-4">
                    <div className="text-sm color-weak">
                        {c('Info')
                            .t`Make sure to keep ${PASS_APP_NAME} running (can be minimized) for the SSH agent to stay active. SSH keys with passphrase are currently not supported.`}
                    </div>
                </Banner>

                {hasMultiSessions && (
                    <Banner variant={BannerVariants.WARNING} noIcon className="mt-4">
                        <div className="text-sm color-weak">
                            {c('Info')
                                .t`If you do not plan to use the SSH agent on another paid account, remember to disable this setting before switching to that account.`}
                        </div>
                    </Banner>
                )}

                {!hideFooter && (
                    <FormikProvider value={form}>
                        <Form id={FORM_ID}>
                            <Checkbox
                                className="pass-checkbox--unset gap-0 my-2 color-weak"
                                checked={form.values.dontShowAgain}
                                onChange={({ target }) => form.setFieldValue('dontShowAgain', target.checked)}
                            >
                                {c('Action').t`Do not show this again`}
                            </Checkbox>
                        </Form>
                    </FormikProvider>
                )}
            </ModalContent>
            {!hideFooter && (
                <ModalFooter>
                    <Button onClick={onCancel}>{c('Action').t`Cancel`}</Button>
                    <Button type="submit" color="norm" form={FORM_ID}>
                        {c('Action').t`Done`}
                    </Button>
                </ModalFooter>
            )}
        </PassModal>
    );
};
