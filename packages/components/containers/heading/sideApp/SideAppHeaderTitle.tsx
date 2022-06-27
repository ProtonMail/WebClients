import { ReactNode, useRef } from 'react';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { useConfig, useHotkeys } from '../../../hooks';
import { Button, Icon } from '../../../components';
import { Color } from '../../../components/button/ButtonGroup';

interface Props {
    onToggleDropdown: () => void;
    onCloseDropdown?: () => void;
    dropdownTitle: ReactNode;
    buttonColor?: Color;
    dropdownExpanded?: boolean;
}

const SideAppHeaderTitle = ({
    onToggleDropdown,
    onCloseDropdown,
    dropdownTitle,
    buttonColor,
    dropdownExpanded,
}: Props) => {
    const { APP_NAME } = useConfig();
    const appName = APPS_CONFIGURATION[APP_NAME].bareName;

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
            <span className="text-sm color-weak">{appName}</span>
            <Button
                shape="ghost"
                size="small"
                color={buttonColor}
                ref={buttonRef}
                onClick={onToggleDropdown}
                className="text-bold side-app-header-button"
                aria-expanded={dropdownExpanded}
            >
                {dropdownTitle}
                <Icon name={dropdownExpanded ? 'chevron-up-filled' : 'chevron-down-filled'} className="ml0-25" />
            </Button>
        </div>
    );
};

export default SideAppHeaderTitle;
