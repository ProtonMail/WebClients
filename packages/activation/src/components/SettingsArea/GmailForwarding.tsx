import { CheckListGmailForward, GmailSyncModal, useFlag, useModalState, useUser } from '@proton/components';

import { EASY_SWITCH_SOURCES } from '../../interface';

const GmailForwarding = () => {
    const isInMaintenance = useFlag('MaintenanceImporter');

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
                    isInMaintenance={isInMaintenance}
                />
            </div>
            {renderSyncModal && (
                <GmailSyncModal
                    noSkip
                    onSyncCallback={handleModalClose}
                    source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
                    {...syncModalProps}
                />
            )}
        </>
    );
};

export default GmailForwarding;
