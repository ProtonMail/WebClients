import React from 'react';
import { DropdownMenu, DropdownMenuButton, Icon } from 'react-components';
import { c } from 'ttag';

import ToolbarDropdown from './ToolbarDropdown';
import { Sort } from '../../models/tools';

const ASC = 0;
const DESC = 1;
const TIME = 'Time';
const SIZE = 'Size';

const ICONS = {
    [SIZE]: {
        [ASC]: 'sort-small-large',
        [DESC]: 'sort-large-small',
    },
    [TIME]: {
        [ASC]: 'sort-old-new',
        [DESC]: 'sort-new-old',
    },
};

interface Props {
    loading?: boolean;
    conversationMode: boolean;
    sort: Sort;
    onSort: (sort: Sort) => void;
}

const SortDropdown = ({ loading, conversationMode, sort: { sort, desc }, onSort }: Props) => {
    return (
        <ToolbarDropdown
            content={
                <span className="flex flex-align-items-center" data-test-id="toolbar:sort-dropdown">
                    <Icon className="toolbar-icon" name={ICONS[sort][desc ? DESC : ASC]} />
                </span>
            }
            title={conversationMode ? c('Title').t`Sort view conversations` : c('Title').t`Sort view messages`}
        >
            {() => (
                <DropdownMenu>
                    <DropdownMenuButton
                        data-test-id="toolbar:sort-asc"
                        disabled={sort === SIZE && !desc}
                        className="text-left"
                        loading={loading}
                        onClick={() => onSort({ sort: SIZE, desc: false })}
                    >
                        <Icon name={ICONS[SIZE][ASC]} className="mr0-5" />
                        {c('Action').t`Size: small to large`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        data-test-id="toolbar:sort-desc"
                        disabled={sort === SIZE && desc}
                        className="text-left"
                        loading={loading}
                        onClick={() => onSort({ sort: SIZE, desc: true })}
                    >
                        <Icon name={ICONS[SIZE][DESC]} className="mr0-5" />
                        {c('Action').t`Size: large to small`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        data-test-id="toolbar:sort-new-to-old"
                        disabled={sort === TIME && desc}
                        className="text-left"
                        loading={loading}
                        onClick={() => onSort({ sort: TIME, desc: true })}
                    >
                        <Icon name={ICONS[TIME][DESC]} className="mr0-5" />
                        {c('Action').t`Date: new to old`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        data-test-id="toolbar:sort-old-to-new"
                        disabled={sort === TIME && !desc}
                        className="text-left"
                        loading={loading}
                        onClick={() => onSort({ sort: TIME, desc: false })}
                    >
                        <Icon name={ICONS[TIME][ASC]} className="mr0-5" />
                        {c('Action').t`Date: old to new`}
                    </DropdownMenuButton>
                </DropdownMenu>
            )}
        </ToolbarDropdown>
    );
};

export default SortDropdown;
