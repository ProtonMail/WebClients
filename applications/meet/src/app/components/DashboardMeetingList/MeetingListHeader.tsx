import { useEffect, useRef, useState } from 'react';

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
    search: string;
    setSearch: (search: string) => void;
    setSortBy: (sortBy: SortOption) => void;
    handleAddClick: () => void;
    activeTab: DashboardMeetingListTab;
    selectedSortOption: SortOptionObject;
    sortOptions: SortOptionObject[];
}

export const MeetingListHeader = ({
    search,
    setSearch,
    selectedSortOption,
    setSortBy,
    handleAddClick,
    activeTab,
    sortOptions,
}: MeetingListHeaderProps) => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const [_isStuck, setIsStuck] = useState(false);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const toolbarRef = useRef<HTMLDivElement>(null);

    // translators: Room means meeting room.
    const newRoomButtonLabel =
        activeTab === DashboardMeetingListTab.TimeBased ? c('Action').t`Schedule` : c('Action').t`Room`;

    useEffect(() => {
        const toolbar = toolbarRef.current;
        if (!toolbar) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsStuck(entry.intersectionRatio < 1);
            },
            { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
        );

        observer.observe(toolbar);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={toolbarRef}
            className={clsx(
                'meeting-list-header w-full flex gap-4 flex-wrap md:flex-nowrap shrink-0'
                // isStuck && 'is-stuck'
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
                    className={clsx('rounded-full border-none flex items-center justify-center sort-dropdown-button')}
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
                    className="create-meeting-dropdown meet-radius"
                >
                    <DropdownMenu className="flex flex-column items-start py-2 px-1 flex-nowrap meet-radius">
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
                    className="list-toolbar-schedule-button rounded-full flex items-center justify-center gap-1 border-none px-6 py-4"
                    onClick={() => handleAddClick()}
                    size="large"
                >
                    <IcPlus className="shrink-0 mr-2" />
                    {newRoomButtonLabel}
                </Button>
            </div>
        </div>
    );
};
