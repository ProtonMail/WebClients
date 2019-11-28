import React from 'react';
import { Icon } from 'react-components';

import ToolbarSeparator from './ToolbarSeparator';
import ReadUnreadButtons from './ReadUnreadButtons';
import ToolbarDropdown from './ToolbarDropdown';
import LayoutDropdown from './LayoutDropdown';
import MoveButtons from './MoveButtons';
import DeleteButton from './DeleteButton';
import SortDropdown from './SortDropdown';
import FilterDropdown from './FilterDropdown';
import SelectAll from './SelectAll';
import MoveDropdown from '../dropdown/MoveDropdown';
import LabelDropdown from '../dropdown/LabelDropdown';
import BackButton from './BackButton';
import PagingControls from './PagingControls';
import { getCurrentType } from '../../helpers/elements';
import { isColumnMode } from '../../helpers/mailSettings';
import { Page, Sort, Filter } from '../../models/tools';

interface Props {
    loading?: boolean;
    checkAll: boolean;
    onCheckAll: () => void;
    labelID: string;
    elementID?: string;
    selectedIDs: string[];
    mailSettings: any;
    page: Page;
    onPage: (page: number) => void;
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    onBack: () => void;
}

const Toolbar = ({
    labelID = '',
    elementID,
    checkAll,
    onCheckAll,
    mailSettings = {},
    selectedIDs = [],
    loading = false,
    onSort,
    sort,
    onFilter,
    filter,
    onBack,
    page,
    onPage
}: Props) => {
    const type = getCurrentType({ mailSettings, labelID });

    const columnMode = isColumnMode(mailSettings);

    return (
        <nav className="toolbar flex noprint flex-spacebetween">
            <div className="flex">
                {columnMode || !elementID ? (
                    <SelectAll checked={checkAll} onCheck={onCheckAll} loading={loading} />
                ) : (
                    <BackButton onClick={onBack} />
                )}
                <ToolbarSeparator />
                <ReadUnreadButtons labelID={labelID} mailSettings={mailSettings} selectedIDs={selectedIDs} />
                <ToolbarSeparator />
                <MoveButtons labelID={labelID} mailSettings={mailSettings} selectedIDs={selectedIDs} />
                <DeleteButton labelID={labelID} mailSettings={mailSettings} selectedIDs={selectedIDs} />
                <ToolbarSeparator />
                <ToolbarDropdown autoClose={false} content={<Icon className="toolbar-icon" name="folder" />}>
                    <MoveDropdown selectedIDs={selectedIDs} type={type} />
                </ToolbarDropdown>
                <ToolbarDropdown autoClose={false} content={<Icon className="toolbar-icon" name="label" />}>
                    <LabelDropdown selectedIDs={selectedIDs} type={type} />
                </ToolbarDropdown>
            </div>
            <div className="flex">
                <FilterDropdown loading={loading} filter={filter} onFilter={onFilter} />
                <SortDropdown loading={loading} sort={sort} onSort={onSort} />
                <LayoutDropdown mailSettings={mailSettings} />
                <ToolbarSeparator />
                <PagingControls loading={loading} page={page} onPage={onPage} />
            </div>
        </nav>
    );
};

export default Toolbar;
