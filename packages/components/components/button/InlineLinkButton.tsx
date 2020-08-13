import React from 'react';
import { classnames } from '../../helpers';

type Props = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

const InlineLinkButton = ({ children, className = '', ...rest }: Props) => {
    return (
        <button
            type="button"
            role="button"
            className={classnames(['link alignbaseline alignleft', className])}
            {...rest}
        >
            {children}
        </button>
    );
};

export default InlineLinkButton;
