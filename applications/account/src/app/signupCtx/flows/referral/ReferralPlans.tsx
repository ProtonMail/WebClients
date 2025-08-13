import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { PLANS, SelectedPlan } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';

import { getReferrerName } from '../../helpers/signupSearchParams';
import * as signupSearchParams from '../../helpers/signupSearchParams';
import { Footer } from './components/Layout/Footer';
import Header from './components/Layout/Header';
import Layout from './components/Layout/Layout';
import { Wrapper } from './components/Layout/Wrapper';
import PlanSelector from './components/PlanSelector/PlanSelector';
import { getReferralSignupHrefFromPlanIDs } from './helpers/path';
import { REFERRAL_DEFAULT_PLAN, getReferralPlanIDsFromPlan } from './helpers/plans';

const ReferralPlans = () => {
    const payments = usePaymentOptimistic();
    const history = useHistory();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const referrerName = getReferrerName(searchParams);

    /**
     * Sync selected plan with plan parameter
     */
    useEffect(() => {
        const planParam = signupSearchParams.getPlan(searchParams) || REFERRAL_DEFAULT_PLAN;
        if (planParam === SelectedPlan.name) {
            return;
        }

        void payments.selectPlanIDs(getReferralPlanIDsFromPlan(planParam));
    }, []);

    return (
        <Layout>
            <Header showSignIn />

            <Wrapper minHeight="calc(100vh - 4.25rem - 4rem)">
                <main
                    className="flex flex-column justify-center items-center w-full max-w-custom"
                    style={{ '--max-w-custom': '44rem' }}
                >
                    <h1 className="font-arizona text-semibold text-8xl text-center mb-4">
                        {c('Signup').t`Try ${BRAND_NAME} for 14 days free`}
                    </h1>

                    <p className="mt-0 mb-10 text-center">
                        {referrerName && c('Signup').t`${referrerName} is inviting you to try ${BRAND_NAME}.`}{' '}
                        {c('Signup')
                            .t`Select a service and enjoy the premium version for 14 days free. No credit card required.`}
                    </p>

                    <PlanSelector
                        onPlanClick={({ planIDs }) => {
                            history.replace(
                                getReferralSignupHrefFromPlanIDs({
                                    planIDs,
                                    plansMap: payments.plansMap,
                                })
                            );
                        }}
                        onCTAClick={() => {
                            history.push({
                                pathname: SSO_PATHS.REFERAL_SIGNUP,
                                search: location.search,
                            });
                        }}
                    />

                    <div className="flex flex-row justify-center items-center gap-4 mt-8">
                        <Button
                            onClick={() => {
                                void payments.selectPlanIDs({ [PLANS.FREE]: 1 });

                                history.push({
                                    pathname: SSO_PATHS.REFERAL_SIGNUP,
                                    search: location.search,
                                });
                            }}
                            shape="ghost"
                            color="norm"
                            pill
                        >
                            {c('Signup').t`Continue with the free plan`}
                        </Button>
                    </div>
                </main>
            </Wrapper>

            <Footer />
        </Layout>
    );
};

export default ReferralPlans;
