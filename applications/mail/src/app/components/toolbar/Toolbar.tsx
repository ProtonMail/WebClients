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

import './Toolbar.scss';
import { Breakpoints } from '../../models/utils';

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
    breakpoints: Breakpoints;
    page: Page;
    onPage: (page: number) => void;
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    onBack: () => void;
}

const Toolbar = ({
    location,
    labelID = '',
    elementID,
    elements,
    onCheck,
    mailSettings,
    columnMode,
    breakpoints,
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
    const [labels] = useLabels();
    const [folders] = useFolders();
    const selectedElements = useMemo(
        () =>
            selectedIDs
                .map((elementID) => elements.find((element) => element.ID === elementID) as Element)
                .filter(identity),
        [elements, selectedIDs]
    );

    return (
        <nav className="toolbar toolbar--heavy flex noprint flex-spacebetween">
            <div className="flex">
                {columnMode || !elementID ? (
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
                    labelID={labelID}
                    mailSettings={mailSettings}
                    selectedIDs={selectedIDs}
                    location={location}
                />
                <ToolbarSeparator />
                <MoveButtons
                    labelID={labelID}
                    labels={labels}
                    folders={folders}
                    mailSettings={mailSettings}
                    breakpoints={breakpoints}
                    selectedIDs={selectedIDs}
                    location={location}
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
                    disabled={!selectedIDs.length}
                    content={<Icon className="toolbar-icon" name="folder" />}
                    dropDownClassName="moveDropdown"
                    title={c('Title').t`Move to`}
                >
                    {({ onClose, onLock }) => (
                        <MoveDropdown labelID={labelID} elements={selectedElements} onClose={onClose} onLock={onLock} />
                    )}
                </ToolbarDropdown>
                <ToolbarDropdown
                    autoClose={false}
                    noMaxSize={true}
                    disabled={!selectedIDs.length}
                    content={<Icon className="toolbar-icon" name="label" />}
                    dropDownClassName="labelDropdown"
                    title={c('Title').t`Label as`}
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
                        <FilterDropdown loading={loading} filter={filter} onFilter={onFilter} />
                        <SortDropdown loading={loading} sort={sort} onSort={onSort} />
                        <LayoutDropdown mailSettings={mailSettings} />
                        <ToolbarSeparator />
                    </>
                )}
                <PagingControls loading={loading} page={page} onPage={onPage} />
            </div>
        </nav>
    );
};

export default Toolbar;
