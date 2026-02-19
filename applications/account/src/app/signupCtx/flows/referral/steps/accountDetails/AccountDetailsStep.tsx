import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import { Aside } from '../../components/Layout/Aside';
import { Footer } from '../../components/Layout/Footer';
import Header from '../../components/Layout/Header';
import Layout from '../../components/Layout/Layout';
import { Main } from '../../components/Layout/Main';
import { Wrapper } from '../../components/Layout/Wrapper';
import { PricingCard } from '../../components/PricingCard/PricingCard';
import AccountDetailsForm from './AccountDetailsForm';

const AccountDetailsStep = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
    const history = useHistory();
    const location = useLocation();

    return (
        <Layout>
            <Header showSignIn />

            <Wrapper marginTop="5vh">
                <Main>
                    <Button
                        onClick={() => {
                            history.push({
                                pathname: SSO_PATHS.REFERAL_PLAN_SELECTION,
                                search: location.search,
                            });
                        }}
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
                    <PricingCard step="account-details" />
                </Aside>
            </Wrapper>

            <Footer />
        </Layout>
    );
};

export default AccountDetailsStep;
