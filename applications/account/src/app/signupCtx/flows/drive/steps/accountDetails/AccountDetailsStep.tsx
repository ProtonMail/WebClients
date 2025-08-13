import { useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { IcArrowDown } from '@proton/icons';
import { usePaymentOptimistic } from '@proton/payments/ui';

import { Aside } from '../../components/Layout/Aside';
import { Footer } from '../../components/Layout/Footer';
import Header from '../../components/Layout/Header';
import Layout from '../../components/Layout/Layout';
import { Main } from '../../components/Layout/Main';
import { Wrapper } from '../../components/Layout/Wrapper';
import PlanSelector from '../../components/PlanSelector/PlanSelector';
import { PricingCard } from '../../components/PricingCard/PricingCard';
import { getSignupHrefFromPlanIDs } from '../../helpers/path';
import AccountDetailsForm from './AccountDetailsForm';

import '../../../../shared/styles/arizona.scss';

const Plans = ({ onScrollToTop }: { onScrollToTop: () => void }) => {
    const payments = usePaymentOptimistic();
    const history = useHistory();

    return (
        <PlanSelector
            title={c('Signup').t`Compare plans`}
            onPlanCTAClick={({ planIDs, cycle, currency }) => {
                onScrollToTop();
                payments.selectPlan({
                    planIDs,
                    cycle,
                    currency,
                });
                history.push(getSignupHrefFromPlanIDs({ planIDs, cycle, currency, plansMap: payments.plansMap }));
            }}
        />
    );
};

const AccountDetailsStep = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
    const topRef = useRef<HTMLElement>(null);
    const scrollToTop = () => {
        requestAnimationFrame(() => {
            topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };
    return (
        <Layout>
            <Header ref={topRef} showSignIn />

            <Wrapper minHeight="calc(100vh - 4.25rem)">
                <Main>
                    <AccountDetailsForm onSuccess={onSuccess} />
                </Main>
                <Aside>
                    <PricingCard step="account-details" />
                    <ButtonLike
                        as="a"
                        href={`${window.location.pathname + window.location.search}#plans`}
                        shape="outline"
                        color="norm"
                        pill
                        className="bg-transparent"
                    >
                        {c('Signup').t`Compare plans`} <IcArrowDown className="shrink-0" />
                    </ButtonLike>
                </Aside>
            </Wrapper>

            <div>
                <Plans onScrollToTop={scrollToTop} />
            </div>

            <Footer />
        </Layout>
    );
};

export default AccountDetailsStep;
