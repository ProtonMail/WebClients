import { c } from 'ttag';

import { toggleQrCodeSignIn } from '@proton/account/recovery/userSettingsActions';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Info from '@proton/components/components/link/Info';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import SignInWithAnotherDeviceModal from './SignInWithAnotherDeviceModal';
import { useRecoverySettingsTelemetry } from './recoverySettingsTelemetry';

const SignInWithAnotherDeviceSettings = () => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [userSettings] = useUserSettings();
    const [loadingEDM, withLoadingEDM] = useLoading();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [modalProps, setModalState, renderModalState] = useModalState();

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

    const allowScanningQrCode = !userSettings?.Flags.EdmOptOut;

    return (
        <>
            {renderModalState && <SignInWithAnotherDeviceModal {...modalProps} />}
            <SettingsLayout>
                <SettingsLayoutLeft>
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- Cmd/Ctrl+click shortcut to open modal; label remains for toggle association */}
                    <label
                        className="text-semibold"
                        htmlFor="edmToggle"
                        onClick={(e) => {
                            if (allowScanningQrCode && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                e.stopPropagation();
                                setModalState(true);
                            }
                        }}
                    >
                        <span className="mr-2">{c('edm').t`Sign in with QR code`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <div className="flex items-center gap-2">
                        <Toggle
                            loading={loadingEDM}
                            checked={allowScanningQrCode}
                            id="edmToggle"
                            onChange={({ target: { checked } }) => withLoadingEDM(handleEDMToggle(checked).catch(noop))}
                        />
                        <label htmlFor="edmToggle" className="flex-1">
                            {c('edm').t`Allow QR code sign‒in`}
                            <Info
                                url={getKnowledgeBaseUrl('/qr-code-sign-in')}
                                title={c('edm').t`Scan QR code on your mobile device to sign in`}
                                className="ml-1"
                            />
                        </label>
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default SignInWithAnotherDeviceSettings;
