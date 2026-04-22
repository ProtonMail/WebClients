import { c } from 'ttag';

import { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import { useUpdateRecoveryFile } from '@proton/account/recovery/useUpdateRecoveryFile';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { useLoading } from '@proton/hooks';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import illustration from './assets/device-based-recovery.svg';
import RecoveryWarning from './shared/RecoveryWarning';

const DeviceBasedRecoverySubpage = () => {
    const recoveryFileData = useSelector(selectRecoveryFileData);
    const updateRecoveryFile = useUpdateRecoveryFile(recoveryFileData);

    const [loadingDeviceRecovery, withLoadingDeviceRecovery] = useLoading();
    const [disableModalProps, setDisableModalOpen, renderDisableModal] = useModalState();

    const handleToggleChange = (checked: boolean) => {
        if (!checked) {
            setDisableModalOpen(true);
        } else {
            void withLoadingDeviceRecovery(updateRecoveryFile.toggleDeviceRecovery(true));
        }
    };

    if (!recoveryFileData.isRecoveryFileAvailable) {
        return null;
    }

    const learnMoreLink = <Href key="learn" href={getKnowledgeBaseUrl('/')}>{c('Link').t`Learn more`}</Href>;

    return (
        <>
            {updateRecoveryFile.el}
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
                                    checked={recoveryFileData.hasDeviceRecoveryEnabled}
                                    onChange={({ target: { checked } }) => handleToggleChange(checked)}
                                />
                            }
                        />
                        {recoveryFileData.isAvailableOnDevice && (
                            <div className="fade-in">
                                <DashboardCardDivider />
                                <div className="flex items-center gap-2 flex-nowrap">
                                    <IcCheckmarkCircleFilled className="color-success shrink-0" />
                                    <p className="m-0">{c('Label')
                                        .t`We securely stored recovery information on this device.`}</p>
                                </div>
                            </div>
                        )}
                        {!recoveryFileData.hasDeviceRecoveryEnabled && <RecoveryWarning />}
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
                                void withLoadingDeviceRecovery(updateRecoveryFile.toggleDeviceRecovery(false));
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
