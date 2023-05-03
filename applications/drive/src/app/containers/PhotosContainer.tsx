import { FC } from 'react';
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom';

import { PhotosView } from '../components/sections/Photos';

export const PhotosContainer: FC<RouteComponentProps> = ({ match }) => {
    return (
        <Switch>
            <Route path={match.url} exact component={PhotosView} />
            <Redirect to="/photos" />
        </Switch>
    );
};
