import { c } from 'ttag';

import { userThunk } from '@proton/account/user';
import { useUser } from '@proton/account/user/hooks';
import { userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useIsRecoveryFileAvailable from '@proton/components/hooks/recoveryFile/useIsRecoveryFileAvailable';
import useApi from '@proton/components/hooks/useApi';
import { useSyncDeviceRecovery } from '@proton/components/hooks/useSyncDeviceRecovery';
import { useLoading } from '@proton/hooks';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateDeviceRecovery } from '@proton/shared/lib/api/settingsRecovery';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { getHasRecoveryMessage } from '@proton/shared/lib/recoveryFile/storage';

import illustration from './assets/device-based-recovery.svg';
import RecoveryWarning from './shared/RecoveryWarning';

const DeviceBasedRecoverySubpage = () => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [user] = useUser();
    const dispatch = useDispatch();
    const api = useApi();

    const syncDeviceRecoveryHelper = useSyncDeviceRecovery();
    const [isRecoveryFileAvailable] = useIsRecoveryFileAvailable();

    const isAvailableOnDevice = getHasRecoveryMessage(user.ID);

    const [loadingDeviceRecovery, withLoadingDeviceRecovery] = useLoading();
    const [disableModalProps, setDisableModalOpen, renderDisableModal] = useModalState();

    const handleChangeDeviceRecoveryToggle = async (checked: boolean) => {
        const DeviceRecovery = Number(checked) as 0 | 1;
        if (userSettings.DeviceRecovery === DeviceRecovery) {
            return;
        }
        await api(updateDeviceRecovery({ DeviceRecovery }));
        await syncDeviceRecoveryHelper({ DeviceRecovery });
        await Promise.all([
            dispatch(userThunk({ cache: CacheType.None })),
            dispatch(userSettingsThunk({ cache: CacheType.None })),
        ]);
        if (checked) {
            sendRecoverySettingEnabled({ setting: 'device_recovery' });
        }
    };

    const handleToggleChange = (checked: boolean) => {
        if (!checked) {
            setDisableModalOpen(true);
        } else {
            void withLoadingDeviceRecovery(handleChangeDeviceRecoveryToggle(true));
        }
    };

    if (!isRecoveryFileAvailable) {
        return null;
    }

    if (loadingUserSettings) {
        return <Loader />;
    }

    const learnMoreLink = <Href key="learn" href={getKnowledgeBaseUrl('/')}>{c('Link').t`Learn more`}</Href>;

    return (
        <>
            <DashboardGrid>
                <SettingsDescription
                    left={
                        <>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`Enabling the data backup on this device will restore access to emails, contacts, files, passwords, and any other encrypted data on your account after a password reset, simply by signing in on this device.`}{' '}
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
                            id="deviceRecoveryToggle"
                            label={
                                <SettingsToggleRow.Label data-testid="account:recovery:trustedDevice">
                                    {c('Label').t`Allow recovery using a trusted device`}
                                </SettingsToggleRow.Label>
                            }
                            toggle={
                                <SettingsToggleRow.Toggle
                                    loading={loadingDeviceRecovery}
                                    checked={!!userSettings.DeviceRecovery}
                                    onChange={({ target: { checked } }) => handleToggleChange(checked)}
                                />
                            }
                        />
                        {isAvailableOnDevice && (
                            <div className="fade-in">
                                <DashboardCardDivider />
                                <div className="flex items-center gap-2 flex-nowrap">
                                    <IcCheckmarkCircleFilled className="color-success shrink-0" />
                                    <p className="m-0">{c('Label')
                                        .t`We securely stored recovery information on this device.`}</p>
                                </div>
                            </div>
                        )}
                        {!userSettings.DeviceRecovery && <RecoveryWarning />}
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
            {renderDisableModal && (
                <Prompt
                    {...disableModalProps}
                    title={c('Title').t`Disable device data backup?`}
                    buttons={[
                        <Button
                            color="danger"
                            onClick={() => {
                                disableModalProps.onClose();
                                void withLoadingDeviceRecovery(handleChangeDeviceRecoveryToggle(false));
                            }}
                        >
                            {c('Action').t`Disable`}
                        </Button>,
                        <Button onClick={disableModalProps.onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    {c('Info')
                        .t`Disabling the data backup on this device will prevent you from automatically unlocking your encrypted data after a password reset.`}
                </Prompt>
            )}
        </>
    );
};

export default DeviceBasedRecoverySubpage;
