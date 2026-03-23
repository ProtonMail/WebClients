import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader, useModalTwoStatic } from '@proton/components';

import type { DecryptedLink } from '../../../store';
import { RevisionList, RevisionsProvider, useRevisionsProvider } from '../../revisions';

import './RevisionsModal.scss';

interface Props {
    link: DecryptedLink;
}

const RevisionsModalContent = () => {
    const { isLoading, currentRevision, categorizedRevisions } = useRevisionsProvider();
    return (
        <>
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
