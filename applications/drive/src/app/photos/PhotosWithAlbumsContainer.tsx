import type { FC } from 'react';
import { Redirect, Route, type RouteComponentProps, Switch } from 'react-router-dom';

import { AlbumsView } from './PhotosWithAlbums/AlbumsView';
import { PhotosWithAlbumsInsideAlbumView } from './PhotosWithAlbums/PhotosWithAlbumsInsideAlbumView';
import { PhotosWithAlbumsView } from './PhotosWithAlbums/PhotosWithAlbumsView';

export const PhotosWithAlbumsContainer: FC<RouteComponentProps> = ({ match }) => {
    return (
        <Switch>
            <Route path={match.url} exact component={PhotosWithAlbumsView} />
            <Route path={`${match.url}/albums`} exact component={AlbumsView} />
            <Route
                path={`${match.url}/album/:albumShareId/:albumLinkId`}
                exact
                component={PhotosWithAlbumsInsideAlbumView}
            />
            <Redirect to="/photos" />
        </Switch>
    );
};
