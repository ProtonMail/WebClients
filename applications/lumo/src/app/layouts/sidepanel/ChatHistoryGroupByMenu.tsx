import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcListBullets } from '@proton/icons/icons/IcListBullets';

import { MenuDropdown } from '../../components/Composer/components/MenuDropdown';
import { useLumoUserSettings } from '../../hooks';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';

import './ChatHistoryGroupByMenu.scss';

const Checkmark = ({ visible }: { visible: boolean }) => (
    <span className={clsx('flex items-center shrink-0', !visible && 'visibility-hidden')}>
        <IcCheckmark size={4} className="color-primary" />
    </span>
);

const MenuSectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="chat-history-group-by-menu-label px-4 py-2 text-sm color-weak">{children}</div>
);

const GroupByMenuItem = ({
    label,
    selected,
    onSelect,
}: {
    label: string;
    selected: boolean;
    onSelect: () => void;
}) => (
    <DropdownMenuButton
        className="justify-start"
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
            event.stopPropagation();
            onSelect();
        }}
    >
        <div className="flex items-center gap-3 w-full">
            <span className="text-sm font-medium flex-1 text-left">{label}</span>
            <Checkmark visible={selected} />
        </div>
    </DropdownMenuButton>
);

const getSortedByLabel = (dateField: ChatHistoryDateField): string =>
    dateField === 'updatedAt'
        ? c('collider_2025: Info').t`Sorted by last updated`
        : c('collider_2025: Info').t`Sorted by date created`;

interface ChatHistoryGroupByMenuProps {
    /** When true, shows the active sort field as text instead of an icon-only button. */
    showSortedByLabel?: boolean;
}

export const ChatHistoryGroupByMenu = ({ showSortedByLabel = false }: ChatHistoryGroupByMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();

    const dateField = lumoUserSettings.chatHistoryDateField ?? 'updatedAt';

    const setDateField = (nextDateField: ChatHistoryDateField) => {
        updateSettings({ chatHistoryDateField: nextDateField, _autoSave: true });
    };

    const sortedByLabel = getSortedByLabel(dateField);

    return (
        <>
            <Button
                ref={anchorRef}
                icon={!showSortedByLabel}
                shape="ghost"
                size="small"
                className={clsx(
                    'chat-history-group-by-menu-button shrink-0',
                    showSortedByLabel && 'chat-history-group-by-menu-button--labeled'
                )}
                aria-label={sortedByLabel}
                title={sortedByLabel}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen((open) => !open);
                }}
            >
                {showSortedByLabel ? (
                    <span className="flex items-center gap-1">
                        <span className="text-sm">{sortedByLabel}</span>
                        <IcChevronDown size={3} className="color-weak shrink-0" alt="" />
                    </span>
                ) : (
                    <IcListBullets size={3.5} />
                )}
            </Button>

            <MenuDropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => setIsOpen(false)}
                placement="bottom-end"
                className="chat-history-group-by-menu"
            >
                <MenuSectionLabel>{c('collider_2025:Title').t`Sort by`}</MenuSectionLabel>
                <GroupByMenuItem
                    label={c('collider_2025:Option').t`Last updated`}
                    selected={dateField === 'updatedAt'}
                    onSelect={() => setDateField('updatedAt')}
                />
                <GroupByMenuItem
                    label={c('collider_2025:Option').t`Date created`}
                    selected={dateField === 'createdAt'}
                    onSelect={() => setDateField('createdAt')}
                />
            </MenuDropdown>
        </>
    );
};
