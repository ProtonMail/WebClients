import { useMemo } from 'react';

import { c } from 'ttag';

import { ButtonLike, CircleLoader } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import {
    AppLink,
    FreeUpgradeBanner,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    getRetentionLabel,
    useModalTwoStatic,
    useUser,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getIsOwner } from '@proton/shared/lib/drive/permissions';
import type { RevisionRetentionDaysSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import type { DecryptedLink } from '../../../store';
import { useUserSettings } from '../../../store';
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

const RevisionsModalContent = () => {
    const [{ hasPaidDrive }] = useUser();
    const { revisionRetentionDays } = useUserSettings();
    const { isLoading, currentRevision, permissions, categorizedRevisions } = useRevisionsProvider();
    const isOwner = useMemo(() => getIsOwner(permissions), [permissions]);
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
    return useModalTwoStatic(RevisionsModal);
};
