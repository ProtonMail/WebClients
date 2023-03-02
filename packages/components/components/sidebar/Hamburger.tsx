import { c } from 'ttag';

import { Button, ButtonProps } from '@proton/atoms';

import Icon from '../icon/Icon';

interface Props extends ButtonProps {
    onToggle?: () => void;
    expanded?: boolean;
    sidebarId?: string;
}

const Hamburger = ({ sidebarId, expanded = true, onToggle, ...rest }: Props) => {
    return (
        <Button
            shape="ghost"
            color="weak"
            className="hamburger ml0-5 no-desktop no-tablet no-print"
            aria-expanded={expanded === false ? false : undefined}
            aria-controls={sidebarId}
            onClick={onToggle}
            {...rest}
            title={expanded ? c('Action').t`Close navigation` : c('Action').t`Open navigation`}
            icon
        >
            <Icon
                size={24}
                name={expanded ? 'cross' : 'hamburger'}
                alt={expanded ? c('Action').t`Close navigation` : c('Action').t`Open navigation`}
            />
        </Button>
    );
};

export default Hamburger;
