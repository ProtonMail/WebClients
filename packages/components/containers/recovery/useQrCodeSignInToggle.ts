import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import { toggleQrCodeSignIn } from '@proton/account/recovery/userSettingsActions';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import { useRecoverySettingsTelemetry } from './recoverySettingsTelemetry';

/** Props for the "Sign in with QR code" toggle */
export const useQrCodeSignInToggle = () => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [userSettings] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const handleEDMToggle = async (value: boolean) => {
        await dispatch(toggleQrCodeSignIn({ value }));
        createNotification({
            type: 'info',
            text: value ? c('edm').t`QR code sign-in enabled` : c('edm').t`QR code sign-in disabled`,
        });

        if (value) {
            sendRecoverySettingEnabled({ setting: 'qr_code_sign_in' });
        }
    };

    return {
        checked: !userSettings?.Flags.EdmOptOut,
        loading,
        onChange: ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
            void withLoading(handleEDMToggle(checked).catch(noop));
        },
    };
};
