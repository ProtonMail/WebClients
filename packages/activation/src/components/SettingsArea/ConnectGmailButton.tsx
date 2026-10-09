import { useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useModalState } from '@proton/components';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

import { useBYOEGating } from '../../byoe/useBYOEGating';
import { getBYOEDisabledNotification } from '../../constants';
import useBYOEAddressesCounts from '../../hooks/useBYOEAddressesCounts';
import useSetupGmailBYOEAddress from '../../hooks/useSetupGmailBYOEAddress';
import type { EASY_SWITCH_SOURCES, TIME_PERIOD } from '../../interface';
import { setBYOEFlowResult } from '../../logic/byoeFlow/byoeFlow.slice';
import { useEasySwitchDispatch } from '../../logic/store';
import { changeCreateLoadingState } from '../../logic/sync/sync.actions';
import AddressLinkedToAnotherAccountModal from '../Modals/AddressLinkedToAnotherAccountModal/AddressLinkedToAnotherAccountModal';
import BYOEConversionModal from '../Modals/BYOEConversionModal/BYOEConversionModal';
import { ClaimableAddressModal } from '../Modals/ClaimableAddressModal/ClaimableAddressModal';
import GmailSyncModal from '../Modals/GmailSyncModal/GmailSyncModal';
import ReachedLimitForwardingModal from '../Modals/ReachedLimitForwardingModal/ReachedLimitForwardingModal';
import RemoveForwardingModal from '../Modals/RemoveForwardingModal/RemoveForwardingModal';
import UpsellConversionModal from '../Modals/UpsellConversionModal/UpsellConversionModal';
import UpsellForwardingModal from '../Modals/UpsellForwardingModal/UpsellForwardingModal';

interface Props {
    showIcon?: boolean;
    className?: string;
    buttonText?: string;
    onComplete?: () => Promise<void>;
    onBYOEFlowStart?: () => void;
    source: EASY_SWITCH_SOURCES;
}

const ConnectGmailButton = ({
    showIcon,
    className,
    buttonText = c('Action').t`Set up auto-forwarding from Gmail`,
    onComplete,
    onBYOEFlowStart,
    source,
}: Props) => {
    const { createNotification } = useNotifications();
    const easySwitchDispatch = useEasySwitchDispatch();

    const [user] = useUser();
    const [addresses] = useAddresses();

    const { hasAccessToBYOE, isLoadingGating, checkGating, isInMaintenance } = useBYOEGating();
    const { forwardingList } = useBYOEAddressesCounts();
    const disabled = isLoadingGating || isInMaintenance || !addresses;

    const [syncModalProps, setSyncModalOpen, renderSyncModal] = useModalState();
    const [reachedLimitForwardingModalProps, setReachedLimitForwardingModalOpen, renderReachedLimitForwardingModal] =
        useModalState();
    const [upsellForwardingModalProps, setUpsellForwardingModalOpen, renderUpsellForwardingModal] = useModalState();
    const [upsellConversionModalProps, setUpsellConversionModalOpen, renderUpsellConversionModal] = useModalState();
    const [conversionModalProps, setConversionModalOpen, renderConversionModal] = useModalState();
    const [removeForwardingModalProps, setRemoveForwardingModalOpen, renderRemoveForwardingModal] = useModalState();
    const [
        addressLinkedToAnotherAccountModalProps,
        setAddressLinkedToAnotherAccountModalOpen,
        renderAddressLinkedToAnotherAccountModal,
    ] = useModalState();
    const [claimableAddressModalProps, setClaimableAddressModalOpen, renderClaimableAddressModal] = useModalState();

    const [expectedEmailAddress, setExpectedEmailAddress] = useState<string | undefined>();
    const [claimableAddress, setClaimableAddress] = useState<
        { email: string; importEmails: boolean; importPeriod: TIME_PERIOD | undefined } | undefined
    >();

    const { handleBYOEWithImportCallback, handleClaimAddress } = useSetupGmailBYOEAddress({
        showSuccessModal: (connectedAddress: string, importEmails: boolean) => {
            easySwitchDispatch(
                setBYOEFlowResult({
                    connectedAddress,
                    isPaid: hasPaidMail(user),
                    skipImport: !importEmails,
                })
            );
        },
        showAddressLinkedToAnotherAccountModal: () => {
            setAddressLinkedToAnotherAccountModalOpen(true);
        },
        showClaimableAddressModal: (email: string, importEmails: boolean, importPeriod: TIME_PERIOD | undefined) => {
            setClaimableAddress({ email, importEmails, importPeriod });
            setClaimableAddressModalOpen(true);
        },
        onComplete: () => {
            easySwitchDispatch(changeCreateLoadingState('idle'));
            setSyncModalOpen(false);
            setExpectedEmailAddress(undefined);
        },
        source,
    });

    const handleCloseForwardingModal = (hasError?: boolean) => {
        if (!hasError) {
            setSyncModalOpen(false);
        }
    };

    const handleAddForwarding = () => {
        if (!addresses) {
            return;
        }

        const outcome = checkGating();
        if (outcome === 'feature-disabled') {
            createNotification(getBYOEDisabledNotification());
        } else if (outcome === 'free-limit') {
            setUpsellForwardingModalOpen(true);
        } else if (outcome === 'paid-limit') {
            setReachedLimitForwardingModalOpen(true);
        } else {
            onBYOEFlowStart?.();
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
                    onSyncCallback={handleCloseForwardingModal}
                    onBYOECallback={handleBYOEWithImportCallback}
                    source={source}
                    hasAccessToBYOE={hasAccessToBYOE}
                    expectedEmailAddress={expectedEmailAddress}
                    onCloseCallback={() => setExpectedEmailAddress(undefined)}
                    onComplete={onComplete}
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
            {renderAddressLinkedToAnotherAccountModal && (
                <AddressLinkedToAnotherAccountModal {...addressLinkedToAnotherAccountModalProps} />
            )}
            {renderClaimableAddressModal && claimableAddress && (
                <ClaimableAddressModal
                    emailAddress={claimableAddress.email}
                    onClaim={() =>
                        handleClaimAddress({
                            account: claimableAddress.email,
                            importEmails: claimableAddress.importEmails,
                            importPeriod: claimableAddress.importPeriod,
                        })
                    }
                    {...claimableAddressModalProps}
                />
            )}
        </>
    );
};

export default ConnectGmailButton;
