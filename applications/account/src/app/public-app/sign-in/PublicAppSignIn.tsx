import isDeepEqual from 'lodash/isEqual';

import { getIsSpacesApp } from '@proton/shared/lib/authentication/apps';

import type { OnLoginCallback } from '../authSession';
import { setupVPN, usePublicAppAuth } from '../publicAppAuth';
import { SpacesSignIn } from '../signupCtx/flows/spacesFlows';
import { PublicAppContext } from '../state-machine/PublicAppContext';
import {
    selectHasBackToSwitch,
    selectPaths,
    selectPreAppIntent,
    selectToAppName,
    selectToOAuthName,
} from '../state-machine/publicAppStateMachine';
import { runLogin } from '../state-machine/runLogin';
import SignInContainer from './SignInContainer';
import { getLoginMeta } from './loginPagesJson';

const PublicAppSignIn = () => {
    const { onPreSubmit, onStartAuth, onSessionExpired } = usePublicAppAuth();
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
        onBack: hasBackToSwitch ? () => publicApp.send({ type: 'switch.requested' }) : undefined,
        setupVPN,
        paths,
        onPreSubmit,
        onStartAuth,
        onSessionExpired,
    };

    // The Spaces sign-in is only built in some releases; Spaces uses the normal sign-in without it
    if (SpacesSignIn && getIsSpacesApp(toApp)) {
        return <SpacesSignIn {...signInProps} />;
    }

    return <SignInContainer {...signInProps} />;
};

export default PublicAppSignIn;
