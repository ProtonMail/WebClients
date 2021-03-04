import React from 'react';
import { SimpleDropdown, DropdownMenu, DropdownMenuButton, Icon } from 'react-components';
import { c } from 'ttag';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import { Filter } from '../../models/tools';
import { LABEL_IDS_TO_HUMAN } from '../../constants';

const { DRAFTS, SENT, ALL_DRAFTS, ALL_SENT } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    loading?: boolean;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    onNavigate: (labelID: string) => void;
    className?: string;
    hasCaret?: boolean;
}

const FilterDropdown = ({ labelID, loading, filter = {}, onFilter, onNavigate, className, hasCaret }: Props) => {
    const isDraft = labelID === DRAFTS || labelID === ALL_DRAFTS;
    const isSent = labelID === SENT || labelID === ALL_SENT;
    const isShowMoved = labelID === ALL_DRAFTS || labelID === ALL_SENT;
    const showMovedMessage = isDraft || isSent;
    const noFilterApply = !Object.values(filter).length;

    const FILTER_OPTIONS = {
        SHOW_ALL: c('Filter option').t`Show all`,
        SHOW_UNREAD: c('Filter option').t`Show unread`,
        SHOW_READ: c('Filter option').t`Show read`,
        SHOW_MOVED_MESSAGE: c('Filter option').t`Show moved message`,
        HIDE_MOVED_MESSAGE: c('Filter option').t`Hide moved message`,
    };

    const handleMovedMessage = () => {
        const destination = isDraft ? (labelID === DRAFTS ? ALL_DRAFTS : DRAFTS) : labelID === SENT ? ALL_SENT : SENT;
        onNavigate(LABEL_IDS_TO_HUMAN[destination]);
    };

    const getTextContent = () => {
        if (filter.Unread === 1) {
            return FILTER_OPTIONS.SHOW_UNREAD;
        }
        if (filter.Unread === 0) {
            return FILTER_OPTIONS.SHOW_READ;
        }
        return FILTER_OPTIONS.SHOW_ALL;
    };

    return (
        <SimpleDropdown
            hasCaret={hasCaret}
            className={className}
            content={
                <span className="flex flex-align-items-center flex-nowrap" data-test-id="toolbar:filter-dropdown">
                    <Icon className="toolbar-icon mr0-5" name="filter" />
                    <small>{getTextContent()}</small>
                </span>
            }
            title={c('Title').t`Filters`}
        >
            <DropdownMenu>
                <DropdownMenuButton
                    data-test-id="filter-dropdown:show-all"
                    disabled={noFilterApply}
                    className="text-left"
                    loading={loading}
                    onClick={() => onFilter({})}
                >
                    {FILTER_OPTIONS.SHOW_ALL}
                </DropdownMenuButton>
                <DropdownMenuButton
                    data-test-id="filter-dropdown:show-read"
                    disabled={filter.Unread === 0}
                    className="text-left"
                    loading={loading}
                    onClick={() => onFilter({ Unread: 0 })}
                >
                    {FILTER_OPTIONS.SHOW_READ}
                </DropdownMenuButton>
                <DropdownMenuButton
                    data-test-id="filter-dropdown:show-unread"
                    disabled={filter.Unread === 1}
                    className="text-left"
                    loading={loading}
                    onClick={() => onFilter({ Unread: 1 })}
                >
                    {FILTER_OPTIONS.SHOW_UNREAD}
                </DropdownMenuButton>
                {showMovedMessage && [
                    <DropdownMenuButton
                        data-test-id="filter-dropdown:show-moved"
                        key={0}
                        className="text-left"
                        loading={loading}
                        disabled={isShowMoved}
                        onClick={handleMovedMessage}
                    >
                        {FILTER_OPTIONS.SHOW_MOVED_MESSAGE}
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        data-test-id="filter-dropdown:show-unmoved"
                        key={1}
                        className="text-left"
                        loading={loading}
                        disabled={!isShowMoved}
                        onClick={handleMovedMessage}
                    >
                        {FILTER_OPTIONS.HIDE_MOVED_MESSAGE}
                    </DropdownMenuButton>,
                ]}
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default FilterDropdown;
