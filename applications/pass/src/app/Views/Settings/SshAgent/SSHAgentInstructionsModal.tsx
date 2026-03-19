import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { useSessions } from 'proton-pass-web/app/Auth/AuthSwitchProvider';
import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import windowsScreenshot from '@proton/pass/assets/settings/windows_openssh.png';
import { ClickToCopy } from '@proton/pass/components/Form/Field/Control/ClickToCopy';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import type { Maybe } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

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
    const hasMultiSessions = useSessions().length > 1;

    const commandToCopy = `export SSH_AUTH_SOCK=${socketPath ?? '~/.ssh/proton-pass-ssh-agent.sock'}`;
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
                        <div className="">{c('Info')
                            .t`Paste the following command in your terminal (or .bashrc / .zshrc file) to use ${PASS_APP_NAME} SSH agent:`}</div>
                        <ClickToCopy value={commandToCopy}>
                            <code className="text-small bg-weak color-weak">{commandToCopy}</code>
                        </ClickToCopy>
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
                    </div>
                )}

                {hasMultiSessions && (
                    <Banner variant={BannerVariants.WARNING} noIcon className="mt-4">
                        <div className="text-sm color-weak">
                            {c('Info')
                                .t`For a better user experience, the SSH agent setting is stored globally in ${PASS_APP_NAME} desktop app and not individually for each user account. You are currently logged in multiple accounts, if you do not want to use the SSH agent for a specific account, please disable this setting before switching to that account.`}
                        </div>
                    </Banner>
                )}

                <Banner noIcon className="mt-4">
                    <div className="text-sm color-weak">
                        <ul className="unstyled m-0">
                            <li>
                                {c('Info')
                                    .t`Please keep ${PASS_APP_NAME} running (it can be closed and minimized to the background) for the SSH agent to keep running.`}
                            </li>
                            <li>{c('Info').t`SSH keys with passphrase are not supported at the moment.`}</li>
                            <li>{c('Info').t`SSH keys in the trash will not be used.`}</li>
                        </ul>
                    </div>
                </Banner>

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
