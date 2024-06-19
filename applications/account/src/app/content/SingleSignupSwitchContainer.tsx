import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { OnLoginCallback, UnAuthenticated, useFlag } from '@proton/components/index';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { LocalSessionPersisted } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, APP_NAMES, CLIENT_TYPES, PLANS, SSO_PATHS } from '@proton/shared/lib/constants';

import SignupContainer from '../signup/SignupContainer';
import { getSignupMeta } from '../signup/signupPagesJson';
import SingleSignupContainerV2 from '../single-signup-v2/SingleSignupContainerV2';
import { MetaTags } from '../useMetaTags';
import { Paths } from './helper';

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
        maybePreAppIntent === APPS.PROTONDRIVE ||
        maybePreAppIntent === APPS.PROTONPASS ||
        [SSO_PATHS.MAIL_SIGNUP_B2B, SSO_PATHS.CALENDAR_SIGNUP_B2B].includes(location.pathname as any) ||
        searchParams.get('mode') === 'sps' ||
        searchParams.get('plan') === PLANS.NEW_VISIONARY ||
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
