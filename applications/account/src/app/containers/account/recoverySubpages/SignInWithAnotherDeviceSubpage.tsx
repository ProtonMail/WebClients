import { c } from 'ttag';

import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import { userSettingsActions } from '@proton/account/userSettings';
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
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks/index';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateFlags } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { EDM_VALUE, type UserSettings } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import illustration from './assets/recovery-qr-code.svg';
import RecoveryWarning from './shared/RecoveryWarning';
import SentinelWarning from './shared/SentinelWarning';

const SignInWithAnotherDeviceSubpage = () => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();
    const [loadingEDM, withLoadingEDM] = useLoading();
    const dispatch = useDispatch();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [modalProps, setModalState, renderModalState] = useModalState();

    const handleEDMToggle = async (value: EDM_VALUE) => {
        await api<{ UserSettings: UserSettings }>(updateFlags({ EdmOptOut: value }));
        dispatch(userSettingsActions.update({ UserSettings: { Flags: { EdmOptOut: value } } }));
        createNotification({
            type: 'info',
            text:
                value === EDM_VALUE.DISABLED
                    ? c('edm').t`QR code sign-in disabled`
                    : c('edm').t`QR code sign-in enabled`,
        });

        if (value === EDM_VALUE.ENABLED) {
            sendRecoverySettingEnabled({ setting: 'qr_code_sign_in' });
        }
    };

    const allowScanningQrCode = !userSettings?.Flags.EdmOptOut;

    const learnMoreLink = (
        <Href key="learn" href={getKnowledgeBaseUrl('/qr-code-sign-in')}>{c('Link').t`Learn more`}</Href>
    );

    if (loadingUserSettings || loadingIsSentinelUser) {
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
                                {learnMoreLink}
                            </SettingsDescriptionItem>
                        </>
                    }
                    right={
                        <img src={illustration} alt="" className="shrink-0 hidden md:block" width={80} height={80} />
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
                                    {isSentinelUser && <IcShieldExclamationFilled className="color-warning shrink-0" />}
                                </SettingsToggleRow.Label>
                            }
                            toggle={
                                <SettingsToggleRow.Toggle
                                    loading={loadingEDM}
                                    checked={allowScanningQrCode}
                                    onChange={({ target: { checked } }) =>
                                        withLoadingEDM(
                                            handleEDMToggle(!checked ? EDM_VALUE.DISABLED : EDM_VALUE.ENABLED).catch(
                                                noop
                                            )
                                        )
                                    }
                                />
                            }
                        />
                        {!allowScanningQrCode && !isSentinelUser && <RecoveryWarning />}
                        {allowScanningQrCode && isSentinelUser && (
                            <SentinelWarning
                                text={c('Info')
                                    .t`To ensure the highest possible security of your account, disable **QR code sign-in**.`}
                            />
                        )}
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};

export default SignInWithAnotherDeviceSubpage;
