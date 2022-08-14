import { ReactNode, Ref, forwardRef } from 'react';

import { classnames } from '../../helpers';
import ScrollShadows from '../scroll/ScrollShadows';

interface Props {
    children: ReactNode;
    className?: string;
}
const Inner = forwardRef<HTMLDivElement, Props>(({ children, className = '' }: Props, ref: Ref<HTMLDivElement>) => {
    return (
        <div ref={ref} className={classnames(['modal-content-inner', className])}>
            <ScrollShadows>{children}</ScrollShadows>
        </div>
    );
});

export default Inner;
