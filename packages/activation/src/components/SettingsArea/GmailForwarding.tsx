import { GmailSyncModal, useModalState, useUser } from '@proton/components/index';

import { ImportProvider } from '../../interface';
import ProviderCard from './ProviderCards/ProviderCard';

const GmailForwarding = () => {
    const [syncModalProps, setSyncModalProps, renderSyncModal] = useModalState();

    const [user, loadingUser] = useUser();
    const disabled = loadingUser || !user.hasNonDelinquentScope;

    const handleModalClose = (hasError?: boolean) => {
        if (!hasError) {
            setSyncModalProps(false);
        }
    };

    return (
        <>
            <ProviderCard
                provider={ImportProvider.GOOGLE}
                onClick={() => setSyncModalProps(true)}
                disabled={disabled}
                className="mb-4 mr-4"
                data-testid="ProviderCard:googleCardForward"
            />
            {renderSyncModal && <GmailSyncModal noSkip onSyncCallback={handleModalClose} {...syncModalProps} />}
        </>
    );
};

export default GmailForwarding;
