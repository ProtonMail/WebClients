import React, { useRef } from 'react';

import { c } from 'ttag';

import { useElementBreakpoints } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import ListSettings, { Props as ListSettingsProps } from '../list/ListSettings';

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
    isSearch,
    labelID,
}: Props) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const breakpoint = useElementBreakpoints(toolbarRef, BREAKPOINTS);

    return (
        <div>
            <nav
                className={clsx(classname, 'flex-justify-space-between py-1 pl-3 pr-2')}
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
                ref={toolbarRef}
            >
                <div className="flex flex-align-items-center toolbar-inner gap-2">{selectAll}</div>

                <div className="flex flex-align-items-center toolbar-inner gap-2">
                    <ListSettings
                        sort={sort}
                        onSort={onSort}
                        onFilter={onFilter}
                        filter={filter}
                        conversationMode={conversationMode}
                        mailSettings={mailSettings}
                        isSearch={isSearch}
                        labelID={labelID}
                        filterAsDropdown={breakpoint === 'tiny'}
                    />
                </div>
            </nav>
        </div>
    );
};

export default ToolbarNarrow;
