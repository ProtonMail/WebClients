import { Route, Redirect, Switch, RouteComponentProps } from 'react-router-dom';

import DriveWindow from '../components/layout/DriveWindow';
import EmptyTrashSidebarButton from '../components/sections/Trash/EmptyTrashSidebarButton';
import TrashView from '../components/sections/Trash/TrashView';

const TrashContainer = ({ match }: RouteComponentProps) => {
    return (
        <DriveWindow PrimaryButton={EmptyTrashSidebarButton}>
            <Switch>
                <Route path={match.url} exact component={TrashView} />
                <Redirect to="/trash" />
            </Switch>
        </DriveWindow>
    );
};

export default TrashContainer;
