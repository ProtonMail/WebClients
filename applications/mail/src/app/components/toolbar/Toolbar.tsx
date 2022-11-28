import { Ref, memo, useRef } from 'react';

import { c } from 'ttag';

import { Vr } from '@proton/atoms';
import { Icon, ToolbarButton } from '@proton/components';

import { MARK_AS_STATUS } from '../../hooks/actions/useMarkAs';
import { useElementBreakpoints } from '../../hooks/useElementBreakpoints';
import { Breakpoints } from '../../models/utils';
import LabelsAndFolders from './LabelsAndFolders';
import MoreActions from './MoreActions';
import MoreDropdown from './MoreDropdown';
import MoveButtons from './MoveButtons';
import NavigationControls from './NavigationControls';
import PagingControls from './PagingControls';
import ReadUnreadButtons from './ReadUnreadButtons';
import SelectAll from './SelectAll';

const defaultSelectedIDs: string[] = [];

interface Props {
    loading?: boolean;
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
    labelID: string;
    elementID?: string;
    messageID?: string;
    selectedIDs: string[];
    checkedIDs: string[];
    elementIDs: string[];
    columnMode: boolean;
    conversationMode: boolean;
    breakpoints: Breakpoints;
    page: number;
    total: number | undefined;
    isSearch: boolean;
    onPage: (page: number) => void;
    onBack: () => void;
    onElement: (elementID: string | undefined) => void;
    onMarkAs: (status: MARK_AS_STATUS) => Promise<void>;
    onMove: (labelID: string) => Promise<void>;
    onDelete: () => Promise<void>;
    labelDropdownToggleRef: Ref<() => void>;
    moveDropdownToggleRef: Ref<() => void>;
}

const Toolbar = ({
    labelID = '',
    messageID,
    elementID,
    onCheck,
    columnMode,
    conversationMode,
    breakpoints,
    selectedIDs = defaultSelectedIDs,
    checkedIDs,
    elementIDs,
    loading = false,
    onBack,
    page,
    total,
    isSearch,
    onPage,
    onElement,
    onMarkAs,
    onMove,
    onDelete,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);

    // Using local breakpoints to be more precise and to deal with sidebar being there or not
    const breakpoint = useElementBreakpoints(toolbarRef, {
        extratiny: 0,
        tiny: 330,
        small: 500,
        medium: 700,
        large: 1100,
    });

    const isTiny = breakpoint === 'extratiny' || breakpoint === 'tiny';
    const isNarrow = breakpoint === 'extratiny' || breakpoint === 'tiny' || breakpoint === 'small';
    const isMedium = breakpoint === 'medium' || breakpoint === 'large';

    const listInView = columnMode || !elementID;

    return (
        <nav
            ref={toolbarRef}
            className="toolbar toolbar--heavy flex flex-item-noshrink no-print flex-justify-space-between"
            data-shortcut-target="mailbox-toolbar"
            aria-label={c('Label').t`Toolbar`}
        >
            <div className="flex toolbar-inner">
                {listInView ? (
                    <SelectAll
                        labelID={labelID}
                        elementIDs={elementIDs}
                        checkedIDs={checkedIDs}
                        onCheck={onCheck}
                        loading={loading}
                    />
                ) : (
                    <ToolbarButton
                        icon={<Icon name="arrow-left" alt={c('Action').t`Back`} />}
                        onClick={onBack}
                        data-testid="toolbar:back-button"
                    />
                )}
                <ReadUnreadButtons selectedIDs={selectedIDs} onMarkAs={onMarkAs} />
                <MoveButtons
                    labelID={labelID}
                    isExtraTiny={breakpoint === 'extratiny'}
                    isNarrow={isNarrow}
                    selectedIDs={selectedIDs}
                    onMove={onMove}
                    onDelete={onDelete}
                />
                {!isTiny ? (
                    <LabelsAndFolders
                        labelID={labelID}
                        selectedIDs={selectedIDs}
                        conversationMode={conversationMode}
                        breakpoints={breakpoints}
                        labelDropdownToggleRef={labelDropdownToggleRef}
                        moveDropdownToggleRef={moveDropdownToggleRef}
                        onBack={onBack}
                    />
                ) : null}
                <MoreActions selectedIDs={selectedIDs} />
            </div>
            <div className="flex toolbar-inner">
                {listInView ? (
                    <>
                        <MoreDropdown
                            labelID={labelID}
                            elementIDs={elementIDs}
                            selectedIDs={selectedIDs}
                            isSearch={isSearch}
                            isNarrow={isNarrow}
                            isTiny={isTiny}
                            isExtraTiny={breakpoint === 'extratiny'}
                            onMove={onMove}
                            onDelete={onDelete}
                            onBack={onBack}
                            breakpoints={breakpoints}
                            conversationMode={conversationMode}
                        />
                        <PagingControls
                            narrowMode={isNarrow}
                            loading={loading}
                            page={page}
                            total={total}
                            onPage={onPage}
                        />
                    </>
                ) : (
                    <>
                        {isMedium && <Vr />}
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
                )}
            </div>
        </nav>
    );
};

export default memo(Toolbar);
