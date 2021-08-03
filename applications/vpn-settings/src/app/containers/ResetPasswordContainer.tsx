import { c } from 'ttag';
import { MinimalResetPasswordContainer, OnLoginCallback } from '@proton/components';
import SignInLayout from '../components/layout/SignInLayout';

interface Props {
    onLogin: OnLoginCallback;
}

const ResetPasswordContainer = ({ onLogin }: Props) => {
    return (
        <SignInLayout title={c('Title').t`Reset password`}>
            <h2>{c('Title').t`Reset password`}</h2>
            <MinimalResetPasswordContainer onLogin={onLogin} />
        </SignInLayout>
    );
};

export default ResetPasswordContainer;
