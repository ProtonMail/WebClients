import React from 'react';
import { classnames } from '../../helpers';

interface Props extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> {
    id: string;
    children: React.ReactNode;
}

const Title = ({ children, className, ...rest }: Props) => {
    return (
        <h1
            className={classnames(['modal-title no-outline', className])}
            data-focus-trap-fallback="0"
            tabIndex={-1}
            {...rest}
        >
            {children}
        </h1>
    );
};

export default Title;
