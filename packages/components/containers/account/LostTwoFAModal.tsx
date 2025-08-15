import { useState } from 'react';

import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { disableTotp, removeSecurityKey } from '@proton/shared/lib/api/settings';
import { lockSensitiveSettings } from '@proton/shared/lib/api/user';
import { getHasFIDO2SettingEnabled } from '@proton/shared/lib/settings/twoFactor';
import { getId } from '@proton/shared/lib/webauthn/id';
import noop from '@proton/utils/noop';

import ReauthUsingRecoveryModal from './ReauthUsingRecoveryModal';

interface Props extends ModalProps {
    availableRecoveryMethods: ('mnemonic' | 'email' | 'sms')[];
}

enum STEP {
    PROMPT,
    RECOVERY_MODAL,
}

const LostTwoFAModal = ({ availableRecoveryMethods, onClose, ...rest }: Props) => {
    const api = useApi();
    const { createNotification, clearNotifications } = useNotifications();
    const [step, setStep] = useState(STEP.PROMPT);
    const dispatch = useDispatch();

    const [userSettings] = useUserSettings();

    const registeredKeys = userSettings['2FA']?.RegisteredKeys || [];
    const hasFIDO2Enabled = getHasFIDO2SettingEnabled(userSettings);

    if (step === STEP.RECOVERY_MODAL) {
        return (
            <ReauthUsingRecoveryModal
                onClose={onClose}
                {...rest}
                title={c('Title').t`Disable two-factor authentication`}
                availableRecoveryMethods={availableRecoveryMethods}
                onSuccess={async () => {
                    if (hasFIDO2Enabled) {
                        const keys = registeredKeys.map((RegisteredKey) => ({
                            id: getId(RegisteredKey),
                            name: RegisteredKey.Name,
                        }));
                        await Promise.all(
                            keys.map((key) => {
                                return api(removeSecurityKey(key.id, { PersistPasswordScope: true })).catch(noop);
                            })
                        );
                    }

                    await api(disableTotp());
                    await dispatch(userSettingsThunk({ cache: CacheType.None }));
                    await api(lockSensitiveSettings()).catch(noop);

                    clearNotifications();
                    createNotification({ text: c('Info').t`2FA disabled` });
                }}
            />
        );
    }

    return (
        <Prompt
            {...rest}
            title={c('Title').t`Disable two-factor authentication?`}
            onClose={onClose}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        setStep(STEP.RECOVERY_MODAL);
                    }}
                >
                    {c('Action').t`Continue`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <div>{c('Info').t`Use a recovery method to disable your two-factor authentication methods.`}</div>
            {hasFIDO2Enabled && (
                <div className="mt-4">
                    {c('Info')
                        .t`This will disable two-factor authentication, including both the authenticator app and security key methods.`}
                </div>
            )}
        </Prompt>
    );
};

export default LostTwoFAModal;
