import React, { Ref } from 'react';
import { classnames } from '../../helpers';
import ScrollShadows from '../scroll/ScrollShadows';

interface Props {
    children: React.ReactNode;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
const Inner = ({ children, className = '', ref }: Props) => {
    return (
        <div ref={ref} className={classnames(['modal-content-inner', className])}>
            <ScrollShadows>{children}</ScrollShadows>
        </div>
    );
};

export default Inner;
