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

interface Props extends Omit<ToolbarProps, 'columnMode' | 'onBack' | 'onElement' | 'onCheck' | 'breakpoints'> {
    classname: string;
}

const BREAKPOINTS = {
    extratiny: 0,
    tiny: 150,
    small: 440,
    medium: 700,
    large: 1100,
};

const ToolbarColumnWide = ({
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
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    elementIDs,
    loading = false,
    page,
    onPage,
    total,
    onCheckAll,
    addressesDropdown,
    isInDeletedFolder,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const { localIsTiny, localIsExtraTiny, localIsNarrow } = getToolbarResponsiveSizes(breakpoint);
    const { selectAll: isSelectAll } = useSelectAll({ labelID });
    const [labels] = useLabels();
    const [folders] = useFolders();
    const labelName = useMemo(() => getLabelNameForToolbar(labelID, labels, folders), [labelID, labels, folders]);

    return (
        <div className="w-full">
            <nav
                className={clsx(
                    classname,
                    'justify-space-between py-1 pr-2',
                    selectedIDs.length === 0 ? 'pl-4' : 'pl-3'
                )}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div className="flex items-center flex-nowrap toolbar-inner gap-2">
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
                            {!localIsExtraTiny && (
                                <LabelsAndFolders
                                    labelID={labelID}
                                    selectedIDs={selectedIDs}
                                    labelDropdownToggleRef={labelDropdownToggleRef}
                                    moveDropdownToggleRef={moveDropdownToggleRef}
                                    onCheckAll={onCheckAll}
                                />
                            )}
                            {!localIsExtraTiny && !isSelectAll && (
                                <SnoozeToolbarDropdown labelID={labelID} selectedIDs={selectedIDs} />
                            )}
                            <MoreDropdown
                                elementIDs={elementIDs}
                                selectedIDs={selectedIDs}
                                isSearch={isSearch}
                                isNarrow={localIsNarrow}
                                isTiny={localIsExtraTiny}
                                isExtraTiny={localIsExtraTiny}
                                onMove={onMove}
                                onDelete={onDelete}
                                onCheckAll={onCheckAll}
                            />
                            <MoreActions selectedIDs={selectedIDs} />
                        </>
                    )}
                </div>

                {(!localIsTiny && selectedIDs.length > 0) || selectedIDs.length === 0 ? (
                    <div className="flex items-center shrink-0 toolbar-inner gap-2">
                        <PagingControls loading={loading} page={page} total={total} onPage={onPage} />
                    </div>
                ) : undefined}
            </nav>

            <div className="toolbar flex gap-2 flex-nowrap justify-space-between bg-norm border-bottom border-weak pl-4 pr-2 py-1">
                <div className="mr-auto">{selectAll}</div>

                <div className="ml-auto">
                    {isLabelIDNewsletterSubscription(labelID) ? null : (
                        <ListSettings
                            sort={sort}
                            onSort={onSort}
                            onFilter={onFilter}
                            filter={filter}
                            conversationMode={conversationMode}
                            mailSettings={mailSettings}
                            labelID={labelID}
                            filterAsDropdown={localIsTiny}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ToolbarColumnWide;
