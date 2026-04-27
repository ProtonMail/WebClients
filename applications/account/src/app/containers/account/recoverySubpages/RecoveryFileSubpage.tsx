import { c } from 'ttag';

import { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import { useUpdateRecoveryFile } from '@proton/account/recovery/useUpdateRecoveryFile';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import ExportRecoveryFileButton from '@proton/components/containers/recovery/ExportRecoveryFileButton';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcTrashCross } from '@proton/icons/icons/IcTrashCross';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { RECOVERY_FILE_FILE_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import illustration from './assets/recovery-file.svg';
import PasswordResetOptionRequiredWarning from './shared/PasswordResetOptionRequiredWarning';

const RecoveryFileSubpage = ({ emailSubpagePath }: { emailSubpagePath: string }) => {
    const recoveryFileData = useSelector(selectRecoveryFileData);
    const updateRecoveryFile = useUpdateRecoveryFile(recoveryFileData);

    if (!recoveryFileData.isRecoveryFileAvailable) {
        return null;
    }

    const learnMoreLink = (
        <Href key="learn" href={getKnowledgeBaseUrl('/recover-encrypted-messages-files')}>{c('Link')
            .t`Learn more`}</Href>
    );

    return (
        <>
            {updateRecoveryFile.el}
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
                    <PasswordResetOptionRequiredWarning emailSubpagePath={emailSubpagePath} />
                    <DashboardCardContent>
                        <h3 className="mb-0 text-rg text-semibold mb-2">{c('Title').t`Your recovery file`}</h3>
                        <span className="block mt-0 mb-2 text-ellipsis">{RECOVERY_FILE_FILE_NAME}</span>
                        <ExportRecoveryFileButton className="block" color="norm">
                            <IcArrowDownLine size={4} />
                            {recoveryFileData.hasOutdatedRecoveryFile
                                ? c('Action').t`Download updated file`
                                : c('Action').t`Download`}
                        </ExportRecoveryFileButton>
                        {recoveryFileData.canRevokeRecoveryFiles && (
                            <div className="fade-in">
                                <DashboardCardDivider />
                                <Button
                                    color="danger"
                                    shape="outline"
                                    onClick={() => updateRecoveryFile.voidFiles()}
                                    className="inline-flex gap-2 items-center"
                                >
                                    <IcTrashCross className="shrink-0 color-danger" />
                                    {c('Action').t`Void all recovery files`}
                                </Button>
                            </div>
                        )}
                        {recoveryFileData.hasOutdatedRecoveryFile && (
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
