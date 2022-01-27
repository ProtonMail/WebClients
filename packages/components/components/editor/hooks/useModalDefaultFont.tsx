import { useCallback } from 'react';

import { useModals } from '../../../hooks';
import DefaultFontModal from '../modals/DefaultFontModal';

export interface ModalDefaultFontProps {
    onChange: (nextFontFace: string, nextFontSize: number) => void;
}

const useModalDefaultFont = () => {
    const { createModal } = useModals();

    const showModalImage = useCallback(({ onChange }: ModalDefaultFontProps) => {
        createModal(<DefaultFontModal onChange={onChange} />);
    }, []);

    return showModalImage;
};

export default useModalDefaultFont;
