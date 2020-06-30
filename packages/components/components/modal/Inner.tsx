import React from 'react';
import { classnames } from '../../helpers/component';
import ScrollShadows from '../scroll/ScrollShadows';

interface Props {
    children: React.ReactNode;
    className?: string;
}
const Inner = ({ children, className = '' }: Props) => {
    return (
        <div className={classnames(['pm-modalContentInner', className])}>
            <ScrollShadows>{children}</ScrollShadows>
        </div>
    );
};

export default Inner;
