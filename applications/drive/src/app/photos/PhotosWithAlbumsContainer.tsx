import type { FC } from 'react';
import { Redirect, Route, type RouteComponentProps, Switch } from 'react-router-dom';

import { PhotosWithAlbumsView } from './PhotosWithAlbums/PhotosWithAlbumsView';

export const PhotosWithAlbumsContainer: FC<RouteComponentProps> = ({ match }) => {
    return (
        <Switch>
            <Route path={match.url} exact component={PhotosWithAlbumsView} />
            <Route path={`${match.url}/:albumLinkId`} exact component={PhotosWithAlbumsView} />
            <Redirect to="/photos" />
        </Switch>
    );
};
