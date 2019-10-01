import React from 'react';
import PropTypes from 'prop-types';
import { DropdownMenu, DropdownMenuButton, Icon } from 'react-components';
import { c } from 'ttag';

import ToolbarDropdown from './ToolbarDropdown';

const SortDropdown = ({ loading, onSort }) => {
    return (
        <ToolbarDropdown content={<Icon className="toolbar-icon" name="bullet-points" />}>
            <DropdownMenu>
                <DropdownMenuButton className="alignleft" loading={loading} onClick={() => onSort()}>
                    <Icon name="sort-small-large" className="mr0-5" />
                    {c('Action').t`Size: small to large`}
                </DropdownMenuButton>
                <DropdownMenuButton className="alignleft" loading={loading} onClick={() => onSort()}>
                    <Icon name="sort-large-small" className="mr0-5" />
                    {c('Action').t`Size: large to small`}
                </DropdownMenuButton>
                <DropdownMenuButton className="alignleft" loading={loading} onClick={() => onSort()}>
                    <Icon name="sort-new-old" className="mr0-5" />
                    {c('Action').t`Date: new to old`}
                </DropdownMenuButton>
                <DropdownMenuButton className="alignleft" loading={loading} onClick={() => onSort()}>
                    <Icon name="sort-old-new" className="mr0-5" />
                    {c('Action').t`Date: old to new`}
                </DropdownMenuButton>
            </DropdownMenu>
        </ToolbarDropdown>
    );
};

SortDropdown.propTypes = {
    loading: PropTypes.bool,
    onSort: PropTypes.func.isRequired
};

export default SortDropdown;
