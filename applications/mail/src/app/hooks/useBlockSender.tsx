import type { MouseEvent } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useApi } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { useNotifications } from '@proton/components/hooks';
import { updateBlockSenderConfirmation } from '@proton/shared/lib/api/mailSettings';
import { BLOCK_SENDER_CONFIRMATION } from '@proton/shared/lib/mail/constants';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch } from 'proton-mail/store/hooks';

import BlockSenderModal from '../components/message/modals/BlockSenderModal';
import { getSendersToBlock } from '../helpers/message/messageRecipients';
import type { Element } from '../models/element';
import { addBlockAddresses } from '../store/incomingDefaults/incomingDefaultsActions';
import { useIncomingDefaultsAddresses, useIncomingDefaultsStatus } from './incomingDefaults/useIncomingDefaults';

interface Props {
    elements: Element[];
    onCloseDropdown?: () => void;
}

const useBlockSender = ({ elements, onCloseDropdown }: Props) => {
    const api = useApi();
    const dispatch = useMailDispatch();
    const [addresses] = useAddresses();
    const mailSettings = useMailModel('MailSettings');
    const { createNotification } = useNotifications();

    const incomingDefaultsAddresses = useIncomingDefaultsAddresses();
    const incomingDefaultsStatus = useIncomingDefaultsStatus();

    const [blockSenderModal, handleShowBlockSenderModal] = useModalTwo(BlockSenderModal);

    const senders = useMemo(() => {
        return getSendersToBlock(elements, incomingDefaultsAddresses, addresses || []);
    }, [elements, incomingDefaultsAddresses, addresses]);

    // We can display the block sender option if:
    // 1 - The feature flag is enabled
    // 3 - Incoming defaults addresses are loaded
    // 2 - The sender is not already blocked => Should be filtered from senders
    // 4 - The message is not sent by the user, we don't want to block self addresses => Should be filtered from senders
    const canShowBlockSender = incomingDefaultsStatus === 'loaded' && senders.length > 0;

    const handleBlockSender = (): Promise<void> => {
        if (!senders || senders.length === 0) {
            return Promise.resolve();
        }

        const firstSenderAddress = senders[0]?.Address;

        // translator: The variable contains the address of the sender which will be blocked
        const successNotificationMessage =
            senders.length === 1
                ? c('Notification').t`Sender ${firstSenderAddress} blocked`
                : c('Notification').t`Senders blocked`;

        return dispatch(addBlockAddresses({ addresses: senders.map((sender) => sender.Address), overwrite: true }))
            .unwrap()
            .then(() => {
                createNotification({ text: successNotificationMessage });
            });
    };

    // Confirm blocking address from the modal
    const handleSubmitBlockSender = async (checked: boolean) => {
        const isSettingChecked = mailSettings.BlockSenderConfirmation === BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK;
        const confirmHasChanged = checked !== isSettingChecked;

        if (confirmHasChanged) {
            await api(updateBlockSenderConfirmation(checked ? BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK : null));
        }

        await handleBlockSender();
    };

    // The user click on block sender option/action
    const handleClickBlockSender = async (event?: MouseEvent) => {
        event?.stopPropagation();

        // Close dropdown in order to avoid having modal and dropdown opened at same time
        onCloseDropdown?.();

        if (mailSettings.BlockSenderConfirmation !== BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK) {
            await handleShowBlockSenderModal({ onConfirm: handleSubmitBlockSender, senders, mailSettings });
        } else {
            void handleBlockSender();
        }
    };

    return { canShowBlockSender, incomingDefaultsStatus, handleClickBlockSender, blockSenderModal };
};

export default useBlockSender;
