import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Dropdown, { DropdownBorderRadius } from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
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

interface DropdownSortOptionProps {
    onClick: () => void;
    isActive: boolean;
    iconName: IconName;
    label: string;
    testID: string;
}

const DropdownSortOption = ({ onClick, isActive, iconName, label, testID }: DropdownSortOptionProps) => {
    return (
        <DropdownMenuButton
            onClick={onClick}
            className="flex items-center w-full justify-space-between"
            data-testid={testID}
        >
            <span className="flex items-center gap-2">
                <Icon name={iconName} title={label} />
                {label}
            </span>
            {isActive && <Icon name="checkmark" />}
        </DropdownMenuButton>
    );
};

export const FilterList = () => {
    const history = useHistory();

    const labelID = useMailSelector(selectLabelID);
    const sort = useMailSelector(selectSort);
    const filter = useMailSelector(selectFilter);

    const tel = useListSettingsTelemetry();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleFilter = (filter: Filter) => {
        history.push(setFilterInUrl(history.location, filter));
    };

    const handleSort = (sort: Sort) => {
        history.push(setSortInUrl(history.location, sort));
    };

    const reset = () => {
        history.push(resetFilterAndSort(history.location));
    };

    const resetFilterOnly = () => {
        history.push(resetFilter(history.location));
    };

    const resetSortOnly = () => {
        history.push(resetSort(history.location));
    };

    const activeState = getActiveState(filter, sort);
    const isScheduledLabel = labelID === MAILBOX_LABEL_IDS.SCHEDULED;
    return (
        <div className="flex flex-nowrap gap-1">
            {activeState.showReset && (
                <Button shape="ghost" color="norm" size="tiny" onClick={reset}>{c('Filter').t`Reset`}</Button>
            )}

            <Button
                shape={activeState.isUnreadActive ? 'solid' : 'outline'}
                size="tiny"
                onClick={() => {
                    if (activeState.isUnreadActive) {
                        resetFilterOnly();
                    } else {
                        handleFilter({ Unread: 1 });
                    }

                    tel.sendUnreadReport();
                }}
                data-testid="filter-dropdown:show-unread"
            >
                {c('Filter').t`Unread`}
            </Button>

            <DropdownButton
                size="tiny"
                shape={activeState.dropdownActiveCount > 0 ? 'solid' : 'outline'}
                className="flex items-center"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                data-testid="filter-dropdown:show-filters"
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
                    <DropdownMenuButton
                        onClick={() => {
                            if (activeState.isReadActive) {
                                resetFilterOnly();
                            } else {
                                handleFilter({ Unread: 0 });
                            }
                            tel.sendReadReport();
                        }}
                        className="text-left"
                        data-testid="filter-dropdown:show-read"
                    >
                        <span className="flex items-center justify-space-between w-full">
                            {c('Filter').t`Read`}
                            {activeState.isReadActive && <Icon name="checkmark" />}
                        </span>
                    </DropdownMenuButton>

                    <DropdownMenuButton
                        onClick={() => {
                            if (activeState.isAttachmentActive) {
                                resetFilterOnly();
                            } else {
                                handleFilter({ Attachments: 1 });
                            }
                            tel.sendFileReport();
                        }}
                        className="text-left"
                        data-testid="filter-dropdown:has-file"
                    >
                        <span className="flex items-center justify-space-between w-full">
                            {c('Filter').t`Has attachments`}
                            {activeState.isAttachmentActive && <Icon name="checkmark" />}
                        </span>
                    </DropdownMenuButton>
                </DropdownMenu>

                <hr className="my-2 border-bottom border-weak" />

                <DropdownMenu>
                    <p className="px-4 pt-3 pb-1 text-semibold">{c('Sort option').t`Sort by`}</p>
                    <DropdownSortOption
                        onClick={() => {
                            if (activeState.isOldestFirstActive) {
                                resetSortOnly();
                            } else {
                                handleSort({ sort: 'Time', desc: true });
                            }
                            tel.sendNewestFirstReport();
                        }}
                        isActive={activeState.isNewestFirstActive}
                        iconName={isScheduledLabel ? 'list-arrow-up' : 'list-arrow-down'}
                        testID="toolbar:sort-new-to-old"
                        label={c('Sort option').t`Newest first`}
                    />

                    <DropdownSortOption
                        onClick={() => {
                            if (activeState.isOldestFirstActive) {
                                resetSortOnly();
                            } else {
                                handleSort({ sort: 'Time', desc: false });
                            }
                            tel.sendOldestFirstReport();
                        }}
                        isActive={activeState.isOldestFirstActive}
                        iconName={isScheduledLabel ? 'list-arrow-down' : 'list-arrow-up'}
                        testID="toolbar:sort-old-to-new"
                        label={c('Sort option').t`Oldest first`}
                    />

                    <DropdownSortOption
                        onClick={() => {
                            if (activeState.isLargestFirstActive) {
                                resetSortOnly();
                            } else {
                                handleSort({ sort: 'Size', desc: true });
                            }
                            tel.sendLargestFirstReport();
                        }}
                        isActive={activeState.isLargestFirstActive}
                        iconName="size-arrow-down"
                        testID="toolbar:sort-desc"
                        label={c('Sort option').t`Largest first`}
                    />

                    <DropdownSortOption
                        onClick={() => {
                            if (activeState.isSmallestFirstActive) {
                                resetSortOnly();
                            } else {
                                handleSort({ sort: 'Size', desc: false });
                            }
                            tel.sendSmallestFirstReport();
                        }}
                        isActive={activeState.isSmallestFirstActive}
                        iconName="size-arrow-up"
                        testID="toolbar:sort-asc"
                        label={c('Sort option').t`Smallest first`}
                    />
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};
