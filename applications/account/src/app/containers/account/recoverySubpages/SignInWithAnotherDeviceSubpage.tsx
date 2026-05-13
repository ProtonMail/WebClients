import { c } from 'ttag';

import { toggleQrCodeSignIn } from '@proton/account/recovery/userSettingsActions';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import SignInWithAnotherDeviceModal from '@proton/components/containers/recovery/SignInWithAnotherDeviceModal';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import darkIllustration from './assets/recovery-qr-code-dark.svg';
import illustration from './assets/recovery-qr-code.svg';
import RecoveryWarning from './shared/RecoveryWarning';

const SignInWithAnotherDeviceSubpage = () => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [userSettings, loadingUserSettings] = useUserSettings();
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

    if (loadingUserSettings) {
        return <Loader />;
    }

    return (
        <>
            {renderModalState && <SignInWithAnotherDeviceModal {...modalProps} />}
            <DashboardGrid>
                <SettingsDescription
                    left={
                        <>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`Allowing QR code sign-in will let you sign in by scanning a QR code if you forget your password. All you need is to be signed in to a ${BRAND_NAME} service on another device.`}{' '}
                            </SettingsDescriptionItem>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`This will let you quickly and safely access your ${BRAND_NAME} Account so you can change you password.`}{' '}
                                <Href key="learn" href={getKnowledgeBaseUrl('/qr-code-sign-in')}>{c('Link')
                                    .t`Learn more`}</Href>
                            </SettingsDescriptionItem>
                        </>
                    }
                    right={
                        <img
                            src={isDarkTheme ? darkIllustration : illustration}
                            alt=""
                            className="shrink-0 hidden md:block"
                            width={80}
                            height={80}
                        />
                    }
                />
                <DashboardCard>
                    <DashboardCardContent>
                        <SettingsToggleRow
                            id="edmToggle"
                            label={
                                <SettingsToggleRow.Label
                                    data-testid="account:recovery:edmToggle"
                                    onClick={(e) => {
                                        if (allowScanningQrCode && (e.metaKey || e.ctrlKey)) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setModalState(true);
                                        }
                                    }}
                                >
                                    {c('Label').t`Allow QR code sign-in`}
                                </SettingsToggleRow.Label>
                            }
                            toggle={
                                <SettingsToggleRow.Toggle
                                    loading={loadingEDM}
                                    checked={allowScanningQrCode}
                                    onChange={({ target: { checked } }) =>
                                        withLoadingEDM(handleEDMToggle(checked).catch(noop))
                                    }
                                />
                            }
                        />
                        {!allowScanningQrCode && <RecoveryWarning />}
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};

export default SignInWithAnotherDeviceSubpage;
