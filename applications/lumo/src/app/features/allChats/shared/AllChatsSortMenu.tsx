import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

import { MenuDropdown } from '../../../components/Composer/components/MenuDropdown';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { AllChatsSortValue } from '../filterAllChatsConversations';
import { getAllChatsSortOptions } from './allChatsHeaderOptions';

interface Props {
    sort: AllChatsSortValue;
    onSortChange: (value: AllChatsSortValue) => void;
    /** Icon-only button, for narrow screens. */
    iconOnly?: boolean;
}

export const AllChatsSortMenu = ({ sort, onSortChange, iconOnly = false }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const options = getAllChatsSortOptions();
    const currentLabel =
        options.find((option) => {
            return option.value === sort;
        })?.label ?? '';

    return (
        <>
            <Button
                ref={anchorRef}
                shape="ghost"
                size="small"
                icon={iconOnly}
                className="shrink-0 flex flex-nowrap items-center gap-2 font-medium"
                aria-label={iconOnly ? c('collider_2025:Action').t`Sort chats: ${currentLabel}` : undefined}
                aria-expanded={isOpen}
                onClick={() => {
                    setIsOpen((open) => {
                        return !open;
                    });
                }}
            >
                <LumoIcon name="ArrowUpDown" size={16} className="shrink-0" />
                {iconOnly ? null : <span>{currentLabel}</span>}
            </Button>

            <MenuDropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => {
                    setIsOpen(false);
                }}
                placement="bottom-end"
            >
                <div className="px-3 py-1 text-sm color-weak">{c('collider_2025:Title').t`Sort by`}</div>
                {options.map((option) => {
                    const isSelected = option.value === sort;

                    return (
                        <DropdownMenuButton
                            key={option.value}
                            className="flex flex-nowrap items-center gap-3"
                            aria-pressed={isSelected}
                            onClick={() => {
                                onSortChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            <LumoIcon name="ArrowUpDown" size={16} className="shrink-0" />
                            <span className="flex-1 text-left">{option.label}</span>
                            <span className="shrink-0 flex w-custom" style={{ '--w-custom': '1rem' }}>
                                {isSelected ? <LumoIcon name="Check" size={16} className="color-primary" /> : null}
                            </span>
                        </DropdownMenuButton>
                    );
                })}
            </MenuDropdown>
        </>
    );
};
