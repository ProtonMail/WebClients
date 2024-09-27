import type { Ref } from 'react';
import { memo } from 'react';

import type { Breakpoints } from '@proton/components';
import { pick } from '@proton/shared/lib/helpers/object';
import type { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import type { Props as ListSettingsProps } from '../list/ListSettings';
import SelectAll from './SelectAll';
import ToolbarColumnWide from './ToolbarColumnWide';
import ToolbarHeaderMessageNarrow from './ToolbarHeaderMessageNarrow';
import ToolbarHeaderMessageWide from './ToolbarHeaderMessageWide';
import ToolbarHeaderNarrow from './ToolbarHeaderNarrow';
import ToolbarNarrow from './ToolbarNarrow';
import ToolbarRowWide from './ToolbarRowWide';

const defaultSelectedIDs: string[] = [];
const BASE_TOOLBAR_CLASSNAME = 'toolbar toolbar--heavy flex flex-nowrap shrink-0 items-center gap-2 no-print flex-auto';

export interface Props extends ListSettingsProps {
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
    bordered?: boolean;
    toolbarInHeader?: boolean;
    onCheckAll?: (check: boolean) => void;
}

type Variant =
    | 'columnWide'
    | 'rowWide'
    | 'headerMessageWide'
    | 'headerMessageNarrow'
    | 'headerNarrow'
    | 'narrow'
    | undefined;

const Toolbar = (props: Props) => {
    const { elementID, columnMode, breakpoints, selectedIDs = defaultSelectedIDs, toolbarInHeader } = props;
    const viewPortIsNarrow = breakpoints.viewportWidth['<=small'] || breakpoints.viewportWidth.medium;
    const listInView = columnMode || !elementID;

    const variant = Object.entries({
        headerNarrow: () => toolbarInHeader && viewPortIsNarrow && listInView,
        narrow: () => !toolbarInHeader && viewPortIsNarrow,
        headerMessageNarrow: () =>
            !listInView && !columnMode && toolbarInHeader && viewPortIsNarrow && selectedIDs.length !== 0,
        headerMessageWide: () => !listInView && !columnMode && toolbarInHeader && !viewPortIsNarrow,
        rowWide: () => listInView && !columnMode && !viewPortIsNarrow,
        columnWide: () => listInView && columnMode && !viewPortIsNarrow,
    }).find(([, value]) => value() === true)?.[0] as Variant;

    const selectAllProps = pick(props, ['labelID', 'elementIDs', 'checkedIDs', 'onCheck', 'loading']);
    const commonProps = {
        ...props,
        // Base css class
        classname: BASE_TOOLBAR_CLASSNAME,
        selectAll: <SelectAll {...selectAllProps} />,
    };

    switch (variant) {
        case 'headerNarrow':
            return <ToolbarHeaderNarrow {...commonProps} />;
        case 'narrow':
            return <ToolbarNarrow {...commonProps} />;
        case 'headerMessageNarrow':
            return <ToolbarHeaderMessageNarrow {...commonProps} />;
        case 'headerMessageWide':
            return <ToolbarHeaderMessageWide {...commonProps} />;
        case 'rowWide':
            return <ToolbarRowWide {...commonProps} />;
        default:
            // columnWide
            return <ToolbarColumnWide {...commonProps} />;
    }
};

export default memo(Toolbar);
