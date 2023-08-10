import React, { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint, useElementBreakpoints, useFolders, useLabels } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { getLabelName } from '../../helpers/labels';
import LabelName from './LabelName';
import LabelsAndFolders from './LabelsAndFolders';
import MoreActions from './MoreActions';
import MoreDropdown from './MoreDropdown';
import MoveButtons from './MoveButtons';
import ReadUnreadButtons from './ReadUnreadButtons';
import { Props as ToolbarProps } from './Toolbar';

interface Props extends ToolbarProps {
    classname: string;
}

const BREAKPOINTS = {
    extratiny: 0,
    tiny: 220,
    small: 300,
    medium: 700,
    large: 1100,
};

const ToolbarHeaderNarrow = ({
    breakpoints,
    classname,
    elementIDs,
    labelDropdownToggleRef,
    labelID,
    moveDropdownToggleRef,
    onDelete,
    onMarkAs,
    onMove,
    selectedIDs,
    isSearch,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const localIsTiny = breakpoint === 'extratiny' || breakpoint === 'tiny';
    const localIsExtraTiny = breakpoint === 'extratiny';
    const localIsNarrow = breakpoint === 'extratiny' || breakpoint === 'tiny' || breakpoint === 'small';

    const [labels] = useLabels();
    const [folders] = useFolders();
    const labelName = useMemo(() => getLabelName(labelID, labels, folders), [labelID, labels, folders]);

    const viewportBreakpoint = useActiveBreakpoint();

    return (
        <div className="flex w100">
            <nav
                className={clsx(classname, 'toolbar--in-container')}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div
                    className={clsx('flex flex-align-items-center toolbar-inner gap-2', !selectedIDs.length && 'pl-2')}
                >
                    <LabelName selectedIDs={selectedIDs} labelName={labelName} />

                    <ReadUnreadButtons selectedIDs={selectedIDs} onMarkAs={onMarkAs} />

                    <MoveButtons
                        labelID={labelID}
                        isExtraTiny={localIsExtraTiny}
                        isNarrow={localIsNarrow}
                        viewportIsNarrow={viewportBreakpoint.isNarrow}
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
            </nav>
        </div>
    );
};

export default ToolbarHeaderNarrow;
