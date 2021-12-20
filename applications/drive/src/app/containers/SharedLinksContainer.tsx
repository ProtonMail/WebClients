import { Route, Redirect, Switch, RouteComponentProps } from 'react-router-dom';

import SharedLinksView from '../components/sections/SharedLinks/SharedLinksView';

const SharedLinksContainer = ({ match }: RouteComponentProps) => {
    return (
        <Switch>
            <Route path={match.url} exact component={SharedLinksView} />
            <Redirect to="/" />
        </Switch>
    );
};

export default SharedLinksContainer;
