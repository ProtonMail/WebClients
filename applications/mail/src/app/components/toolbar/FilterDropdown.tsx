import React from 'react';
import { DropdownMenu, DropdownMenuButton, Icon } from 'react-components';
import { c } from 'ttag';

import ToolbarDropdown from './ToolbarDropdown';
import { Filter } from '../../models/tools';

interface Props {
    loading?: boolean;
    filter: Filter;
    onFilter: (filter: Filter) => void;
}

const FilterDropdown = ({ loading, filter = {}, onFilter }: Props) => {
    return (
        <ToolbarDropdown content={<Icon className="toolbar-icon" name="bullet-points" />}>
            {() => (
                <DropdownMenu>
                    <DropdownMenuButton
                        disabled={Object.values(filter).length === 0}
                        className="alignleft"
                        loading={loading}
                        onClick={() => onFilter({})}
                    >
                        <Icon name="bullet-points" className="mr0-5" />
                        {c('Action').t`Show all`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        disabled={filter.Unread === 1}
                        className="alignleft"
                        loading={loading}
                        onClick={() => onFilter({ Unread: 1 })}
                    >
                        <Icon name="unread" className="mr0-5" />
                        {c('Action').t`Show unread`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        disabled={filter.Unread === 0}
                        className="alignleft"
                        loading={loading}
                        onClick={() => onFilter({ Unread: 0 })}
                    >
                        <Icon name="read" className="mr0-5" />
                        {c('Action').t`Show read`}
                    </DropdownMenuButton>
                </DropdownMenu>
            )}
        </ToolbarDropdown>
    );
};

export default FilterDropdown;
