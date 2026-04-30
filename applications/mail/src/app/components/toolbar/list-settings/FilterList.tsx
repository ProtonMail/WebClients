import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Dropdown, { DropdownBorderRadius } from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { IcCheckmarkStrong } from '@proton/icons/icons/IcCheckmarkStrong';
import type { IconName } from '@proton/icons/types';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import {
    resetFilter,
    resetFilterAndSort,
    resetSort,
    setFilterInUrl,
    setSortInUrl,
} from 'proton-mail/helpers/mailboxUrl';
import { selectFilter, selectLabelID, selectSort } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { getActiveState } from './filterListHelpers';
import { useListSettingsTelemetry } from './useListSettingsTelemetry';

interface FilterOption {
    label: string;
    testID: string;
    isActive: boolean;
    filter: Filter;
    onTelemetry: () => void;
}

interface SortOption {
    label: string;
    iconName: IconName;
    testID: string;
    isActive: boolean;
    sort: Sort;
    onTelemetry: () => void;
}

export const FilterList = () => {
    const history = useHistory();

    const sort = useMailSelector(selectSort);
    const filter = useMailSelector(selectFilter);
    const labelID = useMailSelector(selectLabelID);

    const tel = useListSettingsTelemetry();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const isScheduledLabel = labelID === MAILBOX_LABEL_IDS.SCHEDULED;
    const activeState = getActiveState(filter, sort, isScheduledLabel);

    const applyFilter = ({ isActive, filter, onTelemetry }: FilterOption) => {
        if (isActive) {
            history.push(resetFilter(history.location));
        } else {
            history.push(setFilterInUrl(history.location, filter));
        }
        onTelemetry();
    };

    const applySort = ({ isActive, sort, onTelemetry }: SortOption) => {
        if (isActive) {
            history.push(resetSort(history.location));
        } else {
            history.push(setSortInUrl(history.location, sort));
        }
        onTelemetry();
    };

    const filterOptions: FilterOption[] = [
        {
            label: c('Filter').t`Read`,
            testID: 'filter-dropdown:show-read',
            isActive: activeState.isReadActive,
            filter: { Unread: 0 },
            onTelemetry: tel.sendReadReport,
        },
        {
            label: c('Filter').t`Has attachments`,
            testID: 'filter-dropdown:has-file',
            isActive: activeState.isAttachmentActive,
            filter: { Attachments: 1 },
            onTelemetry: tel.sendFileReport,
        },
    ];

    const sortOptions: SortOption[] = [
        {
            label: c('Sort option').t`Newest first`,
            iconName: 'list-arrow-down',
            testID: 'toolbar:sort-new-to-old',
            isActive: activeState.isNewestFirstActive,
            sort: { sort: 'Time', desc: true },
            onTelemetry: tel.sendNewestFirstReport,
        },
        {
            label: c('Sort option').t`Oldest first`,
            iconName: 'list-arrow-up',
            testID: 'toolbar:sort-old-to-new',
            isActive: activeState.isOldestFirstActive,
            sort: { sort: 'Time', desc: false },
            onTelemetry: tel.sendOldestFirstReport,
        },
        {
            label: c('Sort option').t`Largest first`,
            iconName: 'size-arrow-down',
            testID: 'toolbar:sort-desc',
            isActive: activeState.isLargestFirstActive,
            sort: { sort: 'Size', desc: true },
            onTelemetry: tel.sendLargestFirstReport,
        },
        {
            label: c('Sort option').t`Smallest first`,
            iconName: 'size-arrow-up',
            testID: 'toolbar:sort-asc',
            isActive: activeState.isSmallestFirstActive,
            sort: { sort: 'Size', desc: false },
            onTelemetry: tel.sendSmallestFirstReport,
        },
    ];

    return (
        <div className="flex flex-nowrap gap-1">
            {activeState.showReset && (
                <Button
                    shape="ghost"
                    color="norm"
                    size="tiny"
                    onClick={() => history.push(resetFilterAndSort(history.location))}
                >
                    {c('Filter').t`Reset`}
                </Button>
            )}

            <Button
                shape={activeState.isUnreadActive ? 'solid' : 'outline'}
                color={activeState.isUnreadActive ? 'norm' : undefined}
                size="tiny"
                onClick={() => {
                    if (activeState.isUnreadActive) {
                        history.push(resetFilter(history.location));
                    } else {
                        history.push(setFilterInUrl(history.location, { Unread: 1 }));
                    }

                    tel.sendUnreadReport();
                }}
                data-testid="filter-dropdown:show-unread"
                aria-pressed={activeState.isUnreadActive}
            >
                {c('Filter').t`Unread`}
            </Button>

            <DropdownButton
                size="tiny"
                shape={activeState.dropdownActiveCount > 0 ? 'solid' : 'outline'}
                color={activeState.dropdownActiveCount > 0 ? 'norm' : undefined}
                className="flex items-center"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                data-testid="filter-dropdown:show-filters"
                title={c('Filter').t`Filter and sort emails`}
            >
                <Icon size={3} className="mr-1" name="lines-long-to-small" />
                {activeState.dropdownActiveCount > 0
                    ? c('Filter').t`Filter (${activeState.dropdownActiveCount})`
                    : c('Filter').t`Filter`}
            </DropdownButton>

            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                size={{ width: '16rem' }}
                borderRadius={DropdownBorderRadius.LG}
            >
                <DropdownMenu>
                    <p className="px-4 pt-3 pb-1 text-semibold">{c('Filter').t`Filter`}</p>
                    {filterOptions.map((option) => (
                        <DropdownMenuButton
                            key={option.testID}
                            onClick={() => applyFilter(option)}
                            className="text-left"
                            data-testid={option.testID}
                            aria-pressed={option.isActive}
                        >
                            <span className="flex items-center justify-space-between w-full">
                                {option.label}
                                {option.isActive && <IcCheckmarkStrong className="color-primary" />}
                            </span>
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>

                <hr className="my-2 border-bottom border-weak" />

                <DropdownMenu>
                    <p className="px-4 pt-3 pb-1 text-semibold">{c('Sort option').t`Sort by`}</p>
                    {sortOptions.map((option) => (
                        <DropdownMenuButton
                            key={option.testID}
                            onClick={() => applySort(option)}
                            className="flex items-center w-full justify-space-between"
                            data-testid={option.testID}
                            aria-pressed={option.isActive}
                        >
                            <span className="flex items-center gap-2">
                                <Icon name={option.iconName} title={option.label} />
                                {option.label}
                            </span>
                            {option.isActive && <IcCheckmarkStrong className="color-primary" />}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};
