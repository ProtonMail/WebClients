import { c } from 'ttag';
import { MinimalForgotUsernameContainer } from '@proton/components';
import SignInLayout from '../components/layout/SignInLayout';

const ForgotUsernameContainer = () => {
    return (
        <SignInLayout title={c('Title').t`Forgot username`}>
            <h2>{c('Title').t`Forgot username`}</h2>
            <MinimalForgotUsernameContainer />
        </SignInLayout>
    );
};

export default ForgotUsernameContainer;
