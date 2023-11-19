import { type FC } from 'react';
import { Route, Switch } from 'react-router-dom';

import { ItemEdit } from '@proton/pass/components/Item/Containers/ItemEdit';
import { ItemNew } from '@proton/pass/components/Item/Containers/ItemNew';
import { ItemView } from '@proton/pass/components/Item/Containers/ItemView';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

import { useClient } from '../../Context/ClientProvider';
import { Autoselect } from './Autoselect';

const Empty = () => <>Empty</>;

export const ItemSwitch: FC = () => {
    const client = useClient();

    return (
        <Switch>
            <Route path={`/${getLocalIDPath(client.state.localID)}`}>
                {({ match }) => {
                    if (!match) return null;
                    const sub = (path: string) => `${match.path}/${path}`;

                    return (
                        <Switch>
                            <Route exact path={sub('(trash/)?share/:shareId/item/:itemId')} component={ItemView} />
                            <Route exact path={sub('share/:shareId/item/:itemId/edit')} component={ItemEdit} />
                            <Route exact path={sub('item/new/:itemType')} component={ItemNew} />
                            <Route exact path={sub('empty')} component={Empty} />
                            <Route component={Autoselect} />
                        </Switch>
                    );
                }}
            </Route>
        </Switch>
    );
};
