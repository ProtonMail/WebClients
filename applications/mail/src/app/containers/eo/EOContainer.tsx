import { Provider as ReduxProvider } from 'react-redux';
import { c } from 'ttag';

import { APPS } from '@proton/shared/lib/constants';
import { FeaturesProvider, Href, ModalsChildren } from '@proton/components';

import Layout from 'proton-account/src/app/public/Layout';
import { store } from '../../logic/eo/eoStore';
import EOPageContainer from './EOPageContainer';
import FakeEventManagerProvider from './FakeEventManagerProvider';

const MainContainer = () => {
    const signUpButton = (
        <Href key="terms" className="button button-solid-norm" href="https://protonmail.com/signup">
            {c('Link').t`Sign up for free`}
        </Href>
    );

    return (
        <FakeEventManagerProvider>
            <FeaturesProvider>
                <Layout toApp={APPS.PROTONMAIL} customHeaderActions={signUpButton}>
                    <ReduxProvider store={store}>
                        <EOPageContainer />
                    </ReduxProvider>
                </Layout>
                <ModalsChildren />
            </FeaturesProvider>
        </FakeEventManagerProvider>
    );
};

export default MainContainer;
