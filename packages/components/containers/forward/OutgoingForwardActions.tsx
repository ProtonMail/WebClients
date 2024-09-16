import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import {
    deleteForwarding,
    pauseForwarding,
    resendForwardingInvitation,
    resumeForwarding,
} from '@proton/shared/lib/api/forwardings';
import type { Address, OutgoingAddressForwarding, UserModel } from '@proton/shared/lib/interfaces';
import { ForwardingState, ForwardingType } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { useModalState, useModalTwoStatic } from '../../components';
import {
    useActiveBreakpoint,
    useAddressFlags,
    useApi,
    useEventManager,
    useGetAddressKeys,
    useGetPublicKeysForInbox,
    useNotifications,
} from '../../hooks';
import ConfirmDeleteForwarding from './ConfirmDeleteForwarding';
import ForwardModal from './ForwardModal';
import { enableForwarding, isLastOutgoingNonE2EEForwarding } from './helpers';

interface Props {
    forward: OutgoingAddressForwarding;
    user: UserModel;
    forwardings: OutgoingAddressForwarding[];
    addresses: Address[];
}

const OutgoingForwardActions = ({ user, forward, addresses, forwardings }: Props) => {
    const isPending = forward.State === ForwardingState.Pending;
    const isActive = forward.State === ForwardingState.Active;
    const isPaused = forward.State === ForwardingState.Paused;
    const isOutdated = forward.State === ForwardingState.Outdated;
    const isRejected = forward.State === ForwardingState.Rejected;
    const sentSuccessMessage = c('email_forwarding_2023: Success').t`Email sent to ${forward.ForwardeeEmail}`;
    const isInternal = forward.Type === ForwardingType.InternalEncrypted;
    const isExternal = forward.Type === ForwardingType.ExternalUnencrypted;
    const address = addresses.find((address) => address.ID === forward.ForwarderAddressID) as Address;
    const isLast = isLastOutgoingNonE2EEForwarding(forward, forwardings);
    const pointToProton = address?.ProtonMX === true; // the domain's record point to Proton servers
    const reActivateE2EE = pointToProton && isLast;

    const api = useApi();
    const addressFlags = useAddressFlags(address);
    const getPublicKeysForInbox = useGetPublicKeysForInbox();
    const getAddressKeys = useGetAddressKeys();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [forwardModal, showForwardModal] = useModalTwoStatic(ForwardModal);
    const [confirmModalProps, setConfirmModalOpen, renderConfirmModal] = useModalState();

    const handleDeleteForwarding = async () => {
        await api(deleteForwarding(forward.ID));

        // Re-enable E2EE for this address if deleting last outgoing forwarding
        if (reActivateE2EE && addressFlags && addressFlags.encryptionDisabled) {
            await addressFlags.handleSetAddressFlags(false, addressFlags.expectSignatureDisabled);
        }

        await call();
        setConfirmModalOpen(false);
        createNotification({ text: 'Forwarding deleted' });
    };

    const list = [
        user.hasPaidMail && {
            text: c('email_forwarding_2023: Action').t`Edit conditions`,
            onClick: () => {
                showForwardModal({ forward });
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
                        getPublicKeysForInbox({ email: forward.ForwardeeEmail, lifetime: 0 }),
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

    const { viewportWidth } = useActiveBreakpoint();

    return (
        <>
            <DropdownActions
                iconName={viewportWidth['>=large'] ? 'three-dots-vertical' : undefined}
                list={list}
                size="small"
                shape="ghost"
            />
            {forwardModal}
            {renderConfirmModal ? (
                <ConfirmDeleteForwarding
                    modalProps={confirmModalProps}
                    onDelete={handleDeleteForwarding}
                    onClose={() => setConfirmModalOpen(false)}
                    reActivateE2EE={reActivateE2EE}
                />
            ) : null}
        </>
    );
};

export default OutgoingForwardActions;
