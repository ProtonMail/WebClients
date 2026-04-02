import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import {
    AppLink,
    FreeUpgradeBanner,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    getRetentionLabel,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import type { RevisionRetentionDaysSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useUserSettings } from '../../hooks/user';
import { RevisionList } from './revisions/RevisionList';
import type { RevisionsModalContentViewProps, RevisionsProviderState } from './useRevisionsModalState';

import './RevisionsModal.scss';

const RevisionsSettingsBanner = ({
    revisionRetentionDays,
}: {
    revisionRetentionDays: RevisionRetentionDaysSetting;
}) => {
    const retentionLabel = getRetentionLabel(revisionRetentionDays);
    return (
        <div className="flex items-center justify-space-between">
            <p className="m-0 color-weak">
                {revisionRetentionDays === 0
                    ? c('Info').t`Previous versions are not saved`
                    : c('Info').t`Previous versions are kept for ${retentionLabel}`}
            </p>
            <ButtonLike
                as={AppLink}
                to="/drive/version-history"
                toApp={APPS.PROTONACCOUNT}
                shape="solid"
                size="small"
            >{c('Action').t`Change`}</ButtonLike>
        </div>
    );
};

const RevisionsModalContent = ({
    isLoading,
    currentRevision,
    isOwner,
    categorizedRevisions,
    hasPreviewAvailable,
    openRevisionPreview,
    openRevisionDetails,
    deleteRevision,
    restoreRevision,
    downloadRevision,
}: RevisionsProviderState) => {
    const [{ hasPaidDrive }] = useUser();
    const { revisionRetentionDays } = useUserSettings();

    return (
        <>
            {isOwner &&
                (hasPaidDrive ? (
                    <RevisionsSettingsBanner revisionRetentionDays={revisionRetentionDays} />
                ) : (
                    <FreeUpgradeBanner />
                ))}
            {isLoading && <CircleLoader className="w-full m-auto mt-5" size="large" />}
            {!isLoading && currentRevision ? (
                <RevisionList
                    currentRevision={currentRevision}
                    categorizedRevisions={categorizedRevisions}
                    hasPreviewAvailable={hasPreviewAvailable}
                    isOwner={isOwner}
                    openRevisionPreview={openRevisionPreview}
                    openRevisionDetails={openRevisionDetails}
                    deleteRevision={deleteRevision}
                    restoreRevision={restoreRevision}
                    downloadRevision={downloadRevision}
                />
            ) : null}
        </>
    );
};

export const RevisionsModalView = ({
    hasPreviewAvailable,
    isLoading,
    isOwner,
    currentRevision,
    categorizedRevisions,
    openRevisionPreview,
    openRevisionDetails,
    deleteRevision,
    restoreRevision,
    downloadRevision,
    portalPreview,
    confirmModal,
    detailsModal,
    ...modalProps
}: RevisionsModalContentViewProps) => {
    return (
        <>
            <ModalTwo size="large" {...modalProps}>
                <ModalTwoHeader title={c('Title').t`Version history`} />
                <ModalTwoContent className="mb-8">
                    <RevisionsModalContent
                        hasPreviewAvailable={hasPreviewAvailable}
                        isLoading={isLoading}
                        isOwner={isOwner}
                        currentRevision={currentRevision}
                        categorizedRevisions={categorizedRevisions}
                        openRevisionPreview={openRevisionPreview}
                        openRevisionDetails={openRevisionDetails}
                        deleteRevision={deleteRevision}
                        restoreRevision={restoreRevision}
                        downloadRevision={downloadRevision}
                    />
                </ModalTwoContent>
            </ModalTwo>
            {portalPreview}
            {confirmModal}
            {detailsModal}
        </>
    );
};
