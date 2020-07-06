import React from 'react';
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
            aria-expanded={expanded}
            aria-controls={sidebarId}
            onClick={onToggle}
            {...rest}
        >
            <Icon size={24} name={expanded ? 'off' : 'burger'} />
        </button>
    );
};

export default Hamburger;
