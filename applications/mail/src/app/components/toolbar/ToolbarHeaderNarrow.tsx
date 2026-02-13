import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint, useElementBreakpoints } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import { isInDeletedFolder } from '../../helpers/elements';
import { getLabelNameForToolbar } from '../../helpers/labels';
import { getToolbarResponsiveSizes } from '../../helpers/toolbar/getToolbarResponsiveSizes';
import SnoozeToolbarDropdown from '../list/snooze/containers/SnoozeToolbarDropdown';
import LabelName from './LabelName';
import LabelsAndFolders from './LabelsAndFolders';
import MoreActions from './MoreActions';
import MoreDropdown from './MoreDropdown';
import MoveButtons from './MoveButtons';
import ReadUnreadButtons from './ReadUnreadButtons';
import type { Props as ToolbarProps } from './Toolbar';

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
    onCheckAll,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);
    const { localIsTiny, localIsExtraTiny, localIsNarrow } = getToolbarResponsiveSizes(breakpoint);
    const isRetentionPoliciesEnabled = useFlag('DataRetentionPolicy');
    const { selectAll: isSelectAll } = useSelectAll({ labelID });

    const [labels] = useLabels();
    const [folders] = useFolders();
    const labelName = useMemo(() => getLabelNameForToolbar(labelID, labels, folders), [labelID, labels, folders]);

    const viewportBreakpoint = useActiveBreakpoint();

    return (
        <div className="flex w-full">
            <nav
                className={clsx(classname, 'toolbar--in-container')}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div className={clsx('flex items-center toolbar-inner gap-2', !selectedIDs.length && 'pl-2')}>
                    <LabelName selectedIDs={selectedIDs} labelName={labelName} />

                    {!isInDeletedFolder(isRetentionPoliciesEnabled, labelID) && (
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
                                <SnoozeToolbarDropdown labelID={labelID} selectedIDs={selectedIDs} />
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
            </nav>
        </div>
    );
};

export default ToolbarHeaderNarrow;
