import type { RouteComponentProps } from 'react-router-dom';
import { Redirect, Route, Switch } from 'react-router-dom';

import SharedWithMeView from '../components/sections/SharedWithMe/SharedWithMeView';

const SharedWithMeContainer = ({ match }: RouteComponentProps) => {
    return (
        <Switch>
            <Route path={match.url} exact component={SharedWithMeView} />
            <Redirect to="/" />
        </Switch>
    );
};

export default SharedWithMeContainer;
