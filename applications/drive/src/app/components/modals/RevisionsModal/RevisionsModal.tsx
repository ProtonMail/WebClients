import { c } from 'ttag';

import { ButtonLike, CircleLoader } from '@proton/atoms';
import {
    AppLink,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    RevisionsUpgradeBanner,
    getRetentionLabel,
    useModalTwo,
    useUser,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { RevisionRetentionDaysSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { DecryptedLink, useUserSettings } from '../../../store';
import { RevisionList, RevisionsProvider, useRevisionsProvider } from '../../revisions';

import './RevisionsModal.scss';

interface Props {
    link: DecryptedLink;
}

const RevisionsSettingsBanner = ({
    revisionRetentionDays,
}: {
    revisionRetentionDays: RevisionRetentionDaysSetting;
}) => {
    const retentionLabel = getRetentionLabel(revisionRetentionDays);
    return (
        <div className="flex flex-align-items-center flex-justify-space-between">
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

const RevisionsModalContent = () => {
    const [{ hasPaidDrive }] = useUser();
    const { revisionRetentionDays } = useUserSettings();
    const { isLoading, currentRevision, categorizedRevisions } = useRevisionsProvider();
    return (
        <>
            {hasPaidDrive ? (
                <RevisionsSettingsBanner revisionRetentionDays={revisionRetentionDays} />
            ) : (
                <RevisionsUpgradeBanner />
            )}
            {isLoading && <CircleLoader className="w-full m-auto mt-5" size="large" />}
            {!isLoading && currentRevision ? (
                <RevisionList currentRevision={currentRevision} categorizedRevisions={categorizedRevisions} />
            ) : null}
        </>
    );
};

const RevisionsModal = ({ link, ...modalProps }: Props & ModalStateProps) => {
    return (
        <ModalTwo size="large" {...modalProps}>
            <ModalTwoHeader title={c('Title').t`Version history`} />
            <ModalTwoContent className="mb-8">
                <RevisionsProvider link={link}>
                    <RevisionsModalContent />
                </RevisionsProvider>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default RevisionsModal;

export const useRevisionsModal = () => {
    return useModalTwo<Props, void>(RevisionsModal, false);
};
