import type { FunctionComponent } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { SafetyReviewRoute } from '@proton/account/safetyReview/components/SafetyReviewRoute';
import { AccountSpotlightsProvider } from '@proton/components/containers/account/spotlights/AccountSpotlightsProvider';
import StandardPrivateApp from '@proton/components/containers/app/StandardPrivateApp';
import SubscriptionModalProvider from '@proton/payments-ui/containers/payments/subscription/SubscriptionModalProvider';
import { PaymentsContextProvider } from '@proton/payments-ui/ui/context/PaymentContext';
import { getRoutesWithoutSlug } from '@proton/settings/routesWithoutSlug';
import { APPS } from '@proton/shared/lib/constants';

import AccountLoaderPage from '../AccountLoaderPage';
import MainContainer from './MainContainer';
import PartnerClaimContainer from './containers/PartnerClaimContainer';
import SetupAddressContainer from './setup-address/SetupAddressContainer';

const SetupMainContainer: FunctionComponent = () => {
    const routes = getRoutesWithoutSlug();
    return (
        <StandardPrivateApp>
            <AccountSpotlightsProvider>
                <Switch>
                    <Route path={routes.setup}>
                        <SetupAddressContainer />
                    </Route>
                    <Route path={routes.securityCheckup}>
                        <SubscriptionModalProvider app={APPS.PROTONACCOUNT}>
                            <PaymentsContextProvider>
                                <SafetyReviewRoute loader={<AccountLoaderPage />} />
                            </PaymentsContextProvider>
                        </SubscriptionModalProvider>
                    </Route>
                    <Route path={routes.legacySecurityCheckup}>
                        <Redirect to={`${routes.securityCheckup}${location.search}`} />
                    </Route>
                    <Route path={routes.porkbunClaim}>
                        <PartnerClaimContainer />
                    </Route>
                    <Route path="*">
                        <MainContainer />
                    </Route>
                </Switch>
            </AccountSpotlightsProvider>
        </StandardPrivateApp>
    );
};

export default SetupMainContainer;
