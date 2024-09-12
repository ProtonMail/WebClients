import { useRef } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { useActiveBreakpoint, useElementBreakpoints } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { getToolbarResponsiveSizes } from '../../helpers/toolbar/getToolbarResponsiveSizes';
import SnoozeToolbarDropdown from '../list/snooze/containers/SnoozeToolbarDropdown';
import LabelsAndFolders from './LabelsAndFolders';
import MoreActions from './MoreActions';
import MoreDropdown from './MoreDropdown';
import MoveButtons from './MoveButtons';
import NavigationControls from './NavigationControls';
import ReadUnreadButtons from './ReadUnreadButtons';
import type { Props as ToolbarProps } from './Toolbar';

interface Props
    extends Omit<ToolbarProps, 'onCheck' | 'columnMode' | 'sort' | 'onSort' | 'filter' | 'onFilter' | 'mailSettings'> {
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
    breakpoints,
    loading = false,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    isSearch,
    onCheckAll,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const { localIsExtraTiny, localIsNarrow } = getToolbarResponsiveSizes(breakpoint);
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
                        icon={<Icon name="arrow-left" alt={c('Action').t`Back`} />}
                        onClick={onBack}
                        data-testid="toolbar:back-button"
                    />

                    <ReadUnreadButtons selectedIDs={selectedIDs} onMarkAs={onMarkAs} />

                    <MoveButtons
                        labelID={labelID}
                        isExtraTiny={localIsExtraTiny}
                        isNarrow={localIsNarrow}
                        viewportIsNarrow={viewportBreakpoint.viewportWidth['<=small']}
                        selectedIDs={selectedIDs}
                        onMove={onMove}
                        onDelete={onDelete}
                    />

                    {!isTiny ? (
                        <LabelsAndFolders
                            labelID={labelID}
                            selectedIDs={selectedIDs}
                            breakpoints={breakpoints}
                            labelDropdownToggleRef={labelDropdownToggleRef}
                            moveDropdownToggleRef={moveDropdownToggleRef}
                            onCheckAll={onCheckAll}
                        />
                    ) : null}

                    {!isTiny ? <SnoozeToolbarDropdown labelID={labelID} selectedIDs={selectedIDs} /> : null}

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
                        breakpoints={breakpoints}
                        onCheckAll={onCheckAll}
                    />

                    <MoreActions selectedIDs={selectedIDs} />

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
