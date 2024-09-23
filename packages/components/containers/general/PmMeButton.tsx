import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import { useLoading } from '@proton/hooks';
import { setupAddress } from '@proton/shared/lib/api/addresses';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';
import { missingKeysSelfProcess } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import {
    useApi,
    useAuthentication,
    useEventManager,
    useGetAddresses,
    useGetUserKeys,
    useModals,
    useNotifications,
    useProtonDomains,
    useUser,
} from '../../hooks';
import UnlockModal from '../login/UnlockModal';

export const getActivateString = (user: User) => {
    return c('Action').t`Activate ${user.Name}@pm.me`;
};

const PmMeButton = ({ children }: { children: ReactNode }) => {
    const [user] = useUser();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const getAddresses = useGetAddresses();
    const [{ premiumDomains }, loadingProtonDomains] = useProtonDomains();
    const getUserKeys = useGetUserKeys();
    const isLoadingDependencies = loadingProtonDomains;
    const [Domain = ''] = premiumDomains;
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => user);

    const createPremiumAddress = async () => {
        const addresses = await getAddresses();
        const [{ DisplayName = '', Signature = '' } = {}] = addresses || [];
        await new Promise<string>((resolve, reject) => {
            createModal(<UnlockModal onClose={() => reject()} onSuccess={resolve} />);
        });
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
        <Button
            color="norm"
            disabled={isLoadingDependencies || !Domain}
            loading={loading}
            onClick={() => withLoading(createPremiumAddress())}
        >
            {children}
        </Button>
    );
};

export default PmMeButton;
