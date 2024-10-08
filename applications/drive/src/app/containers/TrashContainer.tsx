import type { RouteComponentProps } from 'react-router-dom';
import { Redirect, Route, Switch } from 'react-router-dom';

import TrashView from '../components/sections/Trash/TrashView';

const TrashContainer = ({ match }: RouteComponentProps) => {
    return (
        <Switch>
            <Route path={match.url} exact component={TrashView} />
            <Redirect to="/trash" />
        </Switch>
    );
};

export default TrashContainer;
