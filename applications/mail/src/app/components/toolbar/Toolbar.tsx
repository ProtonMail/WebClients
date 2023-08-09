import { Ref, memo } from 'react';

import { pick } from '@proton/shared/lib/helpers/object';

import { MARK_AS_STATUS } from '../../hooks/actions/useMarkAs';
import { Breakpoints } from '../../models/utils';
import { Props as ListSettingsProps } from '../list/ListSettings';
import SelectAll from './SelectAll';
import ToolbarColumnWide from './ToolbarColumnWide';
import ToolbarHeaderMessageNarrow from './ToolbarHeaderMessageNarrow';
import ToolbarHeaderMessageWide from './ToolbarHeaderMessageWide';
import ToolbarHeaderNarrow from './ToolbarHeaderNarrow';
import ToolbarNarrow from './ToolbarNarrow';
import ToolbarRowWide from './ToolbarRowWide';

const defaultSelectedIDs: string[] = [];
const BASE_TOOLBAR_CLASSNAME =
    'toolbar toolbar--heavy flex flex-nowrap flex-item-noshrink flex-align-items-center gap-2 no-print flex-item-fluid-auto';

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
    const viewPortIsNarrow = breakpoints.isNarrow || breakpoints.isTablet;
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

    return (
        <>
            {'headerNarrow' === variant && <ToolbarHeaderNarrow {...commonProps} />}
            {'narrow' === variant && <ToolbarNarrow {...commonProps} />}
            {'headerMessageNarrow' === variant && <ToolbarHeaderMessageNarrow {...commonProps} />}
            {'headerMessageWide' === variant && <ToolbarHeaderMessageWide {...commonProps} />}
            {'rowWide' === variant && <ToolbarRowWide {...commonProps} />}
            {'columnWide' === variant && <ToolbarColumnWide {...commonProps} />}
        </>
    );
};

export default memo(Toolbar);
