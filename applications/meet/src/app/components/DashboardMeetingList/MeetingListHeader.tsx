import { forwardRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import clsx from '@proton/utils/clsx';

import type { SortOption, SortOptionObject } from './types';
import { DashboardMeetingListTab } from './types';

import './MeetingListHeader.scss';

interface MeetingListHeaderProps {
    isStuck: boolean;
    search: string;
    setSearch: (search: string) => void;
    setSortBy: (sortBy: SortOption) => void;
    handleAddClick: () => void;
    activeTab: DashboardMeetingListTab;
    selectedSortOption: SortOptionObject;
    sortOptions: SortOptionObject[];
}

export const MeetingListHeader = forwardRef(
    (
        {
            search,
            setSearch,
            selectedSortOption,
            setSortBy,
            handleAddClick,
            activeTab,
            sortOptions,
            isStuck,
        }: MeetingListHeaderProps,
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

        // translators: Room means meeting room.
        const newRoomButtonLabel =
            activeTab === DashboardMeetingListTab.TimeBased ? c('Action').t`Schedule` : c('Action').t`Room`;

        return (
            <div
                ref={ref}
                className={clsx(
                    'meeting-list-header w-full flex gap-4 flex-wrap md:flex-nowrap shrink-0',
                    isStuck && 'is-stuck'
                )}
            >
                <Input
                    placeholder={c('Placeholder').t`Search`}
                    className="search-input min-w-full md:min-w-0 md:flex-1 rounded-full p-2"
                    prefix={<IcMagnifier />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex flex-column md:flex-row gap-4 w-full md:w-auto">
                    <DropdownButton
                        ref={anchorRef}
                        isOpen={isOpen}
                        onClick={toggle}
                        hasCaret={true}
                        shape="ghost"
                        className={clsx(
                            'rounded-full border-none flex items-center justify-center sort-dropdown-button tertiary'
                        )}
                        size="large"
                    >
                        <span className="inline-flex items-center mx-2">
                            {selectedSortOption?.icon}
                            {selectedSortOption?.label}
                        </span>
                    </DropdownButton>
                    <Dropdown
                        isOpen={isOpen}
                        anchorRef={anchorRef}
                        onClose={close}
                        originalPlacement="bottom-end"
                        className="meet-dropdown create-meeting-dropdown meet-radius"
                        size={{ width: '14rem' }}
                    >
                        <DropdownMenu className="flex flex-column items-start p-2 flex-nowrap meet-radius">
                            <div className="color-hint meet-font-weight text-uppercase text-sm block pb-2 pt-4 px-4">
                                {c('Info').t`Sort by`}
                            </div>
                            {sortOptions.map((option) => (
                                <DropdownMenuButton
                                    key={option.value}
                                    className="create-meeting-dropdown-menu text-left large-meet-radius flex flex-nowrap items-center gap-2 border-none shrink-0"
                                    liClassName="w-full"
                                    isSelected={selectedSortOption?.value === option.value}
                                    onClick={() => {
                                        setSortBy(option.value);
                                        close();
                                    }}
                                >
                                    <span className="flex items-center gap-2 flex-1">
                                        {option.icon}
                                        {option.label}
                                    </span>
                                    {selectedSortOption?.value === option.value && (
                                        <IcCheckmark className="shrink-0 color-primary" />
                                    )}
                                </DropdownMenuButton>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Button
                        className="list-toolbar-schedule-button rounded-full flex items-center justify-center gap-1 border-none px-6 py-4 secondary"
                        onClick={() => handleAddClick()}
                        size="large"
                    >
                        <IcPlus className="shrink-0 mr-2" />
                        {newRoomButtonLabel}
                    </Button>
                </div>
            </div>
        );
    }
);

MeetingListHeader.displayName = 'MeetingListHeader';
