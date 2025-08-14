import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { IconSize } from '@proton/icons';

interface Props extends ButtonProps {
    onToggle?: () => void;
    expanded?: boolean;
    sidebarId?: string;
    iconSize?: IconSize;
}

const Hamburger = ({ sidebarId, expanded = true, onToggle, iconSize = 4, ...rest }: Props) => {
    return (
        <Button
            shape="ghost"
            color="weak"
            className="hamburger md:hidden no-print"
            aria-expanded={expanded === false ? false : undefined}
            aria-controls={sidebarId}
            onClick={onToggle}
            {...rest}
            title={expanded ? c('Action').t`Close navigation` : c('Action').t`Open navigation`}
            icon
        >
            <Icon
                size={iconSize}
                name={expanded ? 'cross' : 'hamburger'}
                alt={expanded ? c('Action').t`Close navigation` : c('Action').t`Open navigation`}
            />
        </Button>
    );
};

export default Hamburger;
