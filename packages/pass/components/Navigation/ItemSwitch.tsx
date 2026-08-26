import type { FC } from 'react';
import type { RouteChildrenProps, RouteProps } from 'react-router-dom';
import { Route, Switch } from 'react-router-dom';

import { useBulkEnabled } from '@proton/pass/components/Bulk/BulkSelectionState';
import { BulkView } from '@proton/pass/components/Bulk/BulkView';
import { ItemEdit } from '@proton/pass/components/Item/Containers/ItemEdit';
import { ItemHistory } from '@proton/pass/components/Item/Containers/ItemHistory';
import { ItemNew } from '@proton/pass/components/Item/Containers/ItemNew';
import { ItemView } from '@proton/pass/components/Item/Containers/ItemView';
import { useFiles } from '@proton/pass/hooks/files/useFileResolver';
import type { SelectedItem } from '@proton/pass/types';

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
        <Switch>
            <Route exact path={sub('item/new/:type')} component={ItemNew} />
            <Route exact path={sub(':shareId/item/:itemId')}>
                {({ match }) => <ItemView {...(match!.params as SelectedItem)} />}
            </Route>
            <Route exact path={sub(':shareId/item/:itemId/edit')} component={ItemEdit} />
            <Route path={sub(':shareId/item/:itemId/history')} component={ItemHistory} />
            <Route component={fallback} />
        </Switch>
    ) : null;
};
