import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { TRIAL_DURATION_DAYS } from '@proton/payments';
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
import { REFERRAL_DEFAULT_PLAN, type SupportedReferralPlans, getReferralSelectedPlan } from './helpers/plans';

const ReferralPlans = () => {
    const payments = usePaymentOptimistic();
    const history = useHistory();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const referrerName = getReferrerName(searchParams);
    const [referralInfo] = useReferralInfo();
    /**
     * Sync selected plan with plan parameter
     */
    useEffect(() => {
        // Wait for payments context to be initialized before syncing
        if (!payments.initializationStatus.triggered) {
            return;
        }

        const planParam = signupSearchParams.getPlan(searchParams) || REFERRAL_DEFAULT_PLAN;
        if (planParam === payments.selectedPlan.name) {
            return;
        }

        void payments.selectPlan(getReferralSelectedPlan(planParam as SupportedReferralPlans));
    }, [payments.initializationStatus.triggered, payments.selectedPlan.name]);

    const br = <span key="br" className="md:block" />;
    return (
        <Layout>
            <Header showSignIn />

            <Wrapper>
                <main className="flex flex-column justify-center items-center w-full">
                    <h1 className="font-arizona text-semibold text-8xl text-center mb-4">
                        {
                            // translator: full sentence "Try Proton Drive for 14 days free, and get US$20 in credits"
                            c('Signup')
                                .jt`Try ${BRAND_NAME} for ${TRIAL_DURATION_DAYS} days free,${br} and get ${referralInfo.uiData.refereeRewardAmount} in credits`
                        }
                    </h1>

                    <p className="mt-0 mb-10 text-center max-w-custom" style={{ '--max-w-custom': '30rem' }}>
                        {referrerName
                            ? c('Signup')
                                  .t`${referrerName} is inviting you to join 100M+ people who chose to stay in control of their data with ${BRAND_NAME}'s encrypted ecosystem.`
                            : c('Signup')
                                  .t`You’re invited to join 100M+ people who chose to stay in control of their data with ${BRAND_NAME}'s encrypted ecosystem.`}{' '}
                        {c('Signup').t`Pick a service to get started.`}
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
                </main>
            </Wrapper>

            <Footer />
        </Layout>
    );
};

export default ReferralPlans;
