import { MouseEvent } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { useApi, useMailSettings, useNotifications } from '@proton/components/hooks';
import { updateBlockSenderConfirmation } from '@proton/shared/lib/api/mailSettings';
import { isAddressIncluded, isBlockedIncomingDefaultAddress } from '@proton/shared/lib/helpers/incomingDefaults';
import { BLOCK_SENDER_CONFIRMATION } from '@proton/shared/lib/mail/constants';

import BlockSenderModal from '../components/message/modals/BlockSenderModal';
import { blockAddress } from '../logic/incomingDefaults/incomingDefaultsActions';
import { MessageState } from '../logic/messages/messagesTypes';
import { useIncomingDefaultsAddresses, useIncomingDefaultsStatus } from './incomingDefaults/useIncomingDefaults';

interface Props {
    message?: MessageState;
    onCloseDropdown?: () => void;
}

const useBlockSender = ({ message, onCloseDropdown }: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [mailSettings] = useMailSettings();

    const incomingDefaultsAddresses = useIncomingDefaultsAddresses();
    const incomingDefaultsStatus = useIncomingDefaultsStatus();
    const isBlocked = isBlockedIncomingDefaultAddress(incomingDefaultsAddresses, message?.data?.Sender.Address || '');

    const [blockSenderModal, handleShowBlockSenderModal] = useModalTwo(BlockSenderModal);

    const senderEmail = message?.data?.Sender.Address;

    const handleBlockSender = async () => {
        if (!senderEmail) {
            return;
        }

        const foundItem = isAddressIncluded(incomingDefaultsAddresses, senderEmail);

        await dispatch(
            blockAddress({ api, address: senderEmail, ID: foundItem?.ID, type: foundItem ? 'update' : 'create' })
        );

        createNotification({ text: c('Notification').t`Sender ${senderEmail} blocked` });
    };

    // Modal confirmation
    const handleSubmitBlockSender = async (checked: boolean) => {
        const isSettingChecked = mailSettings?.BlockSenderConfirmation === 1;
        const confirmHasChanged = checked !== isSettingChecked;

        if (confirmHasChanged) {
            await api(updateBlockSenderConfirmation(checked ? BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK : null));
        }

        await handleBlockSender();
    };

    // Mail dropdown
    const handleClickBlockSender = async (event: MouseEvent) => {
        event.stopPropagation();

        // Close dropdown in order to
        // avoid modal and dropdown opened at same time
        onCloseDropdown?.();

        if (mailSettings?.BlockSenderConfirmation !== BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK) {
            await handleShowBlockSenderModal({ onConfirm: handleSubmitBlockSender, senderEmail, mailSettings });
        } else {
            void handleBlockSender();
        }
    };

    return { incomingDefaultsStatus, isBlocked, handleClickBlockSender, blockSenderModal };
};

export default useBlockSender;
