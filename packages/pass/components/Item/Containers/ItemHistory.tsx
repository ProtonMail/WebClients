import type { FC } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';
import { Route, Switch, useParams } from 'react-router-dom';

import { ItemHistoryProvider } from '@proton/pass/components/Item/History/ItemHistoryProvider';
import { RevisionDiff } from '@proton/pass/components/Item/History/RevisionsDiff';
import { RevisionsTimeline } from '@proton/pass/components/Item/History/RevisionsTimeline';
import type { SelectedItem } from '@proton/pass/types';

export const ItemHistory: FC<RouteChildrenProps> = ({ match }) => (
    <ItemHistoryProvider {...useParams<SelectedItem>()}>
        <Switch>
            <Route exact path={`${match?.path}/:revision`} component={RevisionDiff} />
            <Route component={RevisionsTimeline} />
        </Switch>
    </ItemHistoryProvider>
);
