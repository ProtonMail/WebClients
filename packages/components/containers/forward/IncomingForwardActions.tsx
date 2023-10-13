import { c } from 'ttag';

import useLoading from '@proton/hooks/useLoading';
import { deleteForwarding, rejectForwarding } from '@proton/shared/lib/api/forwardings';
import { Address, ForwardingState, IncomingAddressForwarding } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { useKTVerifier } from '..';
import { DropdownActions } from '../../components';
import { useApi, useEventManager, useGetAddressKeys, useGetUser, useGetUserKeys, useNotifications } from '../../hooks';
import useVerifyOutboundPublicKeys from '../keyTransparency/useVerifyOutboundPublicKeys';
import { acceptIncomingForwarding } from './helpers';

interface Props {
    forward: IncomingAddressForwarding;
    addresses: Address[];
}

const IncomingForwardActions = ({ forward, addresses }: Props) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const getUserKeys = useGetUserKeys();
    const getUser = useGetUser();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(silentApi, getUser);
    const address = addresses.find(({ ID }) => ID === forward.ForwardeeAddressID);
    const getAddressKeys = useGetAddressKeys();
    const isPending = forward.State === ForwardingState.Pending;
    const isActive = forward.State === ForwardingState.Active;
    const isRejected = forward.State === ForwardingState.Rejected;
    const hasForwardingKeys = !!forward.ForwardingKeys?.length;

    const handleAccept = async () => {
        if (!address) {
            throw new Error('No address');
        }

        const [userKeys, addressKeys] = await Promise.all([getUserKeys(), getAddressKeys(address.ID)]);

        await acceptIncomingForwarding({
            api,
            userKeys,
            addressKeys,
            address,
            forward,
            keyTransparencyVerify,
            keyTransparencyCommit,
            verifyOutboundPublicKeys,
        });
        await call();
        createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding accepted` });
    };

    const handleDecline = async () => {
        await api(rejectForwarding(forward.ID));
        await call();
        createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding declined` });
    };

    const handleDelete = async () => {
        await api(deleteForwarding(forward.ID));
        await call();
        createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding deleted` });
    };

    const list = [
        isPending &&
            address &&
            hasForwardingKeys && {
                text: c('email_forwarding_2023: Action').t`Accept`,
                onClick: () => {
                    void withLoading(handleAccept());
                },
            },
        isPending && {
            text: c('email_forwarding_2023: Action').t`Decline`,
            onClick: async () => {
                void withLoading(handleDecline());
            },
        },
        (isActive || isRejected) && {
            text: c('email_forwarding_2023: Action').t`Delete`,
            onClick: async () => {
                void withLoading(handleDelete());
            },
        },
    ].filter(isTruthy);

    return <DropdownActions list={list} size="small" loading={loading} />;
};

export default IncomingForwardActions;
