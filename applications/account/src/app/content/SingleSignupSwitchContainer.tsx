import { useLocation } from 'react-router-dom';

import type { OnLoginCallback } from '@proton/components';
import { UnAuthenticated } from '@proton/components';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { ActiveSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type APP_NAMES, type CLIENT_TYPES, SSO_PATHS } from '@proton/shared/lib/constants';

import SignupContainer from '../signup/SignupContainer';
import { isReferralSignup } from '../signup/helper';
import { getSignupMeta } from '../signup/signupPagesJson';
import SignupCtxRouter from '../signupCtx/SignupCtxRouter';
import SingleSignupContainerV2 from '../single-signup-v2/SingleSignupContainerV2';
import type { MetaTags } from '../useMetaTags';
import type { Paths } from './helper';

interface Props {
    hasBFCoupon: boolean;
    maybePreAppIntent: APP_NAMES | undefined;
    searchParams: URLSearchParams;
    initialSearchParams?: URLSearchParams;
    handleLogin: OnLoginCallback;
    productParam: ProductParam;
    toApp?: APP_NAMES;
    toAppName?: string;
    clientType: CLIENT_TYPES;
    activeSessions?: ActiveSession[];
    onGetActiveSessions?: Parameters<typeof SingleSignupContainerV2>[0]['onGetActiveSessions'];
    fork: boolean;
    metaTags: MetaTags;
    paths: Paths;
    onBack?: () => void;
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    initialSessionsLength: boolean;
}

const SingleSignupSwitchContainer = ({
    maybePreAppIntent,
    initialSearchParams,
    handleLogin,
    productParam,
    toAppName,
    clientType,
    searchParams,
    activeSessions,
    onGetActiveSessions,
    fork,
    metaTags,
    paths,
    onBack,
    onPreSubmit,
    onStartAuth,
    initialSessionsLength,
}: Props) => {
    const location = useLocation();

    const isReferral = isReferralSignup(location);

    const renderContextSignup = searchParams.get('mode') === 'ctx' || location.pathname === SSO_PATHS.START;

    if (renderContextSignup) {
        return (
            <UnAuthenticated>
                <SignupCtxRouter
                    onPreSubmit={onPreSubmit}
                    onStartAuth={onStartAuth}
                    handleLogin={handleLogin}
                    loginUrl={paths.login}
                    productParam={productParam}
                />
            </UnAuthenticated>
        );
    }

    if (isReferral) {
        return (
            <UnAuthenticated>
                <SignupContainer
                    initialSearchParams={initialSearchParams}
                    metaTags={getSignupMeta(maybePreAppIntent)}
                    loginUrl={paths.login}
                    productParam={productParam}
                    clientType={clientType}
                    toApp={maybePreAppIntent}
                    toAppName={toAppName}
                    onLogin={handleLogin}
                    onBack={onBack}
                    onPreSubmit={onPreSubmit}
                    onStartAuth={onStartAuth}
                />
            </UnAuthenticated>
        );
    }

    return (
        <SingleSignupContainerV2
            initialSearchParams={initialSearchParams}
            paths={paths}
            metaTags={metaTags}
            activeSessions={activeSessions}
            onGetActiveSessions={onGetActiveSessions}
            productParam={productParam}
            clientType={clientType}
            toApp={maybePreAppIntent}
            toAppName={toAppName}
            onLogin={handleLogin}
            fork={fork}
            onBack={onBack}
            onPreSubmit={onPreSubmit}
            onStartAuth={onStartAuth}
            initialSessionsLength={initialSessionsLength}
        />
    );
};

export default SingleSignupSwitchContainer;
