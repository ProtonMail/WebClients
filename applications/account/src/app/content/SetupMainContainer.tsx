import { Route, Switch } from 'react-router-dom';

import SetupInternalAccountContainer from '../containers/SetupInternalAccountContainer';
import MainContainer from './MainContainer';

const SetupMainContainer = () => {
    return (
        <Switch>
            <Route path="/setup-internal-address">
                <SetupInternalAccountContainer />
            </Route>
            <Route path="*">
                <MainContainer />
            </Route>
        </Switch>
    );
};

export default SetupMainContainer;
