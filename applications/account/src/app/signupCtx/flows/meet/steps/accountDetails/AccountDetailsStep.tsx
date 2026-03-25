import { Footer } from '../../components/Layout/Footer';
import Header from '../../components/Layout/Header';
import Layout from '../../components/Layout/Layout';
import { Main } from '../../components/Layout/Main';
import { Wrapper } from '../../components/Layout/Wrapper';
import AccountDetailsForm from './AccountDetailsForm';

import '../../../../shared/styles/arizona.scss';

const AccountDetailsStep = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
    return (
        <Layout>
            <Header showSignIn />

            <Wrapper minHeight="calc(100vh - 5.625rem - 3.75rem)">
                <Main>
                    <AccountDetailsForm onSuccess={onSuccess} />
                </Main>
            </Wrapper>

            <Footer />
        </Layout>
    );
};

export default AccountDetailsStep;
