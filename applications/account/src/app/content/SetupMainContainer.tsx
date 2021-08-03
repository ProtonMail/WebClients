import { Route, Switch } from 'react-router-dom';

import MainContainer from './MainContainer';
import SetupInternalAccountContainer from '../containers/SetupInternalAccountContainer';

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
