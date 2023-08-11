import React, { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useElementBreakpoints, useFolders, useLabels } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { getLabelName } from '../../helpers/labels';
import ListSettings from '../list/ListSettings';
import LabelName from './LabelName';
import LabelsAndFolders from './LabelsAndFolders';
import MoreActions from './MoreActions';
import MoreDropdown from './MoreDropdown';
import MoveButtons from './MoveButtons';
import PagingControls from './PagingControls';
import ReadUnreadButtons from './ReadUnreadButtons';
import { Props as ToolbarProps } from './Toolbar';

interface Props extends Omit<ToolbarProps, 'onCheck' | 'checkedIDs' | 'columnMode' | 'onBack' | 'onElement'> {
    classname: string;
}

const BREAKPOINTS = {
    extratiny: 0,
    tiny: 100,
    small: 400,
    medium: 740,
    large: 1100,
};

const ToolbarRowWide = ({
    classname,
    selectAll,
    sort,
    onSort,
    filter,
    onFilter,
    conversationMode,
    mailSettings,
    isSearch,
    labelID,
    selectedIDs,
    onMarkAs,
    onMove,
    onDelete,
    breakpoints,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    elementIDs,
    loading = false,
    page,
    onPage,
    total,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const localIsTiny = breakpoint === 'extratiny' || breakpoint === 'tiny';
    const localIsExtraTiny = breakpoint === 'extratiny';
    const localIsNarrow = breakpoint === 'extratiny' || breakpoint === 'tiny' || breakpoint === 'small';

    const [labels] = useLabels();
    const [folders] = useFolders();
    const labelName = useMemo(() => getLabelName(labelID, labels, folders), [labelID, labels, folders]);

    return (
        <div>
            <nav
                className={clsx(classname, 'flex-justify-space-between py-1 pl-4 pr-2')}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div className="flex flex-align-items-center toolbar-inner gap-2">
                    {selectAll}
                    <LabelName selectedIDs={selectedIDs} labelName={labelName} />

                    <ReadUnreadButtons selectedIDs={selectedIDs} onMarkAs={onMarkAs} />

                    <MoveButtons
                        labelID={labelID}
                        isExtraTiny={localIsExtraTiny}
                        isNarrow={localIsNarrow}
                        selectedIDs={selectedIDs}
                        onMove={onMove}
                        onDelete={onDelete}
                    />

                    {!localIsTiny ? (
                        <LabelsAndFolders
                            labelID={labelID}
                            selectedIDs={selectedIDs}
                            breakpoints={breakpoints}
                            labelDropdownToggleRef={labelDropdownToggleRef}
                            moveDropdownToggleRef={moveDropdownToggleRef}
                        />
                    ) : null}

                    <MoreDropdown
                        labelID={labelID}
                        elementIDs={elementIDs}
                        selectedIDs={selectedIDs}
                        isSearch={isSearch}
                        isNarrow={localIsNarrow}
                        isTiny={localIsTiny}
                        isExtraTiny={localIsExtraTiny}
                        onMove={onMove}
                        onDelete={onDelete}
                        breakpoints={breakpoints}
                    />

                    <MoreActions selectedIDs={selectedIDs} />
                </div>

                <div className="flex flex-align-items-center flex-item-noshrink flex-nowrap toolbar-inner gap-2">
                    <ListSettings
                        sort={sort}
                        onSort={onSort}
                        onFilter={onFilter}
                        filter={filter}
                        conversationMode={conversationMode}
                        mailSettings={mailSettings}
                        isSearch={isSearch}
                        labelID={labelID}
                        filterAsDropdown={localIsNarrow}
                    />

                    <PagingControls loading={loading} page={page} total={total} onPage={onPage} />
                </div>
            </nav>
        </div>
    );
};

export default ToolbarRowWide;
