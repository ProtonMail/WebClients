import { Route, Switch } from 'react-router-dom';

import { SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';

import SetupAddressContainer from '../containers/SetupAddressContainer';
import MainContainer from './MainContainer';

const SetupMainContainer = () => {
    return (
        <Switch>
            <Route path={SETUP_ADDRESS_PATH}>
                <SetupAddressContainer />
            </Route>
            <Route path="*">
                <MainContainer />
            </Route>
        </Switch>
    );
};

export default SetupMainContainer;
