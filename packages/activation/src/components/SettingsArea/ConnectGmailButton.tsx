import { useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '@proton/activation/src/constants';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus';
import useSetupGmailBYOEAddress from '@proton/activation/src/hooks/useSetupGmailBYOEAddress';
import type { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { setBYOEFlowResult } from '@proton/activation/src/logic/byoeFlow/byoeFlow.slice';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { changeCreateLoadingState } from '@proton/activation/src/logic/sync/sync.actions';
import { Button } from '@proton/atoms/Button/Button';
import { useModalState } from '@proton/components';
import useNotifications from '@proton/components/hooks/useNotifications.tsx';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import { useFlag } from '@proton/unleash/useFlag';

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
    const [hasAccessToBYOE, loadingBYOEFeatureStatus] = useBYOEFeatureStatus();
    const easySwitchDispatch = useEasySwitchDispatch();
    const createBYOEDisabled = useFlag('CreateInboxBringYourOwnEmailDisabled');

    const [user, loadingUser] = useUser();
    const [addresses, loadingAddresses] = useAddresses();

    const { activeBYOEAddresses, forwardingList, isLoadingAddressesCount } = useBYOEAddressesCounts();

    const [syncModalProps, setSyncModalOpen, renderSyncModal] = useModalState();
    const [reachedLimitForwardingModalProps, setReachedLimitForwardingModalOpen, renderReachedLimitForwardingModal] =
        useModalState();
    const [upsellForwardingModalProps, setUpsellForwardingModalOpen, renderUpsellForwardingModal] = useModalState();
    const [upsellConversionModalProps, setUpsellConversionModalOpen, renderUpsellConversionModal] = useModalState();
    const [conversionModalProps, setConversionModalOpen, renderConversionModal] = useModalState();
    const [removeForwardingModalProps, setRemoveForwardingModalOpen, renderRemoveForwardingModal] = useModalState();

    const [expectedEmailAddress, setExpectedEmailAddress] = useState<string | undefined>();

    const { isInMaintenance, handleBYOEWithImportCallback } = useSetupGmailBYOEAddress({
        showSuccessModal: (connectedAddress: string, importEmails: boolean) => {
            easySwitchDispatch(
                setBYOEFlowResult({
                    connectedAddress,
                    isPaid: hasPaidMail(user),
                    skipImport: !importEmails,
                })
            );
        },
        onComplete: () => {
            easySwitchDispatch(changeCreateLoadingState('idle'));
            setSyncModalOpen(false);
            setExpectedEmailAddress(undefined);
        },
        source,
    });

    const disabled =
        loadingUser || loadingAddresses || loadingBYOEFeatureStatus || isInMaintenance || isLoadingAddressesCount;

    const handleCloseForwardingModal = (hasError?: boolean) => {
        if (!hasError) {
            setSyncModalOpen(false);
        }
    };

    const handleAddForwarding = () => {
        if (!addresses) {
            return;
        }

        if (hasAccessToBYOE && createBYOEDisabled) {
            createNotification({
                type: 'info',
                text: c('Info').t`Temporarily unavailable due to high demand. Please try again later.`,
            });
            return;
        }

        // Users should see a limit or upsell modal if reaching the maximum of BYOE addresses included in their plan.
        if (!hasPaidMail(user) && activeBYOEAddresses.length >= MAX_SYNC_FREE_USER) {
            setUpsellForwardingModalOpen(true);
        } else if (activeBYOEAddresses.length >= MAX_SYNC_PAID_USER) {
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
        </>
    );
};

export default ConnectGmailButton;
