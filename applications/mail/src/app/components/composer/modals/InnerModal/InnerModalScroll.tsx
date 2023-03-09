import { ReactNode, Ref, forwardRef } from 'react';

import { ScrollShadows } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

interface Props {
    children: ReactNode;
    className?: string;
}
const InnerModalScroll = forwardRef<HTMLDivElement, Props>(
    ({ children, className = '' }: Props, ref: Ref<HTMLDivElement>) => {
        return (
            <div ref={ref} className={clsx(['inner-modal-content-inner', className])}>
                <ScrollShadows>{children}</ScrollShadows>
            </div>
        );
    }
);

InnerModalScroll.displayName = 'InnerModalScroll';

export default InnerModalScroll;
