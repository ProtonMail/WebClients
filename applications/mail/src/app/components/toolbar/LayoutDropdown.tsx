import React from 'react';
import { Icon, DropdownMenu, DropdownMenuButton, useApi, useEventManager, useLoading } from 'react-components';
import { VIEW_LAYOUT } from 'proton-shared/lib/constants';
import { updateViewLayout } from 'proton-shared/lib/api/mailSettings';
import { c } from 'ttag';

import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    mailSettings: any;
}

const LayoutDropdown = ({ mailSettings = {} }: Props) => {
    const { ViewLayout = VIEW_LAYOUT.COLUMN } = mailSettings;

    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const currentLayoutIcon = ViewLayout === VIEW_LAYOUT.COLUMN ? 'layout-columns' : 'layout-rows';

    const updateLayout = async (viewLayout: number) => {
        await api(updateViewLayout(viewLayout));
        await call();
    };

    return (
        <ToolbarDropdown
            title={c('Action').t`Change layout`}
            content={<Icon className="toolbar-icon" name={currentLayoutIcon} />}
            data-testid="toolbar:layout-dropdown"
        >
            {() => (
                <DropdownMenu>
                    <DropdownMenuButton
                        data-testid="toolbar-layout:column-layout"
                        aria-current={ViewLayout === VIEW_LAYOUT.COLUMN}
                        loading={loading}
                        className="text-left"
                        onClick={() => withLoading(updateLayout(VIEW_LAYOUT.COLUMN))}
                    >
                        <Icon name="layout-columns" className="mr0-5" />
                        {c('Action').t`Column layout`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        data-testid="toolbar-layout:row-layout"
                        aria-current={ViewLayout === VIEW_LAYOUT.ROW}
                        loading={loading}
                        className="text-left"
                        onClick={() => withLoading(updateLayout(VIEW_LAYOUT.ROW))}
                    >
                        <Icon name="layout-rows" className="mr0-5" />
                        {c('Action').t`Row layout`}
                    </DropdownMenuButton>
                </DropdownMenu>
            )}
        </ToolbarDropdown>
    );
};

export default LayoutDropdown;
