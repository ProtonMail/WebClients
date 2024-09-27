import React, { useRef } from 'react';

import { c } from 'ttag';

import { useElementBreakpoints } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { Props as ListSettingsProps } from '../list/ListSettings';
import ListSettings from '../list/ListSettings';

interface Props extends ListSettingsProps {
    classname: string;
    labelID: string;
    isSearch: boolean;
}

const BREAKPOINTS = {
    extratiny: 0,
    tiny: 100,
    small: 400,
    medium: 700,
    large: 1100,
};

const ToolbarNarrow = ({
    classname,
    selectAll,
    sort,
    onSort,
    filter,
    onFilter,
    conversationMode,
    mailSettings,
    labelID,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);

    return (
        <div>
            <nav
                className={clsx(classname, 'justify-space-between py-1 pl-3 pr-2')}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div className="flex items-center toolbar-inner gap-2">{selectAll}</div>

                <div className="flex items-center toolbar-inner gap-2">
                    <ListSettings
                        sort={sort}
                        onSort={onSort}
                        onFilter={onFilter}
                        filter={filter}
                        conversationMode={conversationMode}
                        mailSettings={mailSettings}
                        labelID={labelID}
                        filterAsDropdown={breakpoint === 'tiny'}
                    />
                </div>
            </nav>
        </div>
    );
};

export default ToolbarNarrow;
