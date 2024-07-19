import type { FC } from 'react';
import type { RouteComponentProps } from 'react-router-dom';
import { Redirect, Route, Switch } from 'react-router-dom';

import { PhotosView } from '../components/sections/Photos';

export const PhotosContainer: FC<RouteComponentProps> = ({ match }) => {
    return (
        <Switch>
            <Route path={match.url} exact component={PhotosView} />
            <Redirect to="/photos" />
        </Switch>
    );
};
