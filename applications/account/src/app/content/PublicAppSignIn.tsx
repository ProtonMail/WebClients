import { useHistory } from 'react-router-dom';

import isDeepEqual from 'lodash/isEqual';

import { getIsSpacesApp } from '@proton/shared/lib/authentication/apps';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import SignInContainer from '../sign-in/SignInContainer';
import { getLoginMeta } from '../sign-in/loginPagesJson';
import { SpacesSignIn } from '../signupCtx/flows/spacesFlows';
import type { OnLoginCallback } from './authSession';
import { setupVPN, usePublicAppAuth } from './publicAppAuth';
import { PublicAppContext } from './state-machine/PublicAppContext';
import {
    selectHasBackToSwitch,
    selectPaths,
    selectPreAppIntent,
    selectToAppName,
    selectToOAuthName,
} from './state-machine/publicAppStateMachine';
import { runLogin } from './state-machine/runLogin';

const PublicAppSignIn = () => {
    const { onPreSubmit, onStartAuth } = usePublicAppAuth();
    const history = useHistory();
    const publicApp = PublicAppContext.useActorRef();
    const initialSearchParams = PublicAppContext.useSelector((state) => state.context.initialSearchParams);
    const productParam = PublicAppContext.useSelector((state) => state.context.productParam);
    const toApp = PublicAppContext.useSelector(selectPreAppIntent);
    const toAppName = PublicAppContext.useSelector(selectToAppName);
    const toOAuthName = PublicAppContext.useSelector(selectToOAuthName);
    const paths = PublicAppContext.useSelector(selectPaths, isDeepEqual);
    const hasBackToSwitch = PublicAppContext.useSelector(selectHasBackToSwitch);
    const onLogin: OnLoginCallback = (session) => runLogin(publicApp, session);

    const signInProps = {
        initialSearchParams,
        metaTags: getLoginMeta(toApp),
        toAppName,
        toApp,
        productParam,
        showContinueTo: !!toOAuthName,
        onLogin,
        onBack: hasBackToSwitch ? () => history.push(SSO_PATHS.SWITCH) : undefined,
        setupVPN,
        paths,
        onPreSubmit,
        onStartAuth,
    };

    const signIn = <SignInContainer {...signInProps} />;
    // The Spaces sign-in is only built in some releases; Spaces uses the normal sign-in without it
    if (SpacesSignIn && getIsSpacesApp(toApp)) {
        return <SpacesSignIn {...signInProps} fallback={signIn} />;
    }

    return signIn;
};

export default PublicAppSignIn;
