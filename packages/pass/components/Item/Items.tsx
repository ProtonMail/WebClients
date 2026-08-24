import type { FC } from 'react';
import { Route, type RouteChildrenProps } from 'react-router-dom';

import { Content } from '../Layout/Section/Content';
import { SubSidebar } from '../Layout/Section/SubSidebar';
import { Autoselect } from '../Navigation/Autoselect';
import { ItemSwitch } from '../Navigation/ItemSwitch';
import { ItemScopes } from '../Navigation/routing';
import { InAppNotificationContainer } from '../Notifications/InAppNotificationPortal';
import { ItemsProvider } from './Context/ItemsProvider';
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
