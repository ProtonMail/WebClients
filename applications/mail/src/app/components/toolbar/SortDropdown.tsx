import React from 'react';
import { SimpleDropdown, DropdownMenu, DropdownMenuButton, Icon } from 'react-components';
import { c } from 'ttag';

import { Sort } from '../../models/tools';

const TIME = 'Time';
const SIZE = 'Size';

interface Props {
    loading?: boolean;
    conversationMode: boolean;
    sort: Sort;
    onSort: (sort: Sort) => void;
    className?: string;
    hasCaret?: boolean;
}

const SortDropdown = ({ loading, conversationMode, sort: { sort, desc }, onSort, className, hasCaret }: Props) => {
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
            return SORT_OPTIONS.OLD_TO_NEW;
        }
        return SORT_OPTIONS.NEW_TO_OLD;
    };
    return (
        <SimpleDropdown
            hasCaret={hasCaret}
            className={className}
            content={
                <span className="flex flex-align-items-center flex-nowrap" data-test-id="toolbar:sort-dropdown">
                    <span className="text-sm m0 mr0-5">{getTextContent()}</span>
                    <Icon className="toolbar-icon" name="sort" />
                </span>
            }
            title={conversationMode ? c('Title').t`Sort conversations` : c('Title').t`Sort messages`}
        >
            <DropdownMenu>
                <DropdownMenuButton
                    data-test-id="toolbar:sort-new-to-old"
                    isSelected={sort === TIME && desc}
                    className="text-left"
                    loading={loading}
                    onClick={() => onSort({ sort: TIME, desc: true })}
                >
                    {SORT_OPTIONS.NEW_TO_OLD}
                </DropdownMenuButton>
                <DropdownMenuButton
                    data-test-id="toolbar:sort-old-to-new"
                    isSelected={sort === TIME && !desc}
                    className="text-left"
                    loading={loading}
                    onClick={() => onSort({ sort: TIME, desc: false })}
                >
                    {SORT_OPTIONS.OLD_TO_NEW}
                </DropdownMenuButton>
                <DropdownMenuButton
                    data-test-id="toolbar:sort-desc"
                    isSelected={sort === SIZE && desc}
                    className="text-left"
                    loading={loading}
                    onClick={() => onSort({ sort: SIZE, desc: true })}
                >
                    {SORT_OPTIONS.LARGE_TO_SMALL}
                </DropdownMenuButton>
                <DropdownMenuButton
                    data-test-id="toolbar:sort-asc"
                    isSelected={sort === SIZE && !desc}
                    className="text-left"
                    loading={loading}
                    onClick={() => onSort({ sort: SIZE, desc: false })}
                >
                    {SORT_OPTIONS.SMALL_TO_LARGE}
                </DropdownMenuButton>
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default SortDropdown;
