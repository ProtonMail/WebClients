import { type FC } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';
import { Route, Switch } from 'react-router-dom';

import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { BulkView } from '@proton/pass/components/Bulk/BulkView';
import { ItemEdit } from '@proton/pass/components/Item/Containers/ItemEdit';
import { ItemHistory } from '@proton/pass/components/Item/Containers/ItemHistory';
import { ItemNew } from '@proton/pass/components/Item/Containers/ItemNew';
import { ItemView } from '@proton/pass/components/Item/Containers/ItemView';

import { Autoselect } from './Autoselect';

export const ItemSwitch: FC<RouteChildrenProps> = ({ match }) => {
    const sub = (path: string) => `${match?.path}/${path}`;
    const { enabled } = useBulkSelect();

    if (enabled) return <BulkView />;

    return match ? (
        <Switch>
            <Route exact path={sub('item/new/:type')} component={ItemNew} />
            <Route exact path={sub('(trash/)?share/:shareId/item/:itemId')} component={ItemView} />
            <Route exact path={sub('share/:shareId/item/:itemId/edit')} component={ItemEdit} />
            <Route path={sub('(trash/)?share/:shareId/item/:itemId/history')} component={ItemHistory} />
            <Route component={Autoselect} />
        </Switch>
    ) : null;
};
