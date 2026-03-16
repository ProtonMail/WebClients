import { c } from 'ttag';

import { userThunk } from '@proton/account/user';
import { userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import ExportRecoveryFileButton from '@proton/components/containers/recovery/ExportRecoveryFileButton';
import VoidRecoveryFilesModal from '@proton/components/containers/recovery/VoidRecoveryFilesModal';
import useIsRecoveryFileAvailable from '@proton/components/hooks/recoveryFile/useIsRecoveryFileAvailable';
import useApi from '@proton/components/hooks/useApi';
import useHasOutdatedRecoveryFile from '@proton/components/hooks/useHasOutdatedRecoveryFile';
import useRecoverySecrets from '@proton/components/hooks/useRecoverySecrets';
import { useSyncDeviceRecovery } from '@proton/components/hooks/useSyncDeviceRecovery';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcTrashCross } from '@proton/icons/icons/IcTrashCross';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateDeviceRecovery } from '@proton/shared/lib/api/settingsRecovery';
import { RECOVERY_FILE_FILE_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import illustration from './assets/recovery-file.svg';

const RecoveryFileSubpage = () => {
    const [userSettings, loadingUserSettings] = useUserSettings();
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

    if (loadingUserSettings) {
        return <Loader />;
    }

    const learnMoreLink = <Href key="learn" href={getKnowledgeBaseUrl('/')}>{c('Link').t`Learn more`}</Href>;

    return (
        <>
            {renderVoidRecoveryFilesModal && (
                <VoidRecoveryFilesModal
                    onVoid={() => handleChangeDeviceRecoveryToggle(false)}
                    deviceRecoveryEnabled={Boolean(userSettings.DeviceRecovery)}
                    {...voidRecoveryFilesModal}
                />
            )}
            <DashboardGrid>
                <SettingsDescription
                    left={
                        <>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`Your recovery file will restore access to emails, contacts, files, passwords, and any other encrypted data on your account after a password reset.`}
                            </SettingsDescriptionItem>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`You don’t need to open or read the file—just download it and store it somewhere safe.`}{' '}
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
                        <h3 className="mb-0 text-rg text-semibold mb-2">{c('Title').t`Your recovery file`}</h3>
                        <span className="block mt-0 mb-2 text-ellipsis">{RECOVERY_FILE_FILE_NAME}</span>
                        <ExportRecoveryFileButton className="block" color="norm">
                            <IcArrowDownLine size={4} />
                            {hasOutdatedRecoveryFile ? c('Action').t`Download updated file` : c('Action').t`Download`}
                        </ExportRecoveryFileButton>
                        {canRevokeRecoveryFiles && (
                            <div className="fade-in">
                                <DashboardCardDivider />
                                <Button
                                    color="danger"
                                    shape="outline"
                                    onClick={() => setVoidRecoveryFilesModalOpen(true)}
                                    className="inline-flex gap-2 items-center"
                                >
                                    <IcTrashCross className="shrink-0 color-danger" />
                                    {c('Action').t`Void all recovery files`}
                                </Button>
                            </div>
                        )}
                        {hasOutdatedRecoveryFile && (
                            <div className="fade-in">
                                <DashboardCardDivider />
                                <p className="flex flex-nowrap gap-2 items-center m-0">
                                    <IcExclamationCircleFilled className="shrink-0 color-danger" />
                                    <span className="flex-1">{c('Warning')
                                        .t`Your recovery file is outdated. It can't recover new data if you reset your password again.`}</span>
                                </p>
                            </div>
                        )}
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};

export default RecoveryFileSubpage;
