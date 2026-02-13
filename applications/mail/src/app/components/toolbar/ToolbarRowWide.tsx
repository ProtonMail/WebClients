import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useElementBreakpoints } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import clsx from '@proton/utils/clsx';

import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import { getLabelNameForToolbar, isLabelIDNewsletterSubscription } from '../../helpers/labels';
import { getToolbarResponsiveSizes } from '../../helpers/toolbar/getToolbarResponsiveSizes';
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

interface Props extends Omit<
    ToolbarProps,
    'onCheck' | 'checkedIDs' | 'columnMode' | 'onBack' | 'onElement' | 'breakpoints'
> {
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
    addressesDropdown,
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
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    elementIDs,
    loading = false,
    page,
    onPage,
    total,
    onCheckAll,
    isInDeletedFolder,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const { localIsTiny, localIsExtraTiny, localIsNarrow } = getToolbarResponsiveSizes(breakpoint);
    const localIsNarrowAndMedium = localIsNarrow || breakpoint === 'medium';
    const { selectAll: isSelectAll } = useSelectAll({ labelID });

    const [labels] = useLabels();
    const [folders] = useFolders();
    const labelName = useMemo(() => getLabelNameForToolbar(labelID, labels, folders), [labelID, labels, folders]);

    return (
        <div className="w-full">
            <nav
                className={clsx(classname, 'justify-space-between py-1 pl-4 pr-2')}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div className="flex items-center flex-nowrap toolbar-inner gap-2">
                    {selectAll}
                    <LabelName selectedIDs={selectedIDs} labelName={labelName} />
                    {addressesDropdown}

                    {!isInDeletedFolder && (
                        <>
                            <ReadUnreadButtons selectedIDs={selectedIDs} onMarkAs={onMarkAs} />
                            <MoveButtons
                                labelID={labelID}
                                isExtraTiny={localIsExtraTiny}
                                selectedIDs={selectedIDs}
                                onMove={onMove}
                                onDelete={onDelete}
                            />
                            {!localIsTiny && (
                                <LabelsAndFolders
                                    labelID={labelID}
                                    selectedIDs={selectedIDs}
                                    labelDropdownToggleRef={labelDropdownToggleRef}
                                    moveDropdownToggleRef={moveDropdownToggleRef}
                                    onCheckAll={onCheckAll}
                                />
                            )}
                            {!localIsTiny && !isSelectAll && (
                                <SnoozeToolbarDropdown selectedIDs={selectedIDs} labelID={labelID} />
                            )}
                            <MoreDropdown
                                elementIDs={elementIDs}
                                selectedIDs={selectedIDs}
                                isSearch={isSearch}
                                isNarrow={localIsNarrow}
                                isTiny={localIsTiny}
                                isExtraTiny={localIsExtraTiny}
                                onMove={onMove}
                                onDelete={onDelete}
                                onCheckAll={onCheckAll}
                            />
                            <MoreActions selectedIDs={selectedIDs} />
                        </>
                    )}
                </div>

                <div className="flex items-center shrink-0 flex-nowrap toolbar-inner gap-2">
                    {isLabelIDNewsletterSubscription(labelID) ? null : (
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
                    )}

                    <PagingControls loading={loading} page={page} total={total} onPage={onPage} />
                </div>
            </nav>
        </div>
    );
};

export default ToolbarRowWide;
