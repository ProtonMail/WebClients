import React, { memo } from 'react';
import { c } from 'ttag';
import { Icon, useMailSettings, useLabels, useFolders } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import ToolbarSeparator from './ToolbarSeparator';
import ReadUnreadButtons from './ReadUnreadButtons';
import ToolbarDropdown from './ToolbarDropdown';
import LayoutDropdown from './LayoutDropdown';
import MoveButtons from './MoveButtons';
import EmptyButton from './EmptyButton';
import SortDropdown from './SortDropdown';
import FilterDropdown from './FilterDropdown';
import SelectAll from './SelectAll';
import MoveDropdown from '../dropdown/MoveDropdown';
import LabelDropdown from '../dropdown/LabelDropdown';
import BackButton from './BackButton';
import PagingControls from './PagingControls';
import { Page, Sort, Filter } from '../../models/tools';
import { Breakpoints } from '../../models/utils';
import NavigationControls from './NavigationControls';

const defaultSelectedIDs: string[] = [];

interface Props {
    loading?: boolean;
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
    labelID: string;
    elementID?: string;
    selectedIDs: string[];
    elementIDs: string[];
    mailSettings: MailSettings;
    columnMode: boolean;
    conversationMode: boolean;
    breakpoints: Breakpoints;
    page: Page;
    onPage: (page: number) => void;
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    onBack: () => void;
    onElement: (elementID: string | undefined) => void;
    onNavigate: (labelID: string) => void;
    labelDropdownToggleRef: React.MutableRefObject<() => void>;
    moveDropdownToggleRef: React.MutableRefObject<() => void>;
}

const Toolbar = ({
    labelID = '',
    elementID,
    onCheck,
    mailSettings,
    columnMode,
    conversationMode,
    breakpoints,
    selectedIDs = defaultSelectedIDs,
    elementIDs,
    loading = false,
    onSort,
    sort,
    onFilter,
    filter,
    onBack,
    page,
    onPage,
    onElement,
    onNavigate,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
}: Props) => {
    const [labels] = useLabels();
    const [folders] = useFolders();
    const listInView = columnMode || !elementID;

    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const titleMove = Shortcuts ? (
        <>
            {c('Title').t`Move to`}
            <br />
            <kbd className="bg-global-altgrey noborder">M</kbd>
        </>
    ) : (
        c('Title').t`Move to`
    );

    const titleLabel = Shortcuts ? (
        <>
            {c('Title').t`Label as`}
            <br />
            <kbd className="bg-global-altgrey noborder">L</kbd>
        </>
    ) : (
        c('Title').t`Label as`
    );

    return (
        <nav className="toolbar toolbar--heavy flex noprint flex-spacebetween">
            <div className="flex">
                {listInView ? (
                    <SelectAll
                        labelID={labelID}
                        elementIDs={elementIDs}
                        selectedIDs={selectedIDs}
                        onCheck={onCheck}
                        loading={loading}
                    />
                ) : (
                    <BackButton onClick={onBack} />
                )}
                <ToolbarSeparator />
                <ReadUnreadButtons
                    mailSettings={mailSettings}
                    selectedIDs={selectedIDs}
                    onBack={onBack}
                    labelID={labelID}
                />
                <ToolbarSeparator />
                <MoveButtons
                    labelID={labelID}
                    elementID={elementID}
                    labels={labels}
                    folders={folders}
                    breakpoints={breakpoints}
                    selectedIDs={selectedIDs}
                    onBack={onBack}
                />
                <ToolbarSeparator />
                <ToolbarDropdown
                    autoClose={false}
                    noMaxSize
                    disabled={!selectedIDs || !selectedIDs.length}
                    content={
                        <span className="flex flex-items-center">
                            <Icon className="toolbar-icon" name="folder" />
                        </span>
                    }
                    dropDownClassName="moveDropdown"
                    className="moveDropdownButton"
                    title={titleMove}
                    data-test-id="toolbar:moveto"
                    externalToggleRef={moveDropdownToggleRef}
                >
                    {({ onClose, onLock }) => (
                        <MoveDropdown
                            labelID={labelID}
                            selectedIDs={selectedIDs}
                            conversationMode={conversationMode}
                            onClose={onClose}
                            onLock={onLock}
                            onBack={onBack}
                            breakpoints={breakpoints}
                        />
                    )}
                </ToolbarDropdown>
                <ToolbarDropdown
                    autoClose={false}
                    noMaxSize
                    disabled={!selectedIDs || !selectedIDs.length}
                    content={
                        <span className="flex flex-items-center">
                            <Icon className="toolbar-icon" name="label" />
                        </span>
                    }
                    dropDownClassName="labelDropdown"
                    className="labelDropdownButton"
                    title={titleLabel}
                    data-test-id="toolbar:labelas"
                    externalToggleRef={labelDropdownToggleRef}
                >
                    {({ onClose, onLock }) => (
                        <LabelDropdown
                            labelID={labelID}
                            labels={labels}
                            selectedIDs={selectedIDs}
                            onClose={onClose}
                            onLock={onLock}
                            breakpoints={breakpoints}
                        />
                    )}
                </ToolbarDropdown>
                <EmptyButton labelID={labelID} breakpoints={breakpoints} elementIDs={elementIDs} />
            </div>
            <div className="flex">
                {breakpoints.isDesktop && (
                    <>
                        {listInView && (
                            <>
                                <FilterDropdown
                                    labelID={labelID}
                                    loading={loading}
                                    filter={filter}
                                    onFilter={onFilter}
                                    onNavigate={onNavigate}
                                />
                                <SortDropdown
                                    loading={loading}
                                    conversationMode={conversationMode}
                                    sort={sort}
                                    onSort={onSort}
                                />
                            </>
                        )}
                        <LayoutDropdown mailSettings={mailSettings} />
                        <ToolbarSeparator />
                    </>
                )}
                {listInView ? (
                    <PagingControls loading={loading} page={page} onPage={onPage} />
                ) : (
                    <NavigationControls
                        loading={loading}
                        conversationMode={conversationMode}
                        elementID={elementID}
                        elementIDs={elementIDs}
                        onElement={onElement}
                    />
                )}
            </div>
        </nav>
    );
};

export default memo(Toolbar);
