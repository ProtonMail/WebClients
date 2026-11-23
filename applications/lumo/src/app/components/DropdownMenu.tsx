import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import generateUID from '@proton/utils/generateUID';

import { useIsLumoSmallScreen } from '../hooks/useIsLumoSmallScreen';
import { useIsTouchDevice } from '../hooks/useIsTouchDevice';
import { LumoIcon } from './LumoIcon/LumoIcon';

import './DropdownMenu.scss';

export type DropdownOptions = {
    className?: string;
    label: string;
    value?: string;
    icon: React.ReactNode;
    disabled?: boolean;
    onClick: (e?: React.MouseEvent) => void | Promise<void> | ((option: string) => void) | (() => Promise<void>);
};
interface Props {
    className?: string;
    buttonContent?: React.ReactNode;
    options: DropdownOptions[];
    onToggle?: (isOpen: boolean) => void;
    visibleOnHover?: boolean;
}

const DropdownMenu = ({ className, buttonContent, options, onToggle, visibleOnHover = false }: Props) => {
    const ref = useRef<HTMLButtonElement>(null);
    const [uid] = useState(() => generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>(onToggle);
    const { isSmallScreen } = useIsLumoSmallScreen();
    const isTouchDevice = useIsTouchDevice();
    const alwaysVisible = isSmallScreen || isTouchDevice || visibleOnHover;

    return (
        <div className={clsx('relative shrink-0 flex', !alwaysVisible && 'group-hover:opacity-100')}>
            <DropdownButton
                as={Button}
                ref={anchorRef}
                className={clsx('radius-4', className)}
                icon
                hasCaret={false}
                shape="ghost"
                size="small"
                isOpen={isOpen}
                onClick={toggle}
            >
                {buttonContent ?? <LumoIcon name="Ellipsis" aria-label={c('collider_2025:Title').t`More options`} />}
            </DropdownButton>
            {/* Centred on the button: below it, or above when there is no room below. */}
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="bottom"
                availablePlacements={['bottom', 'top']}
                className="chat-dropdown-menu"
            >
                {options.map((option, index) => {
                    return (
                        <DropdownMenuButton
                            onClick={(e) => option.onClick(e)}
                            key={index}
                            className={clsx('flex flex-row flex-nowrap items-center gap-2 w-full', option.className)}
                            disabled={option.disabled}
                            ref={ref}
                        >
                            {option.icon}
                            <span>{option.label}</span>
                        </DropdownMenuButton>
                    );
                })}
            </Dropdown>
        </div>
    );
};

export default DropdownMenu;
