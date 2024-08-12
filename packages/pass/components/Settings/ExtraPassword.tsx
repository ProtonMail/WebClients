import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { PasswordModal, type PasswordModalProps } from '@proton/pass/components/Lock/PasswordModal';
import { usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { validateNewExtraPassword } from '@proton/pass/lib/validation/auth';
import { extraPasswordToggle } from '@proton/pass/store/actions';
import { extraPasswordToggleRequest } from '@proton/pass/store/actions/requests';
import { selectExtraPasswordEnabled, selectLockMode } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { SettingsPanel } from './SettingsPanel';

export const ExtraPassword: FC = () => {
    const online = useConnectivity();
    const confirmPassword = usePasswordUnlock();
    const toggle = useRequest(extraPasswordToggle, { initialRequestId: extraPasswordToggleRequest() });
    const enabled = useSelector(selectExtraPasswordEnabled);
    const biometricsEnabled = useSelector(selectLockMode) === LockMode.BIOMETRICS;
    const biometricsMessage = biometricsEnabled
        ? ' ' + c('Info').t`Biometrics will be disabled and will need to be enabled again.`
        : '';

    const getInitialModalState = (): PasswordModalProps => ({
        label: c('Label').t`Extra password`,
        placeholder: c('Label').t`Extra password`,
        message:
            c('Info').t`You will be logged out and need to log in again on all of your other devices.` +
            biometricsMessage,
        submitLabel: c('Action').t`Continue`,
        title: c('Title').t`Set extra password`,
        type: 'new-password',
        warning: c('Warning')
            .t`Caution: You won’t be able to access your ${PASS_APP_NAME} account if you lose this password.`,
    });

    const modal = useAsyncModalHandles<string, PasswordModalProps>({ getInitialModalState });

    const handleExtraPasswordToggle = async () => {
        if (enabled) {
            return confirmPassword({
                onSubmit: (password) => toggle.dispatch({ password, enabled: false }),
                label: c('Label').t`Extra password`,
                placeholder: c('Label').t`Extra password`,
                message: c('Info').t`Confirm your extra password to proceed with its removal.`,
                submitLabel: c('Action').t`Confirm`,
                title: c('Title').t`Remove extra password`,
                type: 'current-password',
                warning: c('Warning')
                    .t`Removing your extra password will log you out from all devices and end all active sessions.`,
            });
        }

        return modal.handler({
            onValidate: validateNewExtraPassword,
            onSubmit: (value) =>
                modal.handler({
                    ...getInitialModalState(),
                    title: c('Title').t`Confirm extra password`,
                    submitLabel: c('Action').t`Set extra password`,
                    onValidate: (current) => validateNewExtraPassword(current, value),
                    onSubmit: (password) => toggle.dispatch({ password, enabled: true }),
                }),
        });
    };

    return (
        <SettingsPanel title={c('Label').t`Extra password`}>
            <Checkbox
                className={clsx('mb-4', !online && 'opacity-70 pointer-events-none')}
                checked={enabled}
                onChange={handleExtraPasswordToggle}
                loading={toggle.loading}
                disabled={!online}
            >
                <span>
                    {c('Label').t`Protect ${PASS_APP_NAME} with an extra password`}
                    <span className="block color-weak text-sm">
                        {c('Info')
                            .t`The extra password will be required to use ${PASS_APP_NAME}. It acts as an additional password on top of your ${BRAND_NAME} password.`}
                    </span>
                </span>
            </Checkbox>

            <PasswordModal {...modal.state} onSubmit={modal.resolver} onClose={modal.abort} key={modal.key} />
        </SettingsPanel>
    );
};
