import { useLocation } from 'react-router-dom';

import type { OnLoginCallback } from '@proton/components';
import { UnAuthenticated } from '@proton/components';
import { PLANS } from '@proton/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { passApps } from '@proton/shared/lib/authentication/apps';
import type { ActiveSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { getHas2024OfferCoupon } from '@proton/shared/lib/helpers/subscription';

import SignupContainer from '../signup/SignupContainer';
import { getSignupMeta } from '../signup/signupPagesJson';
import SingleSignupContainerV2 from '../single-signup-v2/SingleSignupContainerV2';
import type { MetaTags } from '../useMetaTags';
import type { Paths } from './helper';

interface Props {
    hasBFCoupon: boolean;
    hasValentinesCoupon: boolean;
    maybePreAppIntent: APP_NAMES | undefined;
    searchParams: URLSearchParams;
    initialSearchParams?: URLSearchParams;
    onLogin: OnLoginCallback;
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

// Always enabled for these apps
const singlePageSignupApps = new Set([
    APPS.PROTONDRIVE,
    APPS.PROTONDOCS,
    APPS.PROTONWALLET,
    APPS.PROTONLUMO,
    ...passApps,
]);
const singlePageSignupPaths = new Set([
    SSO_PATHS.MAIL_SIGNUP_B2B,
    SSO_PATHS.CALENDAR_SIGNUP_B2B,
    SSO_PATHS.BUSINESS_SIGNUP,
    SSO_PATHS.PORKBUN_SIGNUP,
    SSO_PATHS.PORKBUN_SIGN_IN,
]);
const singlePageSignupPlans = new Set([PLANS.VISIONARY, PLANS.DUO]);

const SingleSignupSwitchContainer = ({
    hasBFCoupon,
    hasValentinesCoupon,
    maybePreAppIntent,
    searchParams,
    initialSearchParams,
    onLogin,
    productParam,
    toAppName,
    clientType,
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

    const renderSingleSignup =
        hasBFCoupon ||
        hasValentinesCoupon ||
        singlePageSignupApps.has(maybePreAppIntent as any) ||
        singlePageSignupPaths.has(location.pathname as any) ||
        singlePageSignupPlans.has(searchParams.get('plan') as any) ||
        getHas2024OfferCoupon(searchParams.get('coupon')) ||
        searchParams.get('mode') === 'sps';

    if (renderSingleSignup) {
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
                onLogin={onLogin}
                fork={fork}
                onBack={onBack}
                onPreSubmit={onPreSubmit}
                onStartAuth={onStartAuth}
                initialSessionsLength={initialSessionsLength}
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
                onPreSubmit={onPreSubmit}
                onStartAuth={onStartAuth}
            />
        </UnAuthenticated>
    );
};

export default SingleSignupSwitchContainer;
