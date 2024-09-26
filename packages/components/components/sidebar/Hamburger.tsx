import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';

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
            className="hamburger md:hidden no-print mr-2"
            aria-expanded={expanded === false ? false : undefined}
            aria-controls={sidebarId}
            onClick={onToggle}
            {...rest}
            title={expanded ? c('Action').t`Close navigation` : c('Action').t`Open navigation`}
            icon
        >
            <Icon
                size={4}
                name={expanded ? 'cross' : 'hamburger'}
                alt={expanded ? c('Action').t`Close navigation` : c('Action').t`Open navigation`}
            />
        </Button>
    );
};

export default Hamburger;
