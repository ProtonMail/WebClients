import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
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
import { getCurrentType } from '../../helpers/element';

const Toolbar = ({
    labelID = '',
    checkAll,
    onCheckAll,
    mailSettings = {},
    selectedIDs = [],
    loading = false,
    onSort,
    sort,
    desc,
    onFilter,
    filter,
    onPrevious,
    onNext
}) => {
    const type = getCurrentType({ mailSettings, labelID });
    return (
        <nav className="toolbar flex noprint flex-spacebetween">
            <div className="flex">
                <SelectAll checked={checkAll} onCheck={onCheckAll} loading={loading} />
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
                <SortDropdown loading={loading} sort={sort} desc={desc} onSort={onSort} />
                <LayoutDropdown mailSettings={mailSettings} />
                <ToolbarSeparator />
                <ToolbarButton loading={loading} title={c('Action').t`Previous`} onClick={onPrevious}>
                    <Icon className="toolbar-icon rotateZ-90" name="caret" />
                </ToolbarButton>
                <ToolbarButton loading={loading} title={c('Action').t`Next`} onClick={onNext}>
                    <Icon className="toolbar-icon rotateZ-270" name="caret" />
                </ToolbarButton>
            </div>
        </nav>
    );
};

Toolbar.propTypes = {
    checkAll: PropTypes.bool.isRequired,
    desc: PropTypes.number,
    sort: PropTypes.string,
    onCheckAll: PropTypes.func.isRequired,
    labelID: PropTypes.string.isRequired,
    selectedIDs: PropTypes.array.isRequired,
    mailSettings: PropTypes.object.isRequired,
    onPrevious: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    onSort: PropTypes.func.isRequired,
    onFilter: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default Toolbar;
