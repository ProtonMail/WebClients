import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import {
    acceptForwarding,
    declineForwarding,
    deleteForwarding,
} from '@proton/mail/store/forwarding/incomingForwardingActions';
import { useDispatch } from '@proton/redux-shared-store';
import type { Address, IncomingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingState } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

interface Props {
    forward: IncomingAddressForwarding;
    addresses: Address[];
}

const IncomingForwardActions = ({ forward, addresses }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const address = addresses.find(({ ID }) => ID === forward.ForwardeeAddressID);
    const isPending = forward.State === ForwardingState.Pending;
    const isActive = forward.State === ForwardingState.Active;
    const isRejected = forward.State === ForwardingState.Rejected;
    const hasForwardingKeys = !!forward.ForwardingKeys?.length;
    const handleError = useErrorHandler();

    const handleAccept = async () => {
        if (!address) {
            throw new Error('No address');
        }
        await dispatch(acceptForwarding({ address, forward }));
        createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding accepted` });
    };

    const handleDecline = async () => {
        await dispatch(declineForwarding({ forward }));
        createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding declined` });
    };

    const handleDelete = async () => {
        await dispatch(deleteForwarding({ forward }));
        createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding deleted` });
    };

    const list = [
        isPending &&
            address &&
            hasForwardingKeys && {
                text: c('email_forwarding_2023: Action').t`Accept`,
                onClick: () => {
                    void withLoading(handleAccept()).catch(handleError);
                },
            },
        isPending && {
            text: c('email_forwarding_2023: Action').t`Decline`,
            onClick: async () => {
                void withLoading(handleDecline()).catch(handleError);
            },
        },
        (isActive || isRejected) && {
            text: c('email_forwarding_2023: Action').t`Delete`,
            onClick: async () => {
                void withLoading(handleDelete()).catch(handleError);
            },
        },
    ].filter(isTruthy);

    return <DropdownActions list={list} size="small" loading={loading} />;
};

export default IncomingForwardActions;
