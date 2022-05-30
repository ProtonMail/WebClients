import { memo, Ref, useRef } from 'react';
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
import { useElementBreakpoints } from '../../hooks/useElementBreakpoints';

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
    const toolbarRef = useRef<HTMLDivElement>(null);

    // Using local breakpoints to be more precise and to deal with sidebar being there or not
    const breakpoint = useElementBreakpoints(toolbarRef, {
        tiny: 0,
        small: 500,
        medium: 700,
        large: 1100,
    });

    const isNarrow = breakpoint === 'tiny' || breakpoint === 'small';

    const listInView = columnMode || !elementID;

    return (
        <nav
            ref={toolbarRef}
            className="toolbar toolbar--heavy flex flex-item-noshrink no-print flex-justify-space-between"
        >
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
                    isNarrow={isNarrow}
                    selectedIDs={selectedIDs}
                    onMove={onMove}
                    onDelete={onDelete}
                />
                {breakpoint !== 'tiny' ? (
                    <LabelsAndFolders
                        labelID={labelID}
                        selectedIDs={selectedIDs}
                        conversationMode={conversationMode}
                        breakpoints={breakpoints}
                        labelDropdownToggleRef={labelDropdownToggleRef}
                        moveDropdownToggleRef={moveDropdownToggleRef}
                        onBack={onBack}
                    />
                ) : null}
                {breakpoint === 'large' ? <FilterActions icon={false} filter={filter} onFilter={onFilter} /> : null}
                <MoreDropdown
                    labelID={labelID}
                    elementIDs={elementIDs}
                    selectedIDs={selectedIDs}
                    isSearch={isSearch}
                    isNarrow={isNarrow}
                    isTiny={breakpoint === 'tiny'}
                    onMove={onMove}
                    onDelete={onDelete}
                    onBack={onBack}
                    breakpoints={breakpoints}
                    conversationMode={conversationMode}
                />
            </div>
            <div className="flex">
                {breakpoint !== 'large' ? (
                    <FilterActions icon={breakpoint !== 'large'} filter={filter} onFilter={onFilter} />
                ) : null}
                <SortDropdown
                    labelID={labelID}
                    conversationMode={conversationMode}
                    icon={breakpoint !== 'large'}
                    sort={sort}
                    onSort={onSort}
                    isSearch={isSearch}
                />
                {listInView ? (
                    <PagingControls narrowMode={isNarrow} loading={loading} page={page} total={total} onPage={onPage} />
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
