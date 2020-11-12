import React from 'react';
import { c } from 'ttag';
import Icon from '../icon/Icon';

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
    onToggle?: () => void;
    expanded?: boolean;
    sidebarId?: string;
}

const Hamburger = ({ sidebarId, expanded = true, onToggle, ...rest }: Props) => {
    return (
        <button
            type="button"
            className="hamburger p1 nodesktop notablet"
            aria-expanded={expanded === false ? false : undefined}
            aria-controls={sidebarId}
            onClick={onToggle}
            {...rest}
        >
            <Icon
                size={24}
                name={expanded ? 'off' : 'burger'}
                alt={expanded ? c('Action').t`Close navigation` : c('Action').t`Open navigation`}
            />
        </button>
    );
};

export default Hamburger;
