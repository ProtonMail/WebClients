import React, { Ref } from 'react';
import { classnames } from '../../helpers';
import ScrollShadows from '../scroll/ScrollShadows';

interface Props {
    children: React.ReactNode;
    className?: string;
}
const Inner = React.forwardRef<HTMLDivElement, Props>(
    ({ children, className = '' }: Props, ref: Ref<HTMLDivElement>) => {
        return (
            <div ref={ref} className={classnames(['modal-content-inner', className])}>
                <ScrollShadows>{children}</ScrollShadows>
            </div>
        );
    }
);

export default Inner;
