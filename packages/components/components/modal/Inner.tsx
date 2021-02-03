import React from 'react';
import { classnames } from '../../helpers';
import ScrollShadows from '../scroll/ScrollShadows';

interface Props {
    children: React.ReactNode;
    className?: string;
}
const Inner = ({ children, className = '' }: Props) => {
    return (
        <div className={classnames(['modal-content-inner', className])}>
            <ScrollShadows>{children}</ScrollShadows>
        </div>
    );
};

export default Inner;
