import { useRef } from 'react';

import { c } from 'ttag';

import { Vr } from '@proton/atoms/Vr';
import { Icon, ToolbarButton } from '@proton/components';
import { useElementBreakpoints } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { getToolbarResponsiveSizes } from '../../helpers/toolbar/getToolbarResponsiveSizes';
import SnoozeToolbarDropdown from '../list/snooze/containers/SnoozeToolbarDropdown';
import LabelsAndFolders from './LabelsAndFolders';
import MoveButtons from './MoveButtons';
import NavigationControls from './NavigationControls';
import ReadUnreadButtons from './ReadUnreadButtons';
import type { Props as ToolbarProps } from './Toolbar';

interface Props
    extends Omit<
        ToolbarProps,
        'onCheck' | 'columnMode' | 'total' | 'isSearch' | 'sort' | 'onSort' | 'onFilter' | 'filter' | 'mailSettings'
    > {
    classname: string;
}

const BREAKPOINTS = {
    extratiny: 0,
    tiny: 100,
    small: 440,
    medium: 700,
    large: 1100,
};

const ToolbarHeaderMessageWide = ({
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
    onCheckAll,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const { localIsTiny, localIsNarrow } = getToolbarResponsiveSizes(breakpoint);

    return (
        <div>
            <nav
                className={clsx(classname, 'toolbar--in-container')}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div className="flex items-center toolbar-inner flex-nowrap gap-2">
                    <ToolbarButton
                        icon={<Icon name="arrow-left" alt={c('Action').t`Back`} />}
                        onClick={onBack}
                        data-testid="toolbar:back-button"
                    />

                    <ReadUnreadButtons selectedIDs={selectedIDs} onMarkAs={onMarkAs} />

                    <MoveButtons
                        labelID={labelID}
                        isExtraTiny={breakpoint === 'extratiny'}
                        isNarrow={localIsNarrow}
                        selectedIDs={selectedIDs}
                        onMove={onMove}
                        onDelete={onDelete}
                    />

                    <LabelsAndFolders
                        labelID={labelID}
                        selectedIDs={selectedIDs}
                        breakpoints={breakpoints}
                        labelDropdownToggleRef={labelDropdownToggleRef}
                        moveDropdownToggleRef={moveDropdownToggleRef}
                        onCheckAll={onCheckAll}
                    />

                    <SnoozeToolbarDropdown labelID={labelID} selectedIDs={selectedIDs} />

                    {!localIsTiny ? (
                        <>
                            <Vr />
                            <NavigationControls
                                loading={loading}
                                conversationMode={conversationMode}
                                elementID={elementID}
                                messageID={messageID}
                                elementIDs={elementIDs}
                                onElement={onElement}
                                labelID={labelID}
                            />
                        </>
                    ) : null}
                </div>
            </nav>
        </div>
    );
};

export default ToolbarHeaderMessageWide;
