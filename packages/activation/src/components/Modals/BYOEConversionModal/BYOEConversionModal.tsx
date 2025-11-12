import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import {
    Loader,
    type ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    RadioGroup,
} from '@proton/components';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';

import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../../../constants';
import useBYOEAddressesCounts from '../../../hooks/useBYOEAddressesCounts';

interface Props extends ModalProps {
    openSyncModal: (expectedEmailAddress: string | undefined) => void;
    openUpsellModal: () => void;
    openRemoveForwardingModal: () => void;
}

const BYOEConversionModal = ({ openSyncModal, openUpsellModal, openRemoveForwardingModal, ...rest }: Props) => {
    const [user] = useUser();
    const { forwardingList, isLoadingAddressesCount, addressesOrSyncs } = useBYOEAddressesCounts();
    const [selectedForwarding, setSelectedForwarding] = useState<string | undefined>(undefined);

    // Init default selected forwarding once we have all data
    useEffect(() => {
        if (!isLoadingAddressesCount && selectedForwarding === undefined && forwardingList.length > 0) {
            setSelectedForwarding(forwardingList[0].account);
        }
    }, [selectedForwarding, setSelectedForwarding, forwardingList, isLoadingAddressesCount]);

    const canShowAddOtherButton = hasPaidMail(user)
        ? forwardingList.length < MAX_SYNC_PAID_USER
        : forwardingList.length < MAX_SYNC_FREE_USER;

    const handleConnectGmailAddress = (actionType: 'convert-to-byoe' | 'new-byoe') => {
        if (actionType === 'convert-to-byoe') {
            openSyncModal(selectedForwarding);
        } else {
            if (!hasPaidMail(user) && addressesOrSyncs.length >= MAX_SYNC_FREE_USER) {
                openUpsellModal();
            } else if (addressesOrSyncs.length >= MAX_SYNC_PAID_USER) {
                openRemoveForwardingModal();
            } else {
                openSyncModal(undefined);
            }
        }

        rest.onClose?.();
    };

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('loc_nightly: BYOE').t`Send and receive Gmail using ${MAIL_APP_NAME}`} />
            <ModalTwoContent>
                <p className="color-weak">
                    {forwardingList.length > 1
                        ? c('loc_nightly: BYOE')
                              .t`You already have Gmail addresses forwarding to ${MAIL_APP_NAME}. Connect one below to send and receive emails directly from ${MAIL_APP_NAME}.`
                        : c('loc_nightly: BYOE')
                              .t`You already have a Gmail address forwarding to ${MAIL_APP_NAME}. Connect it below to send and receive emails directly from ${MAIL_APP_NAME}.`}
                </p>
                {isLoadingAddressesCount && <Loader size="small" />}

                {!isLoadingAddressesCount && forwardingList.length === 1 && (
                    <div className="border border-none rounded bg-weak p-2 w-full inline-flex items-center">
                        <IcEnvelope className="color-primary mr-2" />
                        <span>{selectedForwarding}</span>
                    </div>
                )}

                {!isLoadingAddressesCount && forwardingList.length > 1 && (
                    <div>
                        <div className="text-bold mb-2" id="label-select-gmail">{c('loc_nightly: BYOE')
                            .t`Select which Gmail address to connect`}</div>
                        <RadioGroup
                            name="selected-address"
                            className="border border-none rounded bg-weak p-2 mb-2 w-full"
                            aria-describedby="label-select-gmail"
                            onChange={(v) => setSelectedForwarding(v)}
                            value={selectedForwarding}
                            options={forwardingList.map((option) => ({
                                value: option.account,
                                label: option.account,
                            }))}
                        />
                    </div>
                )}
            </ModalTwoContent>
            <ModalTwoFooter className="flex-column">
                <Button
                    color="norm"
                    onClick={() => handleConnectGmailAddress('convert-to-byoe')}
                    disabled={isLoadingAddressesCount}
                >
                    {c('Action').t`Use this Gmail address`}
                </Button>

                {canShowAddOtherButton && (
                    <Button
                        shape="underline"
                        onClick={() => handleConnectGmailAddress('new-byoe')}
                        disabled={isLoadingAddressesCount}
                        className="color-weak"
                    >
                        {c('Action').t`Or use a different Gmail address`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};
export default BYOEConversionModal;
