import type { FC } from 'react';
import type { RouteChildrenProps, RouteProps } from 'react-router-dom';
import { Route, Switch } from 'react-router-dom';

import { useFiles } from '../../hooks/files/useFileResolver';
import type { SelectedItem } from '../../types';
import { useBulkEnabled } from '../Bulk/BulkSelectionState';
import { BulkView } from '../Bulk/BulkView';
import { ItemEdit } from '../Item/Containers/ItemEdit';
import { ItemFieldExpansionProvider } from '../Item/Containers/ItemFieldExpansion';
import { ItemHistory } from '../Item/Containers/ItemHistory';
import { ItemNew } from '../Item/Containers/ItemNew';
import { ItemView } from '../Item/Containers/ItemView';

type Props = RouteChildrenProps & {
    fallback?: RouteProps['component'];
    prefix?: string;
};

export const ItemSwitch: FC<Props> = ({ match, fallback }) => {
    const sub = (path: string) => `${match?.path}/${path}`;
    const bulkEnabled = useBulkEnabled();

    useFiles();

    if (bulkEnabled) return <BulkView />;

    return match ? (
        <ItemFieldExpansionProvider>
            <Switch>
                <Route exact path={sub('item/new/:type')} component={ItemNew} />
                <Route exact path={sub(':shareId/item/:itemId')}>
                    {({ match }) => <ItemView {...(match!.params as SelectedItem)} />}
                </Route>
                <Route exact path={sub(':shareId/item/:itemId/edit')} component={ItemEdit} />
                <Route path={sub(':shareId/item/:itemId/history')} component={ItemHistory} />
                <Route component={fallback} />
            </Switch>
        </ItemFieldExpansionProvider>
    ) : null;
};
