import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { CYCLE, PLANS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import * as signupSearchParams from '../../helpers/signupSearchParams';
import { availablePlans } from './DriveSignup';
import { Footer } from './components/Layout/Footer';
import Layout from './components/Layout/Layout';
import PlanSelector from './components/PlanSelector/PlanSelector';
import { getSignupHrefFromPlanIDs } from './helpers/path';

import '../../shared/styles/arizona.scss';

const DrivePricing = () => {
    const payments = usePaymentOptimistic();

    const history = useHistory();

    const silentApi = useSilentApi();

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    useEffect(() => {
        const run = async () => {
            await payments.initialize({
                api: silentApi,
                paymentFlow: 'signup',
                onChargeable: async () => {},
                planToCheck: {
                    planIDs: {},
                    cycle: signupSearchParams.getCycle(searchParams) || CYCLE.YEARLY,
                    coupon: signupSearchParams.getCoupon(searchParams),
                },
                paramCurrency: signupSearchParams.getCurrency(searchParams),
                availablePlans: availablePlans,
            });
        };
        void run();
    }, []);

    return (
        <Layout>
            <div className="pt-2">
                <PlanSelector
                    title={c('Signup').t`Pick your perfect plan`}
                    onPlanCTAClick={({ planIDs, cycle, currency }) => {
                        history.push(
                            getSignupHrefFromPlanIDs({
                                planIDs,
                                cycle,
                                currency,
                                plansMap: payments.plansMap,
                                targetPath: SSO_PATHS.DRIVE_SIGNUP,
                            })
                        );
                    }}
                    highlightedPlan={PLANS.DRIVE}
                />
            </div>
            <Footer />
        </Layout>
    );
};

export default DrivePricing;
