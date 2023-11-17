import { type FC } from 'react';
import { Switch } from 'react-router-dom';

import { AuthenticatedRoute } from '@proton/pass/components/Navigation/AuthenticatedRoute';

import { ItemEditContainer } from './Item/ItemEditContainer';
import { ItemNewContainer } from './Item/ItemNewContainer';
import { ItemViewContainer } from './Item/ItemViewContainer';

/** Ideally this component should be moved to `@proton/pass`
 * in order to use it in the extension once we replace the
 * MemoryRouter from the popup app. */
export const PrivateRoutes: FC = () => {
    return (
        <Switch>
            <AuthenticatedRoute
                exact
                path={['/share/:shareId/item/:itemId', '/trash/share/:shareId/item/:itemId']}
                component={ItemViewContainer}
            />

            <AuthenticatedRoute exact path={'/share/:shareId/item/:itemId/edit'} component={ItemEditContainer} />

            <AuthenticatedRoute exact path={'/share/:activeShareId/item/new/:itemType'} component={ItemNewContainer} />
        </Switch>
    );
};
