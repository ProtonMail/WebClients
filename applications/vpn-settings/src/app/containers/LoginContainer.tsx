import { useLocation } from 'react-router-dom';
import * as H from 'history';
import { ProtonLoginCallback } from '@proton/components';
import AccountLoginContainer from 'proton-account/src/app/login/LoginContainer';
import { isMember } from '@proton/shared/lib/user/helpers';

interface Props {
    onLogin: ProtonLoginCallback;
}

const LoginContainer = ({ onLogin }: Props) => {
    const location = useLocation<{ from?: H.Location }>();

    return (
        <AccountLoginContainer
            hasGenerateKeys={false}
            hasRemember={false}
            onLogin={async (data) => {
                const { User } = data;
                const previousLocation = location.state?.from;
                const previousHash = previousLocation?.hash || '';
                const previousSearch = previousLocation?.search || '';
                const path = previousLocation?.pathname || (User && isMember(User) ? '/account' : '/dashboard');
                const pathWithSearch = `${path}${previousSearch}${previousHash}`;
                return onLogin({ ...data, path: pathWithSearch });
            }}
        />
    );
};

export default LoginContainer;
