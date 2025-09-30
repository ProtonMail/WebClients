import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '@proton/activation/src/constants';
import useSetupGmailBYOEAddress from '@proton/activation/src/hooks/useSetupGmailBYOEAddress';
import { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms';
import { useModalState } from '@proton/components';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

import useBYOEAddressesCounts from '../../hooks/useBYOEAddressesCounts';
import GmailSyncModal from '../Modals/GmailSyncModal/GmailSyncModal';
import ReachedLimitForwardingModal from '../Modals/ReachedLimitForwardingModal/ReachedLimitForwardingModal';
import UpsellForwardingModal from '../Modals/UpsellForwardingModal/UpsellForwardingModal';

interface Props {
    showIcon?: boolean;
    className?: string;
    buttonText?: string;
}

const ConnectGmailButton = ({
    showIcon,
    className,
    buttonText = c('Action').t`Set up auto-forwarding from Gmail`,
}: Props) => {
    const [user, loadingUser] = useUser();
    const [addresses, loadingAddresses] = useAddresses();

    const { hasAccessToBYOE, isInMaintenance, handleSyncCallback } = useSetupGmailBYOEAddress();
    const { addressesOrSyncs } = useBYOEAddressesCounts();

    const [syncModalProps, setSyncModalOpen, renderSyncModal] = useModalState();
    const [reachedLimitForwardingModalProps, setReachedLimitForwardingModalOpen, renderReachedLimitForwardingModal] =
        useModalState();
    const [upsellForwardingModalProps, setUpsellForwardingModalOpen, renderUpsellForwardingModal] = useModalState();

    const disabled = loadingUser || loadingAddresses || !user.hasNonDelinquentScope || isInMaintenance;

    const handleCloseForwardingModal = (hasError?: boolean) => {
        if (!hasError) {
            setSyncModalOpen(false);
        }
    };

    const handleAddForwarding = () => {
        if (!addresses) {
            return;
        }
        console.log({ hasPaid: hasPaidMail(user), addressesOrSyncs: addressesOrSyncs.length });
        // Users should see a limit modal if reaching the maximum of BYOE addresses or syncs included in their plan.
        if (!hasPaidMail(user) && addressesOrSyncs.length >= MAX_SYNC_FREE_USER) {
            console.log('0');
            setUpsellForwardingModalOpen(true);
        } else if (addressesOrSyncs.length >= MAX_SYNC_PAID_USER) {
            console.log('1');
            setReachedLimitForwardingModalOpen(true);
        } else {
            console.log('2');
            setSyncModalOpen(true);
        }
    };

    return (
        <>
            <Button
                className={className}
                onClick={handleAddForwarding}
                disabled={disabled}
                data-testid="ProviderButton:googleCardForward"
            >
                {showIcon && <img src={googleLogo} alt="" />}
                {buttonText}
            </Button>

            {renderSyncModal && (
                <GmailSyncModal
                    noSkip
                    onSyncCallback={hasAccessToBYOE ? handleSyncCallback : handleCloseForwardingModal}
                    source={
                        hasAccessToBYOE
                            ? EASY_SWITCH_SOURCES.ACCOUNT_WEB_EXTERNAL_GMAIL
                            : EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS
                    }
                    hasAccessToBYOE={hasAccessToBYOE}
                    {...syncModalProps}
                />
            )}

            {renderReachedLimitForwardingModal && <ReachedLimitForwardingModal {...reachedLimitForwardingModalProps} />}
            {renderUpsellForwardingModal && (
                <UpsellForwardingModal hasAccessToBYOE={hasAccessToBYOE} modalProps={upsellForwardingModalProps} />
            )}
        </>
    );
};

export default ConnectGmailButton;
