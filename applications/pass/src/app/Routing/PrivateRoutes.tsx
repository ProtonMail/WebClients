import { type FC } from 'react';
import { Route, Switch } from 'react-router-dom';

import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

import { useClient } from '../Context/ClientProvider';
import { ItemViewContainer } from '../Views/Item/ItemViewContainer';
import { Autoselect } from './Autoselect';

const Dummy = () => <>ITEM ROUTE</>;

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
                                component={ItemViewContainer}
                            />

                            <Route exact path={`${match.path}/share/:shareId/item/:itemId/edit`} component={Dummy} />

                            <Route
                                exact
                                path={`${match.path}/share/:activeShareId/item/new/:itemType`}
                                component={Dummy}
                            />

                            <Route exact path={`${match?.path}/empty`} component={Dummy} />

                            <Route component={Autoselect} />
                        </Switch>
                    )
                }
            </Route>
        </Switch>
    );
};
