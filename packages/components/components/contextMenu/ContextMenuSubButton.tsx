import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';

type Props = {
    name: string;
    icon: IconName;
    children: ReactNode;
};

export const ContextMenuSubButton = ({ name, icon, children }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const open = () => {
        clearTimeout(closeTimerRef.current);
        setIsOpen(true);
    };

    const scheduleClose = () => {
        closeTimerRef.current = setTimeout(() => setIsOpen(false), 150);
    };

    useEffect(() => {
        return () => clearTimeout(closeTimerRef.current);
    }, []);

    return (
        <>
            <div ref={buttonRef} onMouseEnter={open} onMouseLeave={scheduleClose}>
                <DropdownMenuButton
                    onContextMenu={(e) => e.stopPropagation()}
                    className="flex items-center flex-nowrap text-left"
                >
                    <Icon className="mr-2 shrink-0" name={icon} />
                    <span className="mr-4">{name}</span>
                    <Icon className="ml-auto shrink-0" name="chevron-right" />
                </DropdownMenuButton>
            </div>
            <Dropdown
                anchorRef={buttonRef as unknown as React.RefObject<HTMLElement>}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                originalPlacement="right-start"
                availablePlacements={['right-start', 'right-end', 'left-start', 'left-end']}
                noCaret
                disableFocusTrap
                autoClose={false}
                autoCloseOutside={false}
                autoCloseOutsideAnchor={false}
                offset={0}
                onMouseEnter={open}
                onMouseLeave={scheduleClose}
                onContextMenu={(e) => e.stopPropagation()}
            >
                {children}
            </Dropdown>
        </>
    );
};
