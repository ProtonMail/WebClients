import { useUser } from '@proton/account/user/hooks';
import { getIsGlobalSSOAccount } from '@proton/shared/lib/keys';

import AuthModal, { type AuthModalProps } from './AuthModal';
import SSOAuthModal from './SSOAuthModal';

const AuthModalContainer = (props: AuthModalProps) => {
    const [user] = useUser();
    if (getIsGlobalSSOAccount(user)) {
        return <SSOAuthModal {...props} />;
    }
    return <AuthModal {...props} />;
};

export default AuthModalContainer;
