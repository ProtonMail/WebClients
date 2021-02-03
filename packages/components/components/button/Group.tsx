import React from 'react';
import { classnames } from '../../helpers';

interface Props {
    children: React.ReactNode;
    className?: string;
}

const Group = ({ children, className = '' }: Props) => (
    <div className={classnames(['grouped-buttons', className])}>{children}</div>
);

export default Group;
