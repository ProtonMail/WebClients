import { c } from 'ttag';

import { Banner, Button } from '@proton/atoms';
import { Icon, useNotifications } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { getBlockedIncomingDefaultByAddress } from '@proton/shared/lib/helpers/incomingDefaults';
import { getSender } from '@proton/shared/lib/mail/messages';

import { useMailDispatch } from 'proton-mail/store/hooks';

import {
    useIncomingDefaultsAddresses,
    useIncomingDefaultsStatus,
} from '../../../../hooks/incomingDefaults/useIncomingDefaults';
import { remove } from '../../../../store/incomingDefaults/incomingDefaultsActions';

interface Props {
    message: MessageState;
}

const ExtraBlockedSender = ({ message }: Props) => {
    const dispatch = useMailDispatch();
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

        await dispatch(remove({ ID: blockedIncomingDefault.ID }));

        createNotification({
            text: c('Notification').t`Block removed`,
            type: 'success',
        });
    };

    return incomingDefaultsStatus === 'loaded' && blockedIncomingDefault ? (
        <Banner
            variant="norm-outline"
            icon={<Icon name="exclamation-triangle-filled" className="color-danger" />}
            action={
                <Button data-testid="block-sender:unblock" onClick={handleUnblock}>
                    {c('Action').t`Unblock`}
                </Button>
            }
        >
            {c('Info').t`Sender has been blocked.`}
        </Banner>
    ) : null;
};

export default ExtraBlockedSender;
