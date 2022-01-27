import { useCallback } from 'react';

import { useModals } from '../../../hooks';
import InsertImageModal from '../modals/InsertImageModal';

export interface ModalImageProps {
    onAddUrl: (url: string) => void;
    onAddImages: (files: File[]) => void;
}

const useModalImage = () => {
    const { createModal } = useModals();

    const showModalImage = useCallback(({ onAddImages, onAddUrl }: ModalImageProps) => {
        createModal(<InsertImageModal onAddImages={onAddImages} onAddUrl={onAddUrl} />);
    }, []);

    return showModalImage;
};

export default useModalImage;
