import React from 'react';
import { SimpleDropdown, DropdownMenu, DropdownMenuButton, Button, Icon } from '@proton/components';
import { c } from 'ttag';

import { Sort } from '../../models/tools';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

const TIME = 'Time';
const SIZE = 'Size';

interface Props {
    loading?: boolean;
    conversationMode: boolean;
    sort: Sort;
    onSort: (sort: Sort) => void;
    className?: string;
    hasCaret?: boolean;
    isSearch: boolean;
    isScheduledLabel?: boolean;
}

const SortDropdown = ({
    loading,
    conversationMode,
    sort: { sort, desc },
    onSort,
    className,
    hasCaret,
    isSearch,
    isScheduledLabel = false,
}: Props) => {
    const { getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled } = getESDBStatus();
    const hideSizeSorting = isSearch && dbExists && esEnabled;
    const SORT_OPTIONS = {
        SMALL_TO_LARGE: c('Sort option').t`Smallest first`,
        LARGE_TO_SMALL: c('Sort option').t`Largest first`,
        NEW_TO_OLD: c('Sort option').t`Newest first`,
        OLD_TO_NEW: c('Sort option').t`Oldest first`,
    };
    const getTextContent = () => {
        if (sort === SIZE && !desc) {
            return SORT_OPTIONS.SMALL_TO_LARGE;
        }
        if (sort === SIZE && desc) {
            return SORT_OPTIONS.LARGE_TO_SMALL;
        }
        if (sort === TIME && !desc) {
            // If we are on the scheduled label, we reverse the default sort to have the next to be sent on top (but still displayed as newest)
            return !isScheduledLabel ? SORT_OPTIONS.OLD_TO_NEW : SORT_OPTIONS.NEW_TO_OLD;
        }
        return !isScheduledLabel ? SORT_OPTIONS.NEW_TO_OLD : SORT_OPTIONS.OLD_TO_NEW;
    };
    return (
        <SimpleDropdown
            as={Button}
            shape="ghost"
            size="small"
            hasCaret={hasCaret}
            className={className}
            content={
                <span className="flex flex-align-items-center flex-nowrap" data-testid="toolbar:sort-dropdown">
                    <span className="text-sm m0 mr0-5">{getTextContent()}</span>
                    <Icon className="toolbar-icon" name="sort" />
                </span>
            }
            title={conversationMode ? c('Title').t`Sort conversations` : c('Title').t`Sort messages`}
        >
            <DropdownMenu>
                <DropdownMenuButton
                    data-testid="toolbar:sort-new-to-old"
                    isSelected={!isScheduledLabel ? sort === TIME && desc : sort === TIME && !desc}
                    className="text-left"
                    loading={loading}
                    onClick={() => onSort({ sort: TIME, desc: true })}
                >
                    {SORT_OPTIONS.NEW_TO_OLD}
                </DropdownMenuButton>
                <DropdownMenuButton
                    data-testid="toolbar:sort-old-to-new"
                    isSelected={!isScheduledLabel ? sort === TIME && !desc : sort === TIME && desc}
                    className="text-left"
                    loading={loading}
                    onClick={() => onSort({ sort: TIME, desc: false })}
                >
                    {SORT_OPTIONS.OLD_TO_NEW}
                </DropdownMenuButton>
                {!hideSizeSorting && (
                    <DropdownMenuButton
                        data-testid="toolbar:sort-desc"
                        isSelected={sort === SIZE && desc}
                        className="text-left"
                        loading={loading}
                        onClick={() => onSort({ sort: SIZE, desc: true })}
                    >
                        {SORT_OPTIONS.LARGE_TO_SMALL}
                    </DropdownMenuButton>
                )}
                {!hideSizeSorting && (
                    <DropdownMenuButton
                        data-testid="toolbar:sort-asc"
                        isSelected={sort === SIZE && !desc}
                        className="text-left"
                        loading={loading}
                        onClick={() => onSort({ sort: SIZE, desc: false })}
                    >
                        {SORT_OPTIONS.SMALL_TO_LARGE}
                    </DropdownMenuButton>
                )}
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default SortDropdown;
