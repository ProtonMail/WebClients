import { useCallback } from 'react';

import { useModals } from '../../../hooks';
import InsertLinkModal from '../modals/InsertLinkModal';

export interface ModalLinkProps {
    linkLabel: string | undefined;
    linkUrl: string | undefined;
    onSubmit: (title: string, url: string) => void;
}

const useModalLink = () => {
    const { createModal } = useModals();

    const showLinkModal = useCallback(({ linkLabel, linkUrl, onSubmit }: ModalLinkProps) => {
        createModal(<InsertLinkModal linkLabel={linkLabel} linkUrl={linkUrl} onSubmit={onSubmit} />);
    }, []);

    return showLinkModal;
};

export default useModalLink;
