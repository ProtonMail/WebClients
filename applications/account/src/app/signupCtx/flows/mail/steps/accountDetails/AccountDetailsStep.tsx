import { Aside } from '../../components/Layout/Aside';
import { Footer } from '../../components/Layout/Footer';
import Header from '../../components/Layout/Header';
import Layout from '../../components/Layout/Layout';
import { Main } from '../../components/Layout/Main';
import { Wrapper } from '../../components/Layout/Wrapper';
import { PricingCardVariantA } from '../../components/PricingCard/PricingCardVariantA';
import { PricingCardVariantB } from '../../components/PricingCard/PricingCardVariantB';
import { PricingCardVariantC } from '../../components/PricingCard/PricingCardVariantC';
import useMailSignupVariant, { MAIL_SIGNUP_VARIANTS } from '../../hooks/useMailSignupVariant';
import AccountDetailsForm from './AccountDetailsForm';

import '../../../../shared/styles/arizona.scss';

const AccountDetailsStep = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
    const variant = useMailSignupVariant();
    return (
        <Layout>
            <Header showSignIn />
            <Wrapper minHeight="calc(100vh - 4.25rem - 4rem)">
                <Main>
                    <AccountDetailsForm onSuccess={onSuccess} />
                </Main>
                <Aside>
                    {variant === MAIL_SIGNUP_VARIANTS.A && <PricingCardVariantA />}
                    {variant === MAIL_SIGNUP_VARIANTS.B && <PricingCardVariantB />}
                    {variant === MAIL_SIGNUP_VARIANTS.C && <PricingCardVariantC />}
                </Aside>
            </Wrapper>
            <Footer />
        </Layout>
    );
};

export default AccountDetailsStep;
