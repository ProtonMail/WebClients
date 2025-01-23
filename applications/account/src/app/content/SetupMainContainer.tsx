import type { FunctionComponent } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { AccountSpotlightsProvider } from '@proton/components/containers/account/spotlights/AccountSpotlightsProvider';
import StandardPrivateApp from '@proton/components/containers/app/StandardPrivateApp';
import KeyTransparencyManager from '@proton/components/containers/keyTransparency/KeyTransparencyManager';
import { APPS } from '@proton/shared/lib/constants';

import PartnerClaimContainer from '../containers/PartnerClaimContainer';
import SetupAddressContainer from '../containers/SetupAddressContainer';
import SecurityCheckupContainer from '../containers/securityCheckup/SecurityCheckupContainer';
import MainContainer from './MainContainer';
import { getRoutesWithoutSlug } from './routesWithoutSlug';

const SetupMainContainer: FunctionComponent = () => {
    const routes = getRoutesWithoutSlug();
    return (
        <StandardPrivateApp>
            <AccountSpotlightsProvider>
                <KeyTransparencyManager appName={APPS.PROTONACCOUNT}>
                    <Switch>
                        <Route path={routes.setup}>
                            <SetupAddressContainer />
                        </Route>
                        <Route path={routes.securityCheckup}>
                            <SecurityCheckupContainer />
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
                </KeyTransparencyManager>
            </AccountSpotlightsProvider>
        </StandardPrivateApp>
    );
};

export default SetupMainContainer;
