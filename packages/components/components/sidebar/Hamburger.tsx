import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcHamburger } from '@proton/icons/icons/IcHamburger';
import type { IconSize } from '@proton/icons/types';

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
            {expanded ? (
                <IcCross size={iconSize} alt={c('Action').t`Close navigation`} />
            ) : (
                <IcHamburger size={iconSize} alt={c('Action').t`Open navigation`} />
            )}
        </Button>
    );
};

export default Hamburger;
