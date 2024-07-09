import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './ModalParagraph.scss';

interface ModalParagraphProps {
    children: ReactNode;
    prompt?: boolean;
}

export const ModalParagraph = ({ children, prompt }: ModalParagraphProps) => {
    return (
        <div className={clsx('modal-paragraph flex flex-row gap-2 text-center color-weak', !prompt && 'mb-6')}>
            {children}
        </div>
    );
};
