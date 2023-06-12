import { ReactNode, Ref, forwardRef } from 'react';

import { ScrollShadows } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

interface Props {
    children: ReactNode;
    className?: string;
}

/**
 * @deprecated Please use ModalTwo instead
 */
const Inner = forwardRef<HTMLDivElement, Props>(({ children, className = '' }: Props, ref: Ref<HTMLDivElement>) => {
    return (
        <div ref={ref} className={clsx(['modal-content-inner', className])}>
            <ScrollShadows>{children}</ScrollShadows>
        </div>
    );
});

export default Inner;
