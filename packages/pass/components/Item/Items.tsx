import type { FC } from 'react';
import { Route, type RouteChildrenProps } from 'react-router-dom';

import { ItemsProvider } from '@proton/pass/components/Item/Context/ItemsProvider';
import { Content } from '@proton/pass/components/Layout/Section/Content';
import { SubSidebar } from '@proton/pass/components/Layout/Section/SubSidebar';
import { Autoselect } from '@proton/pass/components/Navigation/Autoselect';
import { ItemSwitch } from '@proton/pass/components/Navigation/ItemSwitch';
import { ItemScopes } from '@proton/pass/components/Navigation/routing';
import { InAppNotificationContainer } from '@proton/pass/components/Notifications/InAppNotificationPortal';

import { ItemsList } from './List/ItemsList';

export const Items: FC<RouteChildrenProps> = (subRoute) => {
    const { match } = subRoute;

    const itemRoutes = match ? ItemScopes.map((route) => `${match.path}/${route}`).concat(match.path) : [];

    return (
        <ItemsProvider>
            <SubSidebar>
                {EXTENSION_BUILD && <InAppNotificationContainer className="px-3 pt-3" />}
                <ItemsList />
            </SubSidebar>
            <Content>
                <Route path={itemRoutes}>{(itemRoute) => <ItemSwitch fallback={Autoselect} {...itemRoute} />}</Route>
            </Content>
        </ItemsProvider>
    );
};
