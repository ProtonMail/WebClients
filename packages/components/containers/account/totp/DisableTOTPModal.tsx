import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { disableTotp } from '@proton/shared/lib/api/settings';
import { getHasFIDO2SettingEnabled } from '@proton/shared/lib/settings/twoFactor';

import { getSecurityKeySigningWarning } from './getSecurityKeySigningWarning';

const DisableTOTPModal = ({ onClose, ...rest }: ModalProps) => {
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();

    const [userSettings] = useUserSettings();
    const hasFIDO2Enabled = getHasFIDO2SettingEnabled(userSettings);
    const registeredKeys = userSettings['2FA']?.RegisteredKeys || [];

    const hasSecurityKeys = hasFIDO2Enabled && registeredKeys.length;

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    scope="password"
                    config={disableTotp()}
                    {...authModalProps}
                    onCancel={onClose}
                    onSuccess={async () => {
                        await withLoading(dispatch(userSettingsThunk({ cache: CacheType.None })));
                        onClose?.();
                        createNotification({ text: c('Info').t`Authenticator app 2FA disabled` });
                    }}
                />
            )}
            <Prompt
                {...rest}
                title={c('Title').t`Disable authenticator app 2FA`}
                onClose={onClose}
                buttons={[
                    <Button
                        loading={loading}
                        color="danger"
                        onClick={() => {
                            setAuthModalOpen(true);
                        }}
                    >
                        {c('Action').t`Disable`}
                    </Button>,
                    <Button disabled={loading} onClick={onClose}>
                        {c('Action').t`Cancel`}
                    </Button>,
                ]}
            >
                {hasSecurityKeys
                    ? getSecurityKeySigningWarning()
                    : c('Info')
                          .t`Disabling authenticator app 2FA will make your account less secure. Only proceed if absolutely necessary.`}
            </Prompt>
        </>
    );
};

export default DisableTOTPModal;
