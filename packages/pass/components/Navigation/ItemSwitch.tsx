import { type FC } from 'react';
import type { RouteChildrenProps, RouteProps } from 'react-router-dom';
import { Route, Switch } from 'react-router-dom';

import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { BulkView } from '@proton/pass/components/Bulk/BulkView';
import { ItemEdit } from '@proton/pass/components/Item/Containers/ItemEdit';
import { ItemHistory } from '@proton/pass/components/Item/Containers/ItemHistory';
import { ItemNew } from '@proton/pass/components/Item/Containers/ItemNew';
import { ItemView } from '@proton/pass/components/Item/Containers/ItemView';

import { ItemRouteContext } from './ItemRouteContext';

type Props = RouteChildrenProps & {
    fallback: RouteProps['component'];
    prefix?: string;
};

const ItemRoutes: FC<Props> = ({ match, fallback }) => {
    const sub = (path: string) => `${match?.path}/${path}`;
    const { enabled } = useBulkSelect();

    if (enabled) return <BulkView />;

    return match ? (
        <Switch>
            <Route exact path={sub('item/new/:type')} component={ItemNew} />
            <Route exact path={sub('(trash/)?share/:shareId/item/:itemId')} component={ItemView} />
            <Route exact path={sub('share/:shareId/item/:itemId/edit')} component={ItemEdit} />
            <Route path={sub('(trash/)?share/:shareId/item/:itemId/history')} component={ItemHistory} />
            <Route component={fallback} />
        </Switch>
    ) : null;
};

export const ItemSwitch: FC<Props> = ({ prefix, ...props }) => (
    <ItemRouteContext.Provider value={{ prefix }}>
        <ItemRoutes {...props} />
    </ItemRouteContext.Provider>
);
