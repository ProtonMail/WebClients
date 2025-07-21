import { useUser } from '@proton/account/user/hooks';
import { getIsSSOAccount } from '@proton/shared/lib/keys';

import DetermineAuthModal from './DetermineAuthModal';
import SSOAuthModal from './SSOAuthModal';
import SrpAuthModal, { type SrpAuthModalProps } from './SrpAuthModal';
import type { OwnAuthModalProps } from './interface';

export interface AuthModalProps extends OwnAuthModalProps, Pick<SrpAuthModalProps, 'open' | 'onClose' | 'onExit'> {}

export type { AuthModalResult } from './interface';

const AuthModal = (props: AuthModalProps) => {
    const [user] = useUser();
    if (!user.isSelf) {
        return <DetermineAuthModal {...props} />;
    }
    if (getIsSSOAccount(user)) {
        return <SSOAuthModal {...props} />;
    }
    return <SrpAuthModal {...props} />;
};

export default AuthModal;
