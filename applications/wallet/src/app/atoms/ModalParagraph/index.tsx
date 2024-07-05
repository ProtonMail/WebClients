import { ReactNode } from 'react';

import './ModalParagraph.scss';

export const ModalParagraph = ({ children }: { children: ReactNode }) => {
    return <div className="modal-paragraph flex flex-columns text-center mb-6 color-weak gap-2">{children}</div>;
};
