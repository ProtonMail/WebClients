import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, ModalStateProps, ModalTwo, ModalTwoContent, ModalTwoHeader, Tooltip } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { useUser } from '@proton/components/hooks';

import { DecryptedLink } from '../../../store';
import { RevisionList, RevisionsProvider, useRevisionsProvider } from '../../revisions';
import RevisionsModalUpgradeBanner from './RevisionsModalUpgradeBanner';

import './RevisionsModal.scss';

interface Props {
    link: DecryptedLink;
}

const RevisionsModalContent = () => {
    const [user] = useUser();
    const { isLoading, currentRevision, categorizedRevisions } = useRevisionsProvider();
    return (
        <>
            {!user.hasPaidDrive ? <RevisionsModalUpgradeBanner /> : null}
            {isLoading && <CircleLoader className="w100 mauto mt-5" size="large" />}
            {!isLoading && currentRevision ? (
                <RevisionList currentRevision={currentRevision} categorizedRevisions={categorizedRevisions} />
            ) : null}
        </>
    );
};

const RevisionsModal = ({ link, ...modalProps }: Props & ModalStateProps) => {
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
