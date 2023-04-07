import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import {
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    RevisionsUpgradeBanner,
    useModalTwo,
    useUser,
} from '@proton/components';

import { DecryptedLink } from '../../../store';
import { RevisionList, RevisionsProvider, useRevisionsProvider } from '../../revisions';

import './RevisionsModal.scss';

interface Props {
    link: DecryptedLink;
}

const RevisionsModalContent = () => {
    const [user] = useUser();
    const { isLoading, currentRevision, categorizedRevisions } = useRevisionsProvider();
    return (
        <>
            {!user.hasPaidDrive ? <RevisionsUpgradeBanner /> : null}
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
            <ModalTwoHeader title={c('Info').t`Version history: Yearly report`} />
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
