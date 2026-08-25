import type { ReactNode } from 'react';

import { c } from 'ttag';

import { createPremiumAddress } from '@proton/account/addresses/actions';
import { useProtonDomains } from '@proton/account/protonDomains/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { queryUnlock } from '@proton/shared/lib/api/user';
import type { User } from '@proton/shared/lib/interfaces';

import { useModalTwoPromise } from '../../components/modalTwo/useModalTwo';
import useErrorHandler from '../../hooks/useErrorHandler';
import AuthModal from '../password/AuthModal';
import type { AuthModalResult } from '../password/interface';

export const getActivateString = (user: User) => {
    return c('Action').t`Activate ${user.Name}@pm.me`;
};

const PmMeButton = ({ children }: { children: ReactNode }) => {
    const [loading, withLoading] = useLoading();
    const [{ premiumDomains }, loadingProtonDomains] = useProtonDomains();
    const isLoadingDependencies = loadingProtonDomains;
    const [domain = ''] = premiumDomains;
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [authModal, showAuthModal] = useModalTwoPromise<undefined, AuthModalResult>();
    const errorHandler = useErrorHandler();

    const createPremiumAddressHelper = async () => {
        await showAuthModal();
        await dispatch(createPremiumAddress({ domain }));
        createNotification({ text: c('Success').t`Premium address created` });
    };

    return (
        <>
            {authModal(({ onResolve, onReject, ...props }) => {
                return (
                    <AuthModal
                        {...props}
                        scope="locked"
                        config={queryUnlock()}
                        onCancel={onReject}
                        onSuccess={onResolve}
                    />
                );
            })}
            <Button
                color="norm"
                disabled={isLoadingDependencies || !domain}
                loading={loading}
                onClick={() => withLoading(createPremiumAddressHelper().catch(errorHandler))}
            >
                {children}
            </Button>
        </>
    );
};

export default PmMeButton;
