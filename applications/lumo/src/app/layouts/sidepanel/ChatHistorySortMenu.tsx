import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

import { MenuDropdown } from '../../components/Composer/components/MenuDropdown';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';

const SortMenuCheckmark = ({ visible }: { visible: boolean }) => {
    return (
        <span className={clsx('flex items-center shrink-0', !visible && 'visibility-hidden')}>
            <LumoIcon name="Check" size={16} className="color-primary" />
        </span>
    );
};

const SortMenuSectionLabel = ({ children }: { children: React.ReactNode }) => {
    return <div className="px-4 py-2 text-sm color-weak text-semibold">{children}</div>;
};

interface SortMenuItemProps {
    label: string;
    selected: boolean;
    onSelect: () => void;
}

const SortMenuItem = ({ label, selected, onSelect }: SortMenuItemProps) => {
    return (
        <DropdownMenuButton
            className="justify-start"
            onMouseDown={(event) => {
                event.preventDefault();
            }}
            onClick={(event) => {
                event.stopPropagation();
                onSelect();
            }}
        >
            <div className="flex items-center gap-3 w-full">
                <span className="text-sm font-medium flex-1 text-left">{label}</span>
                <SortMenuCheckmark visible={selected} />
            </div>
        </DropdownMenuButton>
    );
};

export interface ChatHistorySortMenuOption {
    value: ChatHistoryDateField;
    label: string;
}

interface ChatHistorySortMenuProps {
    sortField: ChatHistoryDateField;
    onSortFieldChange: (value: ChatHistoryDateField) => void;
    options: ChatHistorySortMenuOption[];
    buttonLabel: string;
    buttonClassName?: string;
    buttonVariant?: 'icon' | 'labeled';
    dropdownClassName?: string;
    stopPropagation?: boolean;
}

export const ChatHistorySortMenu = ({
    sortField,
    onSortFieldChange,
    options,
    buttonLabel,
    buttonClassName,
    buttonVariant = 'labeled',
    dropdownClassName,
    stopPropagation = false,
}: ChatHistorySortMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);

    const handleButtonMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (stopPropagation) {
            event.stopPropagation();
            return;
        }

        event.preventDefault();
    };

    const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (stopPropagation) {
            event.stopPropagation();
        }

        setIsOpen((open) => {
            return !open;
        });
    };

    return (
        <>
            <Button
                ref={anchorRef}
                icon={buttonVariant === 'icon'}
                shape="ghost"
                size="small"
                className={buttonClassName}
                aria-label={buttonLabel}
                title={buttonLabel}
                onMouseDown={handleButtonMouseDown}
                onClick={handleButtonClick}
            >
                {buttonVariant === 'labeled' ? (
                    <span className="flex items-center gap-1 text-semibold">
                        <span>{buttonLabel}</span>
                        <LumoIcon name="ChevronDown" width={12} height={12} className="color-weak shrink-0" />
                    </span>
                ) : (
                    <LumoIcon name="List" width={14} height={14} />
                )}
            </Button>

            <MenuDropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => {
                    setIsOpen(false);
                }}
                placement="bottom-end"
                className={dropdownClassName}
            >
                <SortMenuSectionLabel>{c('collider_2025:Title').t`Sort by`}</SortMenuSectionLabel>
                {options.map((option) => {
                    return (
                        <SortMenuItem
                            key={option.value}
                            label={option.label}
                            selected={sortField === option.value}
                            onSelect={() => {
                                onSortFieldChange(option.value);
                            }}
                        />
                    );
                })}
            </MenuDropdown>
        </>
    );
};
