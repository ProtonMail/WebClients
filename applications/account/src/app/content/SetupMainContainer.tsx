import type { FunctionComponent } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { SECURITY_CHECKUP_PATHS, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';

import SetupAddressContainer from '../containers/SetupAddressContainer';
import SecurityCheckupContainer from '../containers/securityCheckup/SecurityCheckupContainer';
import MainContainer from './MainContainer';

const SetupMainContainer: FunctionComponent = () => {
    return (
        <Switch>
            <Route path={SETUP_ADDRESS_PATH}>
                <SetupAddressContainer />
            </Route>
            <Route path={SECURITY_CHECKUP_PATHS.ROOT}>
                <SecurityCheckupContainer />
            </Route>
            <Route path="/security-checkup">
                <Redirect to={`${SECURITY_CHECKUP_PATHS.ROOT}${location.search}`} />
            </Route>
            <Route path="*">
                <MainContainer />
            </Route>
        </Switch>
    );
};

export default SetupMainContainer;
