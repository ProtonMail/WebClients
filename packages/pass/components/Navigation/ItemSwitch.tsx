import { type FC } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';
import { Route, Switch } from 'react-router-dom';

import { ItemEdit } from '@proton/pass/components/Item/Containers/ItemEdit';
import { ItemNew } from '@proton/pass/components/Item/Containers/ItemNew';
import { ItemView } from '@proton/pass/components/Item/Containers/ItemView';

import { Autoselect } from './Autoselect';

export const ItemSwitch: FC<RouteChildrenProps> = ({ match }) => {
    const sub = (path: string) => `${match?.path}/${path}`;

    return match ? (
        <Switch>
            <Route exact path={sub('(trash/)?share/:shareId/item/:itemId')} component={ItemView} />
            <Route exact path={sub('share/:shareId/item/:itemId/edit')} component={ItemEdit} />
            <Route exact path={sub('item/new/:type')} component={ItemNew} />
            <Route component={Autoselect} />
        </Switch>
    ) : null;
};
