import { memo, Ref } from 'react';
import * as React from 'react';
import { c } from 'ttag';
import { Icon, ToolbarButton } from '@proton/components';
import ReadUnreadButtons from './ReadUnreadButtons';
import MoveButtons from './MoveButtons';
import MoreDropdown from './MoreDropdown';
import SelectAll from './SelectAll';
import PagingControls from './PagingControls';
import { Breakpoints } from '../../models/utils';
import NavigationControls from './NavigationControls';
import { MARK_AS_STATUS } from '../../hooks/useMarkAs';
import LabelsAndFolders from './LabelsAndFolders';
import FilterActions from './FilterActions';
import { Filter, Sort } from '../../models/tools';
import SortDropdown from './SortDropdown';
import AllActions from './AllActions';

const defaultSelectedIDs: string[] = [];

interface Props {
    loading?: boolean;
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
    labelID: string;
    elementID?: string;
    messageID?: string;
    selectedIDs: string[];
    checkedIDs: string[];
    elementIDs: string[];
    columnMode: boolean;
    conversationMode: boolean;
    breakpoints: Breakpoints;
    page: number;
    total: number | undefined;
    filter: Filter;
    sort: Sort;
    isSearch: boolean;
    onPage: (page: number) => void;
    onBack: () => void;
    onElement: (elementID: string | undefined) => void;
    onFilter: (filter: Filter) => void;
    onSort: (sort: Sort) => void;
    onMarkAs: (status: MARK_AS_STATUS) => Promise<void>;
    onMove: (labelID: string) => Promise<void>;
    onDelete: () => Promise<void>;
    labelDropdownToggleRef: Ref<() => void>;
    moveDropdownToggleRef: Ref<() => void>;
}

const Toolbar = ({
    labelID = '',
    messageID,
    elementID,
    onCheck,
    columnMode,
    conversationMode,
    breakpoints,
    selectedIDs = defaultSelectedIDs,
    checkedIDs,
    elementIDs,
    loading = false,
    onBack,
    page,
    total,
    filter,
    sort,
    isSearch,
    onPage,
    onElement,
    onFilter,
    onSort,
    onMarkAs,
    onMove,
    onDelete,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
}: Props) => {
    const listInView = columnMode || !elementID;

    return (
        <nav className="toolbar toolbar--heavy flex flex-item-noshrink no-print flex-justify-space-between">
            <div className="flex">
                {listInView ? (
                    <SelectAll
                        labelID={labelID}
                        elementIDs={elementIDs}
                        checkedIDs={checkedIDs}
                        onCheck={onCheck}
                        loading={loading}
                    />
                ) : (
                    <ToolbarButton
                        icon={<Icon name="arrow-left" alt={c('Action').t`Back`} />}
                        onClick={onBack}
                        data-testid="toolbar:back-button"
                    />
                )}
                <ReadUnreadButtons selectedIDs={selectedIDs} onMarkAs={onMarkAs} />
                <MoveButtons
                    labelID={labelID}
                    breakpoints={breakpoints}
                    selectedIDs={selectedIDs}
                    onMove={onMove}
                    onDelete={onDelete}
                />
                <LabelsAndFolders
                    labelID={labelID}
                    selectedIDs={selectedIDs}
                    conversationMode={conversationMode}
                    breakpoints={breakpoints}
                    labelDropdownToggleRef={labelDropdownToggleRef}
                    moveDropdownToggleRef={moveDropdownToggleRef}
                    onBack={onBack}
                />
                <FilterActions filter={filter} onFilter={onFilter} />
                <AllActions labelID={labelID} elementIDs={elementIDs} selectedIDs={selectedIDs} />
                <MoreDropdown
                    breakpoints={breakpoints}
                    labelID={labelID}
                    elementIDs={elementIDs}
                    selectedIDs={selectedIDs}
                />
            </div>
            <div className="flex">
                <SortDropdown
                    labelID={labelID}
                    conversationMode={conversationMode}
                    sort={sort}
                    onSort={onSort}
                    isSearch={isSearch}
                />
                {listInView ? (
                    <PagingControls loading={loading} page={page} total={total} onPage={onPage} />
                ) : (
                    <NavigationControls
                        loading={loading}
                        conversationMode={conversationMode}
                        elementID={elementID}
                        messageID={messageID}
                        elementIDs={elementIDs}
                        onElement={onElement}
                        labelID={labelID}
                    />
                )}
            </div>
        </nav>
    );
};

export default memo(Toolbar);
