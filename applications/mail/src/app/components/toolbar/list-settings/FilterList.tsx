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
import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import { resetFilterAndSort, setFilterInUrl, setSortInUrl } from 'proton-mail/helpers/mailboxUrl';
import { selectFilter, selectSort } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { getActiveState } from './filterListHelpers';
import { useListSettingsTelemetry } from './useListSettingsTelemetry';

interface DropdownSortOptionProps {
    onClick: () => void;
    isActive: boolean;
    iconName: IconName;
    label: string;
}

const DropdownSortOption = ({ onClick, isActive, iconName, label }: DropdownSortOptionProps) => {
    return (
        <DropdownMenuButton onClick={onClick} className="flex items-center w-full justify-space-between">
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

    const sort = useMailSelector(selectSort);
    const filter = useMailSelector(selectFilter);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { sendFileReport, sendReadReport, sendUnreadReport } = useListSettingsTelemetry();
    const { sendNewestFirstReport, sendOldestFirstReport, sendLargestFirstReport, sendSmallestFirstReport } =
        useListSettingsTelemetry();

    const handleFilter = (filter: Filter) => {
        history.push(setFilterInUrl(history.location, filter));
    };

    const handleSort = (sort: Sort) => {
        history.push(setSortInUrl(history.location, sort));
    };

    const reset = () => {
        history.push(resetFilterAndSort(history.location));
    };

    const active = getActiveState(filter, sort);
    return (
        <div className="flex flex-nowrap gap-1">
            {active.showReset && (
                <Button shape="ghost" color="norm" size="tiny" onClick={reset}>{c('Filter').t`Reset`}</Button>
            )}

            <Button
                shape={active.isUnreadActive ? 'solid' : 'outline'}
                size="tiny"
                onClick={() => {
                    handleFilter({ Unread: 1 });
                    sendUnreadReport();
                }}
            >
                {c('Filter').t`Unread`}
            </Button>

            <DropdownButton
                size="tiny"
                shape={active.dropdownActiveCount > 0 ? 'solid' : 'outline'}
                className="flex items-center"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
            >
                <Icon size={3} className="mr-1" name="lines-long-to-small" />
                {active.dropdownActiveCount > 0
                    ? c('Filter').t`Filter (${active.dropdownActiveCount})`
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
                    <p className="p-0 px-4 pt-3 pb-1 text-semibold">{c('Filter').t`Filter`}</p>
                    <DropdownMenuButton
                        onClick={() => {
                            handleFilter({ Unread: 0 });
                            sendReadReport();
                        }}
                        className="text-left"
                    >
                        <span className="flex items-center justify-space-between w-full">
                            {c('Filter').t`Read`}
                            {active.isReadActive && <Icon name="checkmark" />}
                        </span>
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        onClick={() => {
                            handleFilter({ Attachments: 1 });
                            sendFileReport();
                        }}
                        className="text-left"
                    >
                        <span className="flex items-center justify-space-between w-full">
                            {c('Filter').t`Has attachments`}
                            {active.isAttachmentActive && <Icon name="checkmark" />}
                        </span>
                    </DropdownMenuButton>
                </DropdownMenu>
                <hr className="my-2 border-bottom border-weak" />
                <DropdownMenu>
                    <p className="p-0 px-4 pt-3 pb-1 text-semibold">{c('Sort option').t`Sort by`}</p>
                    <DropdownSortOption
                        onClick={() => {
                            handleSort({ sort: 'Time', desc: true });
                            sendNewestFirstReport();
                        }}
                        isActive={active.isNewestFirstActive}
                        iconName="list-arrow-down"
                        label={c('Sort option').t`Newest first`}
                    />

                    <DropdownSortOption
                        onClick={() => {
                            handleSort({ sort: 'Time', desc: false });
                            sendOldestFirstReport();
                        }}
                        isActive={active.isOldestFirstActive}
                        iconName="list-arrow-up"
                        label={c('Sort option').t`Oldest first`}
                    />

                    <DropdownSortOption
                        onClick={() => {
                            handleSort({ sort: 'Size', desc: false });
                            sendLargestFirstReport();
                        }}
                        isActive={active.isLargestFirstActive}
                        iconName="size-arrow-down"
                        label={c('Sort option').t`Largest first`}
                    />

                    <DropdownSortOption
                        onClick={() => {
                            handleSort({ sort: 'Size', desc: true });
                            sendSmallestFirstReport();
                        }}
                        isActive={active.isSmallestFirstActive}
                        iconName="size-arrow-up"
                        label={c('Sort option').t`Smallest first`}
                    />
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};
