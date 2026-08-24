import type { FC } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';
import { Route, Switch, useParams } from 'react-router-dom';

import type { SelectedItem } from '../../../types';
import { ItemHistoryProvider } from '../History/ItemHistoryProvider';
import { RevisionDiff } from '../History/RevisionsDiff';
import { RevisionsTimeline } from '../History/RevisionsTimeline';

export const ItemHistory: FC<RouteChildrenProps> = ({ match }) => (
    <ItemHistoryProvider {...useParams<SelectedItem>()}>
        <Switch>
            <Route exact path={`${match?.path}/:revision`} component={RevisionDiff} />
            <Route component={RevisionsTimeline} />
        </Switch>
    </ItemHistoryProvider>
);
