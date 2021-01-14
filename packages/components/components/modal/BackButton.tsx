import React from 'react';
import { c } from 'ttag';
import { Icon } from '../icon';

const BackButton = ({
    children,
    className = 'mr1',
    ...rest
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
    return (
        <button type="button" title={c('Action').t`Back`} className={className} {...rest}>
            <Icon size={28} name="arrow-left" alt={c('Action').t`Back`} />
        </button>
    );
};

export default BackButton;
