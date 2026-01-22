import { useRef } from 'react';

import { c } from 'ttag';

import { ToolbarButton, useActiveBreakpoint, useElementBreakpoints } from '@proton/components';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import clsx from '@proton/utils/clsx';

import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import { getToolbarResponsiveSizes } from '../../helpers/toolbar/getToolbarResponsiveSizes';
import SnoozeToolbarDropdown from '../list/snooze/containers/SnoozeToolbarDropdown';
import LabelsAndFolders from './LabelsAndFolders';
import MoreActions from './MoreActions';
import MoreDropdown from './MoreDropdown';
import MoveButtons from './MoveButtons';
import NavigationControls from './NavigationControls';
import ReadUnreadButtons from './ReadUnreadButtons';
import type { Props as ToolbarProps } from './Toolbar';

interface Props extends Omit<
    ToolbarProps,
    'onCheck' | 'columnMode' | 'sort' | 'onSort' | 'filter' | 'onFilter' | 'mailSettings' | 'breakpoints'
> {
    classname: string;
}

const BREAKPOINTS = {
    extratiny: 0,
    tiny: 270,
    small: 320,
    medium: 700,
    large: 1100,
};

const ToolbarHeaderMessageNarrow = ({
    classname,
    onBack,
    conversationMode,
    elementIDs,
    elementID,
    messageID,
    onElement,
    selectedIDs,
    onMarkAs,
    labelID,
    onMove,
    onDelete,
    loading = false,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    isSearch,
    onCheckAll,
    isInDeletedFolder,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const { localIsExtraTiny, localIsNarrow } = getToolbarResponsiveSizes(breakpoint);
    const { selectAll: isSelectAll } = useSelectAll({ labelID });

    // We override this value because the "more" dropdown is not displayed in the toolbar otherwise
    const isTiny = localIsNarrow;

    const viewportBreakpoint = useActiveBreakpoint();

    return (
        <div className="flex w-full">
            <nav
                className={clsx(classname, 'toolbar--in-container')}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div className="flex items-center toolbar-inner gap-2">
                    <ToolbarButton
                        icon={<IcArrowLeft alt={c('Action').t`Back`} />}
                        onClick={onBack}
                        data-testid="toolbar:back-button"
                    />

                    {!isInDeletedFolder && (
                        <>
                            <ReadUnreadButtons selectedIDs={selectedIDs} onMarkAs={onMarkAs} />
                            <MoveButtons
                                labelID={labelID}
                                isExtraTiny={localIsExtraTiny}
                                viewportIsNarrow={viewportBreakpoint.viewportWidth['<=small']}
                                selectedIDs={selectedIDs}
                                onMove={onMove}
                                onDelete={onDelete}
                            />

                            {!isTiny && (
                                <LabelsAndFolders
                                    labelID={labelID}
                                    selectedIDs={selectedIDs}
                                    labelDropdownToggleRef={labelDropdownToggleRef}
                                    moveDropdownToggleRef={moveDropdownToggleRef}
                                    onCheckAll={onCheckAll}
                                />
                            )}
                            {!isTiny && !isSelectAll && (
                                <SnoozeToolbarDropdown labelID={labelID} selectedIDs={selectedIDs} />
                            )}
                            <MoreDropdown
                                labelID={labelID}
                                elementIDs={elementIDs}
                                selectedIDs={selectedIDs}
                                isSearch={isSearch}
                                isNarrow={localIsNarrow}
                                isTiny={isTiny}
                                isExtraTiny={localIsExtraTiny}
                                onMove={onMove}
                                onDelete={onDelete}
                                onCheckAll={onCheckAll}
                            />
                            <MoreActions selectedIDs={selectedIDs} />
                        </>
                    )}

                    <NavigationControls
                        loading={loading}
                        conversationMode={conversationMode}
                        elementID={elementID}
                        messageID={messageID}
                        elementIDs={elementIDs}
                        onElement={onElement}
                        labelID={labelID}
                    />
                </div>
            </nav>
        </div>
    );
};

export default ToolbarHeaderMessageNarrow;
