import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useProtonDomains } from '@proton/account/protonDomains/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import AuthModal, { type AuthModalResult } from '@proton/components/containers/password/AuthModal';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useEventManager from '@proton/components/hooks/useEventManager';
import { useLoading } from '@proton/hooks';
import { setupAddress } from '@proton/shared/lib/api/addresses';
import { queryUnlock } from '@proton/shared/lib/api/user';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';
import { missingKeysSelfProcess } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { useNotifications } from '../../hooks';

export const getActivateString = (user: User) => {
    return c('Action').t`Activate ${user.Name}@pm.me`;
};

const PmMeButton = ({ children }: { children: ReactNode }) => {
    const [user] = useUser();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const getAddresses = useGetAddresses();
    const [{ premiumDomains }, loadingProtonDomains] = useProtonDomains();
    const getUserKeys = useGetUserKeys();
    const isLoadingDependencies = loadingProtonDomains;
    const [Domain = ''] = premiumDomains;
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => user);
    const [authModal, showAuthModal] = useModalTwoPromise<undefined, AuthModalResult>();

    const createPremiumAddress = async () => {
        const addresses = await getAddresses();
        await showAuthModal();
        const [{ DisplayName = '', Signature = '' } = {}] = addresses || [];
        const { Address } = await api(
            setupAddress({
                Domain,
                DisplayName: DisplayName || '', // DisplayName can be null
                Signature: Signature || '', // Signature can be null
            })
        );
        const userKeys = await getUserKeys();
        await missingKeysSelfProcess({
            api,
            userKeys,
            addresses,
            addressesToGenerate: [Address],
            password: authentication.getPassword(),
            keyGenConfig: KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
            onUpdate: noop,
            keyTransparencyVerify,
        });
        await keyTransparencyCommit(userKeys);
        await call();
        createNotification({ text: c('Success').t`Premium address created` });
    };

    return (
        <>
            {authModal((props) => {
                return (
                    <AuthModal
                        {...props}
                        scope="locked"
                        config={queryUnlock()}
                        onCancel={props.onReject}
                        onSuccess={props.onResolve}
                    />
                );
            })}
            <Button
                color="norm"
                disabled={isLoadingDependencies || !Domain}
                loading={loading}
                onClick={() => withLoading(createPremiumAddress().catch(noop))}
            >
                {children}
            </Button>
        </>
    );
};

export default PmMeButton;
