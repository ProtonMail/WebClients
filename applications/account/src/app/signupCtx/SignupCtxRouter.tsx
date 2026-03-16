import { Redirect, Route, Switch } from 'react-router-dom';

import { PaymentsContextOptimisticProvider } from '@proton/payments/ui';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import { cachedPlans } from '../defaultPlans';
import type { BaseSignupContextProps } from './context/SignupContext';
import EmailReservationSignup from './flows/bornPrivate/emailReservation/EmailReservationSignup';
import DrivePricing from './flows/drive/DrivePricing';
import DriveSignup from './flows/drive/DriveSignup';
import GenericStartSignup from './flows/genericStart/GenericStartSignup';
import GreenlandSignup from './flows/greenland/GreenlandSignup';
import MeetB2CSignup from './flows/meet/MeetB2CSignup';
import PassSignup from './flows/pass/PassSignup';
import ReferralSignup from './flows/referral/ReferralSignup';

const DriveSignupController = (props: BaseSignupContextProps) => (
    <Switch>
        <Route path={`${SSO_PATHS.DRIVE_SIGNUP}/pricing`}>
            <DrivePricing />
        </Route>
        <Route>
            <DriveSignup {...props} />
        </Route>
    </Switch>
);

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
                <GenericStartSignup {...props} />
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
                    <ReferralSignup {...props} />
                </Route>
                <Route path={SSO_PATHS.PASS_SIGNUP}>
                    <PassSignup {...props} />
                </Route>
                <Route path={SSO_PATHS.MEET_SIGNUP}>
                    <MeetB2CSignup {...props} />
                </Route>
                <Route path={SSO_PATHS.GREENLAND_SIGNUP}>
                    <GreenlandSignup {...props} />
                </Route>
                <Route path={[SSO_PATHS.BORN_PRIVATE, SSO_PATHS.MAIL_BORN_PRIVATE]}>
                    <EmailReservationSignup />
                </Route>
                <Route>
                    <GenericSignupController {...props} />
                </Route>
            </Switch>
        </PaymentsContextOptimisticProvider>
    );
};

export default SignupCtxRouter;
