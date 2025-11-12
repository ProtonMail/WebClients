import { useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '@proton/activation/src/constants';
import useSetupGmailBYOEAddress from '@proton/activation/src/hooks/useSetupGmailBYOEAddress';
import { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms/Button/Button';
import { useModalState } from '@proton/components';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

import useBYOEAddressesCounts from '../../hooks/useBYOEAddressesCounts';
import BYOEConversionModal from '../Modals/BYOEConversionModal/BYOEConversionModal';
import GmailSyncModal from '../Modals/GmailSyncModal/GmailSyncModal';
import ReachedLimitForwardingModal from '../Modals/ReachedLimitForwardingModal/ReachedLimitForwardingModal';
import RemoveForwardingModal from '../Modals/RemoveForwardingModal/RemoveForwardingModal';
import UpsellConversionModal from '../Modals/UpsellConversionModal/UpsellConversionModal';
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
    const { activeBYOEAddresses, forwardingList, isLoadingAddressesCount } = useBYOEAddressesCounts();

    const [syncModalProps, setSyncModalOpen, renderSyncModal] = useModalState();
    const [reachedLimitForwardingModalProps, setReachedLimitForwardingModalOpen, renderReachedLimitForwardingModal] =
        useModalState();
    const [upsellForwardingModalProps, setUpsellForwardingModalOpen, renderUpsellForwardingModal] = useModalState();
    const [upsellConversionModalProps, setUpsellConversionModalOpen, renderUpsellConversionModal] = useModalState();
    const [conversionModalProps, setConversionModalOpen, renderConversionModal] = useModalState();
    const [removeForwardingModalProps, setRemoveForwardingModalOpen, renderRemoveForwardingModal] = useModalState();

    const [expectedEmailAddress, setExpectedEmailAddress] = useState<string | undefined>();

    const disabled =
        loadingUser || loadingAddresses || isInMaintenance || isLoadingAddressesCount;

    const handleCloseForwardingModal = (hasError?: boolean) => {
        if (!hasError) {
            setSyncModalOpen(false);
        }
    };

    const handleAddForwarding = () => {
        if (!addresses) {
            return;
        }
        // Users should see a limit or upsell modal if reaching the maximum of BYOE addresses included in their plan.
        if (!hasPaidMail(user) && activeBYOEAddresses.length >= MAX_SYNC_FREE_USER) {
            setUpsellForwardingModalOpen(true);
        } else if (activeBYOEAddresses.length >= MAX_SYNC_PAID_USER) {
            setReachedLimitForwardingModalOpen(true);
        } else {
            if (forwardingList.length > 0 && hasAccessToBYOE) {
                setConversionModalOpen(true);
            } else {
                setSyncModalOpen(true);
            }
        }
    };

    const handleOpenSyncModal = async (expectedEmailAddress: string | undefined) => {
        setExpectedEmailAddress(expectedEmailAddress);
        setSyncModalOpen(true);
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
                            ? EASY_SWITCH_SOURCES.ACCOUNT_WEB_ADDRESSES_BYOE
                            : EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS
                    }
                    hasAccessToBYOE={hasAccessToBYOE}
                    expectedEmailAddress={expectedEmailAddress}
                    onCloseCallback={() => setExpectedEmailAddress(undefined)}
                    {...syncModalProps}
                />
            )}

            {renderConversionModal && (
                <BYOEConversionModal
                    openUpsellModal={() => setUpsellConversionModalOpen(true)}
                    openSyncModal={handleOpenSyncModal}
                    openRemoveForwardingModal={() => setRemoveForwardingModalOpen(true)}
                    {...conversionModalProps}
                />
            )}

            {renderReachedLimitForwardingModal && <ReachedLimitForwardingModal {...reachedLimitForwardingModalProps} />}
            {renderUpsellConversionModal && <UpsellConversionModal modalProps={upsellConversionModalProps} />}
            {renderUpsellForwardingModal && (
                <UpsellForwardingModal hasAccessToBYOE={hasAccessToBYOE} modalProps={upsellForwardingModalProps} />
            )}
            {renderRemoveForwardingModal && <RemoveForwardingModal {...removeForwardingModalProps} />}
        </>
    );
};

export default ConnectGmailButton;
