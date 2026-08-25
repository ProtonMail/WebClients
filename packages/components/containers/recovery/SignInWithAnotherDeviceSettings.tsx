import { c } from 'ttag';

import { toggleQrCodeSignIn } from '@proton/account/recovery/userSettingsActions';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Href } from '@proton/atoms/Href/Href';
import { useLoading } from '@proton/hooks/index';
import { IcQrCode } from '@proton/icons/icons/IcQrCode';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import useModalState from '../../components/modalTwo/useModalState';
import { SettingsIconRow } from '../account/SettingsIconRow';
import { SettingsToggleRow } from '../account/SettingsToggleRow';
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
            <SettingsIconRow icon={IcQrCode}>
                <SettingsToggleRow
                    id="edmToggle"
                    label={
                        <>
                            {/* Cmd/Ctrl+click shortcut to open the modal; the label otherwise stays
                             * associated with the toggle */}
                            <SettingsToggleRow.Label
                                onClick={(e) => {
                                    if (allowScanningQrCode && (e.metaKey || e.ctrlKey)) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setModalState(true);
                                    }
                                }}
                            >
                                {c('edm').t`Sign in with QR code`}
                            </SettingsToggleRow.Label>
                            <SettingsToggleRow.Description>
                                {c('edm').t`Scan QR code on your mobile device to sign in.`}{' '}
                                <Href key="learn" href={getKnowledgeBaseUrl('/qr-code-sign-in')}>{c('Link')
                                    .t`Learn more`}</Href>
                            </SettingsToggleRow.Description>
                        </>
                    }
                    toggle={
                        <SettingsToggleRow.Toggle
                            loading={loadingEDM}
                            checked={allowScanningQrCode}
                            onChange={({ target: { checked } }) => withLoadingEDM(handleEDMToggle(checked).catch(noop))}
                        />
                    }
                />
            </SettingsIconRow>
        </>
    );
};

export default SignInWithAnotherDeviceSettings;
