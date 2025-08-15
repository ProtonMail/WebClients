import { Aside } from '../../components/Layout/Aside';
import { Footer } from '../../components/Layout/Footer';
import Header from '../../components/Layout/Header';
import Layout from '../../components/Layout/Layout';
import { Main } from '../../components/Layout/Main';
import { Wrapper } from '../../components/Layout/Wrapper';
import { PricingCard } from '../../components/PricingCard/PricingCard';
import AccountDetailsForm from './AccountDetailsForm';

import '../../../../shared/styles/arizona.scss';

const AccountDetailsStep = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
    return (
        <Layout>
            <Header showSignIn />

            <Wrapper minHeight="calc(100vh - 4.25rem - 3.85rem)">
                <Main>
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
