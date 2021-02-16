import React from 'react';
import { DropdownMenu, DropdownMenuButton, Icon } from 'react-components';
import { c } from 'ttag';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import ToolbarDropdown from './ToolbarDropdown';
import { Filter } from '../../models/tools';
import { LABEL_IDS_TO_HUMAN } from '../../constants';

const { DRAFTS, SENT, ALL_DRAFTS, ALL_SENT } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    loading?: boolean;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    onNavigate: (labelID: string) => void;
}

const FilterDropdown = ({ labelID, loading, filter = {}, onFilter, onNavigate }: Props) => {
    const isDraft = labelID === DRAFTS || labelID === ALL_DRAFTS;
    const isSent = labelID === SENT || labelID === ALL_SENT;
    const isShowMoved = labelID === ALL_DRAFTS || labelID === ALL_SENT;
    const showMovedMessage = isDraft || isSent;

    const handleMovedMessage = () => {
        const destination = isDraft ? (labelID === DRAFTS ? ALL_DRAFTS : DRAFTS) : labelID === SENT ? ALL_SENT : SENT;
        onNavigate(LABEL_IDS_TO_HUMAN[destination]);
    };

    return (
        <ToolbarDropdown
            content={
                <span className="flex flex-align-items-center" data-test-id="toolbar:filter-dropdown">
                    <Icon className="toolbar-icon" name="bullet-points" />
                </span>
            }
            title={c('Title').t`Filters`}
        >
            {() => (
                <DropdownMenu>
                    <DropdownMenuButton
                        data-test-id="filter-dropdown:show-all"
                        disabled={Object.values(filter).length === 0}
                        className="text-left"
                        loading={loading}
                        onClick={() => onFilter({})}
                    >
                        <Icon name="bullet-points" className="mr0-5" />
                        {c('Action').t`Show all`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        data-test-id="filter-dropdown:show-unread"
                        disabled={filter.Unread === 1}
                        className="text-left"
                        loading={loading}
                        onClick={() => onFilter({ Unread: 1 })}
                    >
                        <Icon name="unread" className="mr0-5" />
                        {c('Action').t`Show unread`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        data-test-id="filter-dropdown:show-read"
                        disabled={filter.Unread === 0}
                        className="text-left"
                        loading={loading}
                        onClick={() => onFilter({ Unread: 0 })}
                    >
                        <Icon name="read" className="mr0-5" />
                        {c('Action').t`Show read`}
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
                            <Icon name="add" className="mr0-5" />
                            {c('Action').t`Show moved message`}
                        </DropdownMenuButton>,
                        <DropdownMenuButton
                            data-test-id="filter-dropdown:show-unmoved"
                            key={1}
                            className="text-left"
                            loading={loading}
                            disabled={!isShowMoved}
                            onClick={handleMovedMessage}
                        >
                            <Icon name="add" className="mr0-5" />
                            {c('Action').t`Hide moved message`}
                        </DropdownMenuButton>,
                    ]}
                </DropdownMenu>
            )}
        </ToolbarDropdown>
    );
};

export default FilterDropdown;
