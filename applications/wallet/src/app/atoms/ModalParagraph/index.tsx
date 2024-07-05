import { ReactNode } from 'react';

import './ModalParagraph.scss';

export const ModalParagraph = ({ children }: { children: ReactNode }) => {
    return <div className="modal-paragraph flex flex-row gap-2 mb-6 text-center color-weak">{children}</div>;
};
