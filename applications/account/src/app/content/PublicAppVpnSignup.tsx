import { useHistory } from 'react-router-dom';

import { getToAppName } from '@proton/shared/lib/authentication/apps';
import { APPS, CLIENT_TYPES } from '@proton/shared/lib/constants';

import { getSignupMeta } from '../signup/signupPagesJson';
import SingleSignupContainer from '../single-signup/SingleSignupContainer';
import AccountLoaderPage from './AccountLoaderPage';
import type { OnLoginCallback } from './authSession';
import { usePublicAppAuth } from './publicAppAuth';
import { PublicAppContext } from './state-machine/PublicAppContext';
import { selectHasBackToSwitch, selectPaths } from './state-machine/publicAppStateMachine';
import { runLogin } from './state-machine/runLogin';

const PublicAppVpnSignup = () => {
    const { onPreSubmit, onStartAuth } = usePublicAppAuth();
    const history = useHistory();
    const publicApp = PublicAppContext.useActorRef();
    const loginPath = PublicAppContext.useSelector((state) => selectPaths(state).login);
    const hasBackToSwitch = PublicAppContext.useSelector(selectHasBackToSwitch);
    const onLogin: OnLoginCallback = (session) => runLogin(publicApp, session);

    return (
        <SingleSignupContainer
            metaTags={getSignupMeta(APPS.PROTONVPN_SETTINGS)}
            loader={<AccountLoaderPage />}
            productParam={APPS.PROTONVPN_SETTINGS}
            clientType={CLIENT_TYPES.VPN}
            toApp={APPS.PROTONVPN_SETTINGS}
            toAppName={getToAppName(APPS.PROTONVPN_SETTINGS)}
            onLogin={onLogin}
            onBack={hasBackToSwitch ? () => history.push(loginPath) : undefined}
            onPreSubmit={onPreSubmit}
            onStartAuth={onStartAuth}
        />
    );
};

export default PublicAppVpnSignup;
