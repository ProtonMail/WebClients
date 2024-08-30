import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import type { OnLoginCallback } from '@proton/components';
import { UnAuthenticated } from '@proton/components';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { passApps } from '@proton/shared/lib/authentication/apps';
import type { LocalSessionPersisted } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { APPS, PLANS, SSO_PATHS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import SignupContainer from '../signup/SignupContainer';
import { getSignupMeta } from '../signup/signupPagesJson';
import SingleSignupContainerV2 from '../single-signup-v2/SingleSignupContainerV2';
import type { MetaTags } from '../useMetaTags';
import type { Paths } from './helper';

interface Props {
    hasBFCoupon: boolean;
    maybePreAppIntent: APP_NAMES | undefined;
    searchParams: URLSearchParams;
    initialSearchParams?: URLSearchParams;
    loader: ReactNode;
    onLogin: OnLoginCallback;
    productParam: ProductParam;
    toApp?: APP_NAMES;
    toAppName?: string;
    clientType: CLIENT_TYPES;
    activeSessions?: LocalSessionPersisted[];
    fork: boolean;
    metaTags: MetaTags;
    paths: Paths;
    onBack?: () => void;
}

// Always enabled for these apps
const singlePageSignupApps = new Set([APPS.PROTONDRIVE, APPS.PROTONDOCS, APPS.PROTONWALLET, ...passApps]);
const singlePageSignupPaths = new Set([
    SSO_PATHS.MAIL_SIGNUP_B2B,
    SSO_PATHS.CALENDAR_SIGNUP_B2B,
    SSO_PATHS.BUSINESS_SIGNUP,
]);
const singlePageSignupPlans = new Set([PLANS.VISIONARY, PLANS.DUO]);

const SingleSignupSwitchContainer = ({
    hasBFCoupon,
    maybePreAppIntent,
    searchParams,
    initialSearchParams,
    loader,
    onLogin,
    productParam,
    toAppName,
    clientType,
    activeSessions,
    fork,
    metaTags,
    paths,
    onBack,
}: Props) => {
    const singleSignupEnabled = useFlag('SingleSignup');
    const location = useLocation();

    const renderSingleSignup =
        hasBFCoupon ||
        singlePageSignupApps.has(maybePreAppIntent as any) ||
        singlePageSignupPaths.has(location.pathname as any) ||
        singlePageSignupPlans.has(searchParams.get('plan') as any) ||
        searchParams.get('mode') === 'sps' ||
        singleSignupEnabled;

    if (renderSingleSignup) {
        return (
            <SingleSignupContainerV2
                initialSearchParams={initialSearchParams}
                paths={paths}
                metaTags={metaTags}
                activeSessions={activeSessions}
                loader={loader}
                productParam={productParam}
                clientType={clientType}
                toApp={maybePreAppIntent}
                toAppName={toAppName}
                onLogin={onLogin}
                fork={fork}
                onBack={onBack}
            />
        );
    }
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
                onLogin={onLogin}
                onBack={onBack}
            />
        </UnAuthenticated>
    );
};

export default SingleSignupSwitchContainer;
