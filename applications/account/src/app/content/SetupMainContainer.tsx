import type { FunctionComponent } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { SubscriptionModalProvider } from '@proton/components/index';
import { APPS, SECURITY_CHECKUP_PATHS, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';

import PartnerPaymentContainer from '../containers/PartnerPaymentContainer';
import SetupAddressContainer from '../containers/SetupAddressContainer';
import SecurityCheckupContainer from '../containers/securityCheckup/SecurityCheckupContainer';
import MainContainer from './MainContainer';

const SetupMainContainer: FunctionComponent = () => {
    const isPartnerEnabled = false;

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
            {isPartnerEnabled && (
                <Route path="/partner/porkbun/payment">
                    <SubscriptionModalProvider app={APPS.PROTONMAIL}>
                        <PartnerPaymentContainer />
                    </SubscriptionModalProvider>
                </Route>
            )}
            <Route path="*">
                <MainContainer />
            </Route>
        </Switch>
    );
};

export default SetupMainContainer;
