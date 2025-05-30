import { Redirect, Route, Switch } from 'react-router-dom';

import { PaymentsContextOptimisticProvider } from '@proton/payments/ui';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import { cachedPlans } from '../defaultPlans';
import { type BaseSignupContextProps } from './context/SignupContext';
import DrivePricing from './flows/drive/DrivePricing';
import DriveSignup from './flows/drive/DriveSignup';

const DriveSignupController = (props: BaseSignupContextProps) => {
    return (
        <Switch>
            <Route path={`${SSO_PATHS.DRIVE_SIGNUP}/pricing`}>
                <DrivePricing />
            </Route>
            <Route>
                <DriveSignup {...props} />;
            </Route>
        </Switch>
    );
};

const GenericSignupController = () => {
    /**
     * Here we can control which signups to initiate
     * ie, free, paid, logic for pre selected plans etc
     * Can also do a/b variant detection here
     * Define telemetry params etc
     */
    return <Redirect to="/signup" />;
};

const SignupCtxRouter = (props: BaseSignupContextProps) => {
    return (
        <PaymentsContextOptimisticProvider preload={false} authenticated={false} cachedPlans={cachedPlans}>
            <Switch>
                <Route path={SSO_PATHS.DRIVE_SIGNUP}>
                    <DriveSignupController {...props} />
                </Route>
                <Route>
                    <GenericSignupController />
                </Route>
            </Switch>
        </PaymentsContextOptimisticProvider>
    );
};

export default SignupCtxRouter;
