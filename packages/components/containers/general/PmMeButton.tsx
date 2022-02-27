import { useState } from 'react';
import { c } from 'ttag';
import { Address } from '@proton/shared/lib/interfaces';
import { setupAddress } from '@proton/shared/lib/api/addresses';
import {
    useApi,
    useAddresses,
    useLoading,
    useEventManager,
    useOrganization,
    useOrganizationKey,
    useModals,
    useNotifications,
    usePremiumDomains,
    useUser,
} from '../../hooks';
import { Button, useModalState } from '../../components';
import UnlockModal from '../login/UnlockModal';
import CreateMissingKeysAddressModal from '../addresses/missingKeys/CreateMissingKeysAddressModal';

const PmMeButton = () => {
    const [{ Name }] = useUser();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();
    const [addresses, loadingAddresses] = useAddresses();
    const [premiumDomains, loadingPremiumDomains] = usePremiumDomains();
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const isLoadingDependencies =
        loadingAddresses || loadingPremiumDomains || loadingOrganization || loadingOrganizationKey;
    const [Domain = ''] = premiumDomains || [];

    const [addressToGenerate, setAddressToGenerate] = useState<Address[]>([]);
    const [createMissingKeysAddressProps, setCreateMissingKeysAddressModalOpen, renderMissingKeysModal] =
        useModalState();

    const createPremiumAddress = async () => {
        const [{ DisplayName = '', Signature = '' } = {}] = addresses || [];
        await new Promise<void>((resolve, reject) => {
            createModal(<UnlockModal onClose={() => reject()} onSuccess={resolve} />);
        });
        const { Address } = await api(
            setupAddress({
                Domain,
                DisplayName: DisplayName || '', // DisplayName can be null
                Signature: Signature || '', // Signature can be null
            })
        );
        await call();
        createNotification({ text: c('Success').t`Premium address created` });
        setAddressToGenerate(Address);
        setCreateMissingKeysAddressModalOpen(true);
    };

    return (
        <>
            <Button
                color="norm"
                disabled={isLoadingDependencies || !Domain}
                loading={loading}
                onClick={() => withLoading(createPremiumAddress())}
            >
                {c('Action').t`Activate ${Name}@pm.me`}
            </Button>
            {renderMissingKeysModal && (
                <CreateMissingKeysAddressModal
                    {...createMissingKeysAddressProps}
                    organizationKey={organizationKey}
                    addressesToGenerate={addressToGenerate}
                />
            )}
        </>
    );
};

export default PmMeButton;
