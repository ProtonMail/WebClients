import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcArrowLeft } from '@proton/icons';

import { Aside } from '../../components/Layout/Aside';
import { Footer } from '../../components/Layout/Footer';
import Header from '../../components/Layout/Header';
import Layout from '../../components/Layout/Layout';
import { Main } from '../../components/Layout/Main';
import { Wrapper } from '../../components/Layout/Wrapper';
import { PricingCard } from '../../components/PricingCard/PricingCard';
import AccountDetailsForm from './AccountDetailsForm';

const AccountDetailsStep = ({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => Promise<void> }) => {
    return (
        <Layout>
            <Header showSignIn />

            <Wrapper minHeight="calc(100vh - 4.25rem - 4rem)">
                <Main>
                    <Button
                        onClick={onBack}
                        shape="ghost"
                        size="small"
                        className="inline-flex gap-1 items-center self-start ml-custom"
                        style={{ '--ml-custom': 'calc(var(--padding-inline) * -1)' }}
                        data-testid="back-button"
                    >
                        <IcArrowLeft className="shrink-0" />
                        {c('Action').t`Go back`}
                    </Button>
                    <AccountDetailsForm onSuccess={onSuccess} />
                </Main>
                <Aside>
                    <PricingCard />
                </Aside>
            </Wrapper>

            <Footer />
        </Layout>
    );
};

export default AccountDetailsStep;
