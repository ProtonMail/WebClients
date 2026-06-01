import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import type { IconName } from '@proton/icons/types';

type Props = {
    name: string;
    icon: IconName;
    children: ReactNode;
};

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const ContextMenuSubButton = ({ name, icon, children }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);
    const openViaKeyboardRef = useRef(false);

    const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const dropdownContentRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (!isOpen || !openViaKeyboardRef.current) {
            return;
        }

        openViaKeyboardRef.current = false;
        const firstFocusable = dropdownContentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        firstFocusable?.focus();
    }, [isOpen]);

    const handleButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            openViaKeyboardRef.current = true;
            open();
        }
    };

    const handleDropdownKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowLeft' && isOpen) {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
        }
    };

    return (
        <>
            <div ref={buttonRef} onMouseEnter={open} onMouseLeave={scheduleClose}>
                <DropdownMenuButton
                    onKeyDown={handleButtonKeyDown}
                    onContextMenu={(e) => e.stopPropagation()}
                    className="flex items-center flex-nowrap text-left"
                >
                    <Icon className="mr-2 shrink-0" name={icon} />
                    <span className="mr-4">{name}</span>
                    <IcChevronRight className="ml-auto shrink-0" />
                </DropdownMenuButton>
            </div>
            <Dropdown
                anchorRef={buttonRef as unknown as React.RefObject<HTMLElement>}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                originalPlacement="right-start"
                availablePlacements={['right-start', 'right-end', 'left-start', 'left-end']}
                noCaret
                autoClose={false}
                autoCloseOutside={false}
                autoCloseOutsideAnchor={false}
                offset={0}
                onMouseEnter={open}
                onMouseLeave={scheduleClose}
                onContextMenu={(e) => e.stopPropagation()}
                onKeyDown={handleDropdownKeyDown}
            >
                <div ref={dropdownContentRef}>{children}</div>
            </Dropdown>
        </>
    );
};
