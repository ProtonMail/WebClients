import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './ModalParagraph.scss';

interface ModalParagraphProps {
    children: ReactNode;
    prompt?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export const ModalParagraph = ({ children, prompt, className, style }: ModalParagraphProps) => {
    return (
        <div
            className={clsx(
                'modal-paragraph flex flex-column justify-center gap-2 text-center color-weak',
                className,
                !prompt && 'mb-6'
            )}
            style={style}
        >
            {children}
        </div>
    );
};
