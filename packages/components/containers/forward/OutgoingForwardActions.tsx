import { c } from 'ttag';

import {
    deleteForwarding,
    pauseForwarding,
    resendForwardingInvitation,
    resumeForwarding,
} from '@proton/shared/lib/api/forwardings';
import { ForwardingState, ForwardingType, OutgoingAddressForwarding, UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { DropdownActions, useModalState, useModalTwo } from '../../components';
import { useApi, useEventManager, useGetAddressKeys, useGetPublicKeys, useNotifications } from '../../hooks';
import ConfirmDeleteForwarding from './ConfirmDeleteForwarding';
import ForwardModal from './ForwardModal';
import { enableForwarding } from './helpers';

interface Props {
    forward: OutgoingAddressForwarding;
    user: UserModel;
}

const OutgoingForwardActions = ({ user, forward }: Props) => {
    const isPending = forward.State === ForwardingState.Pending;
    const isActive = forward.State === ForwardingState.Active;
    const isPaused = forward.State === ForwardingState.Paused;
    const isOutdated = forward.State === ForwardingState.Outdated;
    const isRejected = forward.State === ForwardingState.Rejected;
    const sentSuccessMessage = c('email_forwarding_2023: Success').t`Email sent to ${forward.ForwardeeEmail}`;
    const isInternal = forward.Type === ForwardingType.InternalEncrypted;
    const isExternal = forward.Type === ForwardingType.ExternalUnencrypted;

    const api = useApi();
    const getPublicKeys = useGetPublicKeys();
    const getAddressKeys = useGetAddressKeys();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [forwardModal, showModal] = useModalTwo(ForwardModal);
    const [confirmModalProps, setConfirmModalOpen, renderConfirmModal] = useModalState();

    const handleDeleteForwarding = async () => {
        await api(deleteForwarding(forward.ID));
        await call();
        setConfirmModalOpen(false);
        createNotification({ text: 'Forwarding deleted' });
    };

    const list = [
        user.hasPaidMail && {
            text: c('email_forwarding_2023: Action').t`Edit conditions`,
            onClick: () => {
                void showModal({ forward });
            },
        },
        user.hasPaidMail &&
            isInternal &&
            (isOutdated || isRejected) && {
                text: isOutdated
                    ? c('email_forwarding_2023: Action').t`Re-enable`
                    : c('email_forwarding_2023: Action').t`Request confirmation`,
                onClick: async () => {
                    const [forwarderAddressKeys, forwardeePublicKeys] = await Promise.all([
                        getAddressKeys(forward.ForwarderAddressID),
                        getPublicKeys(forward.ForwardeeEmail),
                    ]);
                    await enableForwarding({
                        api,
                        forwarderAddressKeys,
                        forwardeePublicKeys,
                        forward,
                    });
                    await call();
                    createNotification({ text: sentSuccessMessage });
                },
            },
        user.hasPaidMail &&
            isExternal &&
            isRejected && {
                text: c('email_forwarding_2023: Action').t`Request confirmation`,
                onClick: async () => {
                    await api(resendForwardingInvitation(forward.ID));
                    await call();
                    createNotification({ text: sentSuccessMessage });
                },
            },
        user.hasPaidMail &&
            isExternal &&
            isPending && {
                text: c('email_forwarding_2023: Action').t`Re-send confirmation email`,
                onClick: async () => {
                    await api(resendForwardingInvitation(forward.ID));
                    await call();
                    createNotification({ text: sentSuccessMessage });
                },
            },
        user.hasPaidMail &&
            isActive && {
                text: c('email_forwarding_2023: Action').t`Pause`,
                onClick: async () => {
                    await api(pauseForwarding(forward.ID));
                    await call();
                    createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding paused` });
                },
            },
        user.hasPaidMail &&
            isPaused && {
                text: c('email_forwarding_2023: Action').t`Resume`,
                onClick: async () => {
                    await api(resumeForwarding(forward.ID));
                    await call();
                    createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding resumed` });
                },
            },
        {
            text: c('email_forwarding_2023: Action').t`Delete`,
            onClick: () => {
                setConfirmModalOpen(true);
            },
        },
    ].filter(isTruthy);

    return (
        <>
            <DropdownActions iconName="three-dots-vertical" list={list} size="small" shape="ghost" />
            {forwardModal}
            {renderConfirmModal ? (
                <ConfirmDeleteForwarding
                    modalProps={confirmModalProps}
                    onDelete={handleDeleteForwarding}
                    onClose={() => setConfirmModalOpen(false)}
                />
            ) : null}
        </>
    );
};

export default OutgoingForwardActions;
