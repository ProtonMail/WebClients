import { CheckListGmailForward, GmailSyncModal, useModalState, useUser } from '@proton/components';

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
            <div className="inline-block">
                <CheckListGmailForward
                    onClick={() => setSyncModalProps(true)}
                    disabled={disabled}
                    data-testid="ProviderCard:googleCardForward"
                />
            </div>
            {renderSyncModal && <GmailSyncModal noSkip onSyncCallback={handleModalClose} {...syncModalProps} />}
        </>
    );
};

export default GmailForwarding;
