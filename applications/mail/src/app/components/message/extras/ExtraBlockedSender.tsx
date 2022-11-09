import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, useApi, useNotifications } from '@proton/components';
import { getBlockedIncomingDefaultByAddress } from '@proton/shared/lib/helpers/incomingDefaults';
import { getSender } from '@proton/shared/lib/mail/messages';

import {
    useIncomingDefaultsAddresses,
    useIncomingDefaultsStatus,
} from '../../../hooks/incomingDefaults/useIncomingDefaults';
import { remove } from '../../../logic/incomingDefaults/incomingDefaultsActions';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { useAppDispatch } from '../../../logic/store';

interface Props {
    message: MessageState;
}

const ExtraBlockedSender = ({ message }: Props) => {
    const api = useApi();
    const dispatch = useAppDispatch();
    const { createNotification } = useNotifications();

    const senderAddress = getSender(message.data)?.Address;

    const incomingDefaultsAddresses = useIncomingDefaultsAddresses();

    const incomingDefaultsStatus = useIncomingDefaultsStatus();

    const blockedIncomingDefault = getBlockedIncomingDefaultByAddress(incomingDefaultsAddresses, senderAddress || '');

    const handleUnblock = async () => {
        // Need to handle blocked by domain case
        if (!blockedIncomingDefault || !blockedIncomingDefault.Email) {
            return;
        }

        await dispatch(remove({ api, ID: blockedIncomingDefault.ID }));

        createNotification({
            text: c('Notification').t`Block removed`,
            type: 'success',
        });
    };

    return incomingDefaultsStatus === 'loaded' && blockedIncomingDefault ? (
        <div className="bg-norm rounded border pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 py0-25 mb0-85 flex flex-nowrap on-mobile-flex-column">
            <div className="flex-item-fluid flex flex-nowrap on-mobile-mb0-5">
                <Icon name="exclamation-circle-filled" className="mt0-4 flex-item-noshrink ml0-2" />
                <span className="pl0-5 pr0-5 flex flex-item-fluid flex-align-items-center">
                    {c('Info').t`Sender has been blocked.`}
                </span>
            </div>
            <span className="flex-item-noshrink flex-align-items-start flex on-mobile-w100 pt0-1">
                <Button
                    className="rounded-sm"
                    color="weak"
                    data-testid="block-sender:unblock"
                    onClick={handleUnblock}
                    shape="outline"
                    size="small"
                >
                    {c('Action').t`Allow messages`}
                </Button>
            </span>
        </div>
    ) : null;
};

export default ExtraBlockedSender;
