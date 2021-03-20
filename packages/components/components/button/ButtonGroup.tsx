import React from 'react';
import { classnames } from '../../helpers';

interface Props {
    children: React.ReactNode;
    className?: string;
}

const ButtonGroup = ({ children, className = '' }: Props, ref: React.Ref<HTMLDivElement>) => (
    <div className={classnames(['grouped-buttons', className])} ref={ref}>
        {children}
    </div>
);

export default React.forwardRef<HTMLDivElement, Props>(ButtonGroup);
