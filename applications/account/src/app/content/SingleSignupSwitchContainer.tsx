import { useHistory, useLocation } from 'react-router-dom';

import isDeepEqual from 'lodash/isEqual';

import { SSO_PATHS } from '@proton/shared/lib/constants';

import { isReferralSignup } from '../signup/helper';
import { getSignupMeta } from '../signup/signupPagesJson';
import SignupCtxRouter from '../signupCtx/SignupCtxRouter';
import SingleSignupContainerV2 from '../single-signup-v2/SingleSignupContainerV2';
import type { OnLoginCallback } from './authSession';
import { usePublicAppAuth } from './publicAppAuth';
import { PublicAppContext } from './state-machine/PublicAppContext';
import { usePublicAppServices } from './state-machine/PublicAppServices';
import { getPublicAppActiveSessions } from './state-machine/publicAppActors';
import {
    selectClientType,
    selectHasBackToSwitch,
    selectPaths,
    selectPreAppIntent,
    selectToAppName,
} from './state-machine/publicAppStateMachine';
import { runLogin } from './state-machine/runLogin';

const SingleSignupSwitchContainer = () => {
    const { onPreSubmit, onStartAuth } = usePublicAppAuth();
    const location = useLocation();
    const history = useHistory();
    const { api } = usePublicAppServices();
    const publicApp = PublicAppContext.useActorRef();
    const activeSessions = PublicAppContext.useSelector((state) => state.context.activeSessions);
    const initialSearchParams = PublicAppContext.useSelector((state) => state.context.initialSearchParams);
    const productParam = PublicAppContext.useSelector((state) => state.context.productParam);
    const hasFork = PublicAppContext.useSelector((state) => !!state.context.forkState);
    const initialSessionsLength = PublicAppContext.useSelector((state) => state.context.initialSessionsLength);
    const toApp = PublicAppContext.useSelector(selectPreAppIntent);
    const toAppName = PublicAppContext.useSelector(selectToAppName);
    const clientType = PublicAppContext.useSelector(selectClientType);
    const paths = PublicAppContext.useSelector(selectPaths, isDeepEqual);
    const hasBackToSwitch = PublicAppContext.useSelector(selectHasBackToSwitch);
    const searchParams = new URLSearchParams(location.search);
    const handleLogin: OnLoginCallback = (session) => runLogin(publicApp, session);
    const onGetActiveSessions = async () => {
        const result = await getPublicAppActiveSessions(api, initialSearchParams);
        publicApp.send({ type: 'sessions.updated', sessions: result.sessions });
        return result;
    };

    const isReferral = isReferralSignup(location);

    const renderContextSignup =
        searchParams.get('mode') === 'ctx' ||
        location.pathname === SSO_PATHS.START ||
        location.pathname === SSO_PATHS.BORN_PRIVATE ||
        location.pathname === SSO_PATHS.MEET_SIGNUP ||
        location.pathname === SSO_PATHS.MEET_SIGNUP_B2C ||
        location.pathname === SSO_PATHS.SPACES_SIGNUP ||
        isReferral;

    if (renderContextSignup) {
        return (
            <SignupCtxRouter
                onPreSubmit={onPreSubmit}
                onStartAuth={onStartAuth}
                onGetActiveSessions={onGetActiveSessions}
                handleLogin={handleLogin}
                loginUrl={paths.login}
                productParam={productParam}
            />
        );
    }

    return (
        <SingleSignupContainerV2
            initialSearchParams={initialSearchParams}
            paths={paths}
            metaTags={getSignupMeta(toApp)}
            activeSessions={activeSessions}
            onGetActiveSessions={onGetActiveSessions}
            productParam={productParam}
            clientType={clientType}
            toApp={toApp}
            toAppName={toAppName}
            onLogin={handleLogin}
            fork={hasFork}
            onBack={hasBackToSwitch ? () => history.push(paths.login) : undefined}
            onPreSubmit={onPreSubmit}
            onStartAuth={onStartAuth}
            initialSessionsLength={Boolean(initialSessionsLength)}
        />
    );
};

export default SingleSignupSwitchContainer;
