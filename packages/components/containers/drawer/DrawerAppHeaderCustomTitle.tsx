import { ReactNode, useRef } from 'react';

import { Button } from '@proton/atoms';
import { KeyboardKey } from '@proton/shared/lib/interfaces';

import { Icon } from '../../components';
import { Color } from '../../components/button/ButtonGroup';
import { useHotkeys } from '../../hooks';

interface Props {
    onToggleDropdown: () => void;
    onCloseDropdown?: () => void;
    dropdownTitle: ReactNode;
    buttonColor?: Color;
    dropdownExpanded?: boolean;
}

const DrawerAppHeaderCustomTitle = ({
    onToggleDropdown,
    onCloseDropdown,
    dropdownTitle,
    buttonColor,
    dropdownExpanded,
}: Props) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    useHotkeys(buttonRef, [
        [
            KeyboardKey.Escape,
            (e) => {
                e.stopPropagation();
                onCloseDropdown?.();
            },
        ],
    ]);

    return (
        <div className="flex flex-column iframe-header">
            <Button
                shape="ghost"
                size="small"
                color={buttonColor}
                ref={buttonRef}
                onClick={onToggleDropdown}
                className="drawer-header-button"
                aria-expanded={dropdownExpanded}
            >
                {dropdownTitle}
                <Icon name={dropdownExpanded ? 'chevron-up-filled' : 'chevron-down-filled'} className="ml-1" />
            </Button>
        </div>
    );
};

export default DrawerAppHeaderCustomTitle;
