import { useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, ModalStateProps, ModalTwo, ModalTwoContent, ModalTwoHeader, Tooltip } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { useUser } from '@proton/components/hooks';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DecryptedLink, useRevisionsView } from '../../../store';
import RevisionList from '../../revisions/RevisionList';
import RevisionsModalUpgradeBanner from './RevisionsModalUpgradeBanner';
import { getCategorizedRevisions } from './getCategorizedRevisions';

import './RevisionsModal.scss';

interface Props {
    link: DecryptedLink;
}

const RevisionsModal = ({ link, ...modalProps }: Props & ModalStateProps) => {
    const [user] = useUser();
    const { isLoading, revisions } = useRevisionsView(link.rootShareId, link.linkId);
    const [currentRevision, ...olderRevisions] = revisions;
    const categorizedRevisions = useMemo(() => getCategorizedRevisions(olderRevisions), [olderRevisions]);
    // TODO: Check if different mimeType is available for same revision
    const havePreviewAvailable = !!link.mimeType && isPreviewAvailable(link.mimeType, link.size);

    return (
        <ModalTwo size="large" {...modalProps}>
            <ModalTwoHeader
                title={c('Info').t`Version history: Yearly report`}
                actions={[
                    <Tooltip title="Settings">
                        <Button icon shape="ghost">
                            <Icon name="cog-wheel" />
                        </Button>
                    </Tooltip>,
                ]}
            />
            <ModalTwoContent className="mb-8">
                {!user.hasPaidDrive ? <RevisionsModalUpgradeBanner /> : null}
                {isLoading && <CircleLoader className="w100 mauto mt-5" size="large" />}
                {!isLoading && !!revisions.length ? (
                    <RevisionList
                        currentRevision={currentRevision}
                        categorizedRevisions={categorizedRevisions}
                        havePreviewAvailable={havePreviewAvailable}
                    />
                ) : null}
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default RevisionsModal;

export const useRevisionsModal = () => {
    return useModalTwo<Props, void>(RevisionsModal, false);
};
