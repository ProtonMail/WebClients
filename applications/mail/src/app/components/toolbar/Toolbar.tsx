import React, { useMemo } from 'react';
import { c } from 'ttag';
import { Location } from 'history';
import { Icon, useLabels, useFolders } from 'react-components';
import { identity } from 'proton-shared/lib/helpers/function';
import { MailSettings } from 'proton-shared/lib/interfaces';

import ToolbarSeparator from './ToolbarSeparator';
import ReadUnreadButtons from './ReadUnreadButtons';
import ToolbarDropdown from './ToolbarDropdown';
import LayoutDropdown from './LayoutDropdown';
import MoveButtons from './MoveButtons';
import DeleteButton from './DeleteButton';
import EmptyButton from './EmptyButton';
import SortDropdown from './SortDropdown';
import FilterDropdown from './FilterDropdown';
import SelectAll from './SelectAll';
import MoveDropdown from '../dropdown/MoveDropdown';
import LabelDropdown from '../dropdown/LabelDropdown';
import BackButton from './BackButton';
import PagingControls from './PagingControls';
import { Page, Sort, Filter } from '../../models/tools';
import { Element } from '../../models/element';
import { Breakpoints } from '../../models/utils';
import NavigationControls from './NavigationControls';

interface Props {
    location: Location;
    loading?: boolean;
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
    labelID: string;
    elementID?: string;
    elements: Element[];
    selectedIDs: string[];
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
    onElement: (element: Element) => void;
    onNavigate: (labelID: string) => void;
}

const Toolbar = ({
    location,
    labelID = '',
    elementID,
    elements,
    onCheck,
    mailSettings,
    columnMode,
    conversationMode,
    breakpoints,
    selectedIDs = [],
    loading = false,
    onSort,
    sort,
    onFilter,
    filter,
    onBack,
    page,
    onPage,
    onElement,
    onNavigate
}: Props) => {
    const [labels] = useLabels();
    const [folders] = useFolders();
    const selectedElements = useMemo(
        () =>
            selectedIDs
                .map((elementID) => elements.find((element) => element.ID === elementID) as Element)
                .filter(identity),
        [elements, selectedIDs]
    );
    const listInView = columnMode || !elementID;

    return (
        <nav className="toolbar toolbar--heavy flex noprint flex-spacebetween">
            <div className="flex">
                {listInView ? (
                    <SelectAll
                        labelID={labelID}
                        elements={elements}
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
                    elements={elements}
                />
                <ToolbarSeparator />
                <MoveButtons
                    labelID={labelID}
                    labels={labels}
                    folders={folders}
                    breakpoints={breakpoints}
                    selectedIDs={selectedIDs}
                    onBack={onBack}
                />
                <DeleteButton
                    labelID={labelID}
                    mailSettings={mailSettings}
                    breakpoints={breakpoints}
                    selectedIDs={selectedIDs}
                    location={location}
                />
                <ToolbarSeparator />
                <ToolbarDropdown
                    autoClose={false}
                    noMaxSize={true}
                    disabled={!selectedElements || !selectedElements.length}
                    content={<Icon className="toolbar-icon" name="folder" />}
                    dropDownClassName="moveDropdown"
                    title={c('Title').t`Move to`}
                    data-cy="moveto"
                >
                    {({ onClose, onLock }) => (
                        <MoveDropdown
                            labelID={labelID}
                            elements={selectedElements}
                            conversationMode={conversationMode}
                            onClose={onClose}
                            onLock={onLock}
                            onBack={onBack}
                        />
                    )}
                </ToolbarDropdown>
                <ToolbarDropdown
                    autoClose={false}
                    noMaxSize={true}
                    disabled={!selectedElements || !selectedElements.length}
                    content={<Icon className="toolbar-icon" name="label" />}
                    dropDownClassName="labelDropdown"
                    title={c('Title').t`Label as`}
                    data-cy="labelas"
                >
                    {({ onClose, onLock }) => (
                        <LabelDropdown
                            labelID={labelID}
                            labels={labels}
                            elements={selectedElements}
                            onClose={onClose}
                            onLock={onLock}
                        />
                    )}
                </ToolbarDropdown>
                <EmptyButton labelID={labelID} breakpoints={breakpoints} elements={elements} />
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
                        elements={elements}
                        onElement={onElement}
                    />
                )}
            </div>
        </nav>
    );
};

export default Toolbar;
