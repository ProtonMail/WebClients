import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { Footer } from '../components/Layout/Footer';
import Header from '../components/Layout/Header';
import Layout from '../components/Layout/Layout';
import { Wrapper } from '../components/Layout/Wrapper';
import PlanSelector from '../components/plans/PlanSelector/PlanSelector';
import { getBusinessReferralPlanConfigs } from '../config/planConfigs';
import { useValidateReferrer } from '../helpers/useValidateReferrer';

const PlansStep = () => {
    const [{ b2c2b }] = useReferralInfo();
    const referralDiscountPercent = b2c2b.refereeRewardAmount;

    useValidateReferrer();

    return (
        <Layout>
            <Header />

            <Wrapper className="items-center">
                <main className="flex flex-column flex-nowrap justify-center items-center w-full">
                    <h1 className="font-arizona text-semibold text-5xl md:text-7xl text-center mb-4">
                        {
                            // translator: full sentence "Get an additional 10% off your first year of Proton for Business"
                            c('Signup')
                                .t`Get an additional ${referralDiscountPercent}% off your first year of ${BRAND_NAME} for Business`
                        }
                    </h1>

                    <p className="mt-0 mb-10 text-center max-w-custom" style={{ '--max-w-custom': '30rem' }}>
                        {c('Signup')
                            .t`You're invited to join 100,000+ organizations that protect their data with ${BRAND_NAME}'s encrypted ecosystem.`}{' '}
                        {c('Signup').t`Pick a plan to get started.`}
                    </p>

                    <PlanSelector plans={getBusinessReferralPlanConfigs()} />
                </main>
            </Wrapper>

            <Footer />
        </Layout>
    );
};

export default PlansStep;
