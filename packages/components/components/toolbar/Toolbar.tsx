import { HTMLAttributes, ReactNode } from 'react';
import { classnames } from '../../helpers';

interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

const Toolbar = ({ children, className, ...rest }: Props) => (
    <div
        className={classnames(['toolbar flex flex-nowrap no-scroll flex-item-noshrink no-print', className])}
        {...rest}
    >
        {children}
    </div>
);

export default Toolbar;
