import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useElementBreakpoints } from '@proton/components';
import { useFolders, useLabels } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { useMailSelector } from 'proton-mail/store/hooks';

import { getLabelName } from '../../helpers/labels';
import { getToolbarResponsiveSizes } from '../../helpers/toolbar/getToolbarResponsiveSizes';
import { pageSize as pageSizeSelector } from '../../store/elements/elementsSelectors';
import ListSettings from '../list/ListSettings';
import SnoozeToolbarDropdown from '../list/snooze/containers/SnoozeToolbarDropdown';
import LabelName from './LabelName';
import LabelsAndFolders from './LabelsAndFolders';
import MoreActions from './MoreActions';
import MoreDropdown from './MoreDropdown';
import MoveButtons from './MoveButtons';
import PagingControls from './PagingControls';
import ReadUnreadButtons from './ReadUnreadButtons';
import type { Props as ToolbarProps } from './Toolbar';

interface Props extends Omit<ToolbarProps, 'onCheck' | 'checkedIDs' | 'columnMode' | 'onBack' | 'onElement'> {
    classname: string;
}

const BREAKPOINTS = {
    extratiny: 0,
    tiny: 100,
    small: 400,
    medium: 800,
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
    onCheckAll,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const { localIsTiny, localIsExtraTiny, localIsNarrow } = getToolbarResponsiveSizes(breakpoint);
    const localIsNarrowAndMedium = localIsNarrow || breakpoint === 'medium';

    const [labels] = useLabels();
    const [folders] = useFolders();
    const labelName = useMemo(() => getLabelName(labelID, labels, folders), [labelID, labels, folders]);

    const pageSize = useMailSelector(pageSizeSelector);

    return (
        <div>
            <nav
                className={clsx(classname, 'justify-space-between py-1 pl-4 pr-2')}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div className="flex items-center flex-nowrap toolbar-inner gap-2">
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
                            onCheckAll={onCheckAll}
                        />
                    ) : null}

                    {!localIsTiny ? <SnoozeToolbarDropdown selectedIDs={selectedIDs} labelID={labelID} /> : null}

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

                <div className="flex items-center shrink-0 flex-nowrap toolbar-inner gap-2">
                    <ListSettings
                        sort={sort}
                        onSort={onSort}
                        onFilter={onFilter}
                        filter={filter}
                        conversationMode={conversationMode}
                        mailSettings={mailSettings}
                        labelID={labelID}
                        filterAsDropdown={localIsNarrowAndMedium}
                    />

                    <PagingControls loading={loading} page={page} pageSize={pageSize} total={total} onPage={onPage} />
                </div>
            </nav>
        </div>
    );
};

export default ToolbarRowWide;
