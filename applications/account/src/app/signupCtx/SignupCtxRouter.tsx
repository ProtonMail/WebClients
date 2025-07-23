import { Suspense } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { LoaderPage } from '@proton/components';
import { PaymentsContextOptimisticProvider } from '@proton/payments/ui';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import { cachedPlans } from '../defaultPlans';
import type { BaseSignupContextProps } from './context/SignupContext';
import DrivePricing from './flows/drive/DrivePricing';
import DriveSignup from './flows/drive/DriveSignup';
import GenericStartSignup from './flows/genericStart/GenericStartSignup';
import PassSignup from './flows/pass/PassSignup';
import ReferralSignup from './flows/referral/ReferralSignup';

const DriveSignupController = (props: BaseSignupContextProps) => (
    <Switch>
        <Route path={`${SSO_PATHS.DRIVE_SIGNUP}/pricing`}>
            <Suspense fallback={<LoaderPage text="Loading..." />}>
                <DrivePricing />
            </Suspense>
        </Route>
        <Route>
            <Suspense fallback={<LoaderPage text="Loading..." />}>
                <DriveSignup {...props} />
            </Suspense>
        </Route>
    </Switch>
);

const PassSignupController = (props: BaseSignupContextProps) => (
    <Switch>
        <Route>
            <Suspense fallback={<LoaderPage text="Loading..." />}>
                <PassSignup {...props} />
            </Suspense>
        </Route>
    </Switch>
);

const ReferralSignupController = (props: BaseSignupContextProps) => {
    return <ReferralSignup {...props} />;
};

const GenericSignupController = (props: BaseSignupContextProps) => {
    /**
     * Here we can control which signups to initiate
     * ie, free, paid, logic for pre selected plans etc
     * Can also do a/b variant detection here
     * Define telemetry params etc
     */
    return (
        <Switch>
            <Route path={SSO_PATHS.START}>
                <Suspense fallback={<LoaderPage text="Loading..." />}>
                    <GenericStartSignup {...props} />
                </Suspense>
            </Route>
            <Route>
                <Redirect to="/signup" />
            </Route>
        </Switch>
    );
};

const SignupCtxRouter = (props: BaseSignupContextProps) => {
    return (
        <PaymentsContextOptimisticProvider preload={false} authenticated={false} cachedPlans={cachedPlans}>
            <Switch>
                <Route path={SSO_PATHS.DRIVE_SIGNUP}>
                    <DriveSignupController {...props} />
                </Route>
                <Route path={SSO_PATHS.REFERAL_PLAN_SELECTION}>
                    <ReferralSignupController {...props} />
                </Route>
                <Route path={SSO_PATHS.PASS_SIGNUP}>
                    <PassSignupController {...props} />
                </Route>
                <Route>
                    <GenericSignupController {...props} />
                </Route>
            </Switch>
        </PaymentsContextOptimisticProvider>
    );
};

export default SignupCtxRouter;
