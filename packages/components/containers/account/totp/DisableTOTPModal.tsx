import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities/interface';
import { disableTotp } from '@proton/shared/lib/api/settings';
import { getHasFIDO2SettingEnabled } from '@proton/shared/lib/settings/twoFactor';

import type { ModalProps } from '../../../components/modalTwo/Modal';
import useModalState from '../../../components/modalTwo/useModalState';
import Prompt from '../../../components/prompt/Prompt';
import AuthModal from '../../password/AuthModal';
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
                title={c('Title').t`Disable two-factor authentication app?`}
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
