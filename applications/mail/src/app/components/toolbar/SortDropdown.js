import React from 'react';
import PropTypes from 'prop-types';
import { DropdownMenu, DropdownMenuButton, Icon } from 'react-components';
import { c } from 'ttag';

import ToolbarDropdown from './ToolbarDropdown';

const ASC = 0;
const DESC = 1;
const TIME = 'Time';
const SIZE = 'Size';

const ICONS = {
    [SIZE]: {
        [ASC]: 'sort-small-large',
        [DESC]: 'sort-large-small'
    },
    [TIME]: {
        [ASC]: 'sort-old-new',
        [DESC]: 'sort-new-old'
    }
};

const SortDropdown = ({ loading, sort = 'Time', desc = ASC, onSort }) => {
    return (
        <ToolbarDropdown content={<Icon className="toolbar-icon" name={ICONS[sort][desc]} />}>
            <DropdownMenu>
                <DropdownMenuButton
                    disabled={sort === SIZE && desc === ASC}
                    className="alignleft"
                    loading={loading}
                    onClick={() => onSort({ Sort: SIZE, Desc: ASC })}
                >
                    <Icon name={ICONS[SIZE][ASC]} className="mr0-5" />
                    {c('Action').t`Size: small to large`}
                </DropdownMenuButton>
                <DropdownMenuButton
                    disabled={sort === SIZE && desc === DESC}
                    className="alignleft"
                    loading={loading}
                    onClick={() => onSort({ Sort: SIZE, Desc: DESC })}
                >
                    <Icon name={ICONS[SIZE][DESC]} className="mr0-5" />
                    {c('Action').t`Size: large to small`}
                </DropdownMenuButton>
                <DropdownMenuButton
                    disabled={sort === TIME && desc === DESC}
                    className="alignleft"
                    loading={loading}
                    onClick={() => onSort({ Sort: TIME, Desc: DESC })}
                >
                    <Icon name={ICONS[TIME][DESC]} className="mr0-5" />
                    {c('Action').t`Date: new to old`}
                </DropdownMenuButton>
                <DropdownMenuButton
                    disabled={sort === TIME && desc === ASC}
                    className="alignleft"
                    loading={loading}
                    onClick={() => onSort({ Sort: TIME, Desc: ASC })}
                >
                    <Icon name={ICONS[TIME][ASC]} className="mr0-5" />
                    {c('Action').t`Date: old to new`}
                </DropdownMenuButton>
            </DropdownMenu>
        </ToolbarDropdown>
    );
};

SortDropdown.propTypes = {
    sort: PropTypes.string,
    desc: PropTypes.number,
    loading: PropTypes.bool,
    onSort: PropTypes.func.isRequired
};

export default SortDropdown;
