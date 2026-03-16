import { c } from 'ttag';

import { userThunk } from '@proton/account/user';
import { userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import ExportRecoveryFileButton from '@proton/components/containers/recovery/ExportRecoveryFileButton';
import VoidRecoveryFilesModal from '@proton/components/containers/recovery/VoidRecoveryFilesModal';
import useIsRecoveryFileAvailable from '@proton/components/hooks/recoveryFile/useIsRecoveryFileAvailable';
import useApi from '@proton/components/hooks/useApi';
import useHasOutdatedRecoveryFile from '@proton/components/hooks/useHasOutdatedRecoveryFile';
import useRecoverySecrets from '@proton/components/hooks/useRecoverySecrets';
import { useSyncDeviceRecovery } from '@proton/components/hooks/useSyncDeviceRecovery';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateDeviceRecovery } from '@proton/shared/lib/api/settingsRecovery';

const RecoveryFileSubSection = () => {
    const [userSettings] = useUserSettings();
    const dispatch = useDispatch();
    const api = useApi();

    const syncDeviceRecoveryHelper = useSyncDeviceRecovery();
    const [isRecoveryFileAvailable] = useIsRecoveryFileAvailable();

    const [voidRecoveryFilesModal, setVoidRecoveryFilesModalOpen, renderVoidRecoveryFilesModal] = useModalState();

    const hasOutdatedRecoveryFile = useHasOutdatedRecoveryFile();
    const recoverySecrets = useRecoverySecrets();
    const canRevokeRecoveryFiles = recoverySecrets.length > 0;

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
    };

    if (!isRecoveryFileAvailable) {
        return null;
    }

    return (
        <>
            {renderVoidRecoveryFilesModal && (
                <VoidRecoveryFilesModal
                    onVoid={() => handleChangeDeviceRecoveryToggle(false)}
                    deviceRecoveryEnabled={Boolean(userSettings.DeviceRecovery)}
                    {...voidRecoveryFilesModal}
                />
            )}
            <SettingsSection>
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <span className="pt-0 mb-2 md:mb-0 text-semibold">
                            <span className="mr-2">{c('Title').t`Recovery file`}</span>
                            <Info
                                title={c('Info')
                                    .t`A recovery file lets you unlock and view your data after account recovery`}
                            />
                        </span>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight>
                        <ExportRecoveryFileButton className="block" color="norm">
                            {hasOutdatedRecoveryFile
                                ? c('Action').t`Update recovery file`
                                : c('Action').t`Download recovery file`}
                        </ExportRecoveryFileButton>
                        {canRevokeRecoveryFiles && (
                            <Button
                                className="mt-4"
                                color="danger"
                                shape="underline"
                                onClick={() => setVoidRecoveryFilesModalOpen(true)}
                            >
                                {c('Action').t`Void all recovery files`}
                            </Button>
                        )}
                    </SettingsLayoutRight>
                </SettingsLayout>
                {hasOutdatedRecoveryFile && (
                    <p className="color-danger flex flex-nowrap">
                        <Icon className="mr-2 shrink-0 mt-0.5" name="exclamation-circle-filled" size={3.5} />
                        <span className="flex-1">{c('Warning')
                            .t`Your recovery file is outdated. It can't recover new data if you reset your password again.`}</span>
                    </p>
                )}
            </SettingsSection>
        </>
    );
};

export default RecoveryFileSubSection;
