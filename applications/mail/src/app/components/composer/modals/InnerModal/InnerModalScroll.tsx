import { ReactNode, Ref, forwardRef } from 'react';

import { ScrollShadows, classnames } from '@proton/components';

interface Props {
    children: ReactNode;
    className?: string;
}
const InnerModalScroll = forwardRef<HTMLDivElement, Props>(
    ({ children, className = '' }: Props, ref: Ref<HTMLDivElement>) => {
        return (
            <div ref={ref} className={classnames(['inner-modal-content-inner', className])}>
                <ScrollShadows>{children}</ScrollShadows>
            </div>
        );
    }
);

InnerModalScroll.displayName = 'InnerModalScroll';

export default InnerModalScroll;
