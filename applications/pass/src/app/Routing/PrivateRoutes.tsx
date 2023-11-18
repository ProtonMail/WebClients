import { type FC } from 'react';
import { Route, Switch } from 'react-router-dom';

import { ItemEdit } from '@proton/pass/components/Item/Containers/ItemEdit';
import { ItemNew } from '@proton/pass/components/Item/Containers/ItemNew';
import { ItemView } from '@proton/pass/components/Item/Containers/ItemView';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

import { useClient } from '../Context/ClientProvider';
import { Autoselect } from './Autoselect';

const Empty = () => <>Empty</>;

/** Ideally this component should be moved to `@proton/pass`
 * in order to use it in the extension once we replace the
 * MemoryRouter from the popup app. */
export const PrivateRoutes: FC = () => {
    const client = useClient();

    return (
        <Switch>
            <Route path={`/${getLocalIDPath(client.state.localID)}`}>
                {({ match }) =>
                    match && (
                        <Switch>
                            <Route
                                exact
                                path={[
                                    `${match.path}/share/:shareId/item/:itemId`,
                                    `${match.path}/trash/share/:shareId/item/:itemId`,
                                ]}
                                component={ItemView}
                            />

                            <Route exact path={`${match.path}/share/:shareId/item/:itemId/edit`} component={ItemEdit} />

                            <Route
                                exact
                                path={`${match.path}/share/:activeShareId/item/new/:itemType`}
                                component={ItemNew}
                            />

                            <Route exact path={`${match?.path}/empty`} component={Empty} />

                            <Route component={Autoselect} />
                        </Switch>
                    )
                }
            </Route>
        </Switch>
    );
};
