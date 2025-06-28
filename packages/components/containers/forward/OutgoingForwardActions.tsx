import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import { useGetAddressKeysByUsage } from '@proton/components/hooks/useGetAddressKeysByUsage';
import useGetPublicKeysForInbox from '@proton/components/hooks/useGetPublicKeysForInbox';
import useNotifications from '@proton/components/hooks/useNotifications';
import {
    deleteForwarding,
    pauseForwarding,
    resendForwardingInvitation,
    resumeForwarding,
    updateForwarding,
} from '@proton/shared/lib/api/forwardings';
import type { Address, OutgoingAddressForwarding, UserModel } from '@proton/shared/lib/interfaces';
import { ForwardingState, ForwardingType } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import useAddressFlags from '../../hooks/useAddressFlags';
import ConfirmDeleteForwarding from './ConfirmDeleteForwarding';
import ForwardModal from './ForwardModal';
import { getInternalParametersPrivate } from './helpers';

interface Props {
    existingForwardingConfig: OutgoingAddressForwarding;
    user: UserModel;
    addresses: Address[];
    isLastOutgoingNonE2EEForwarding: boolean;
}

const OutgoingForwardActions = ({
    user,
    existingForwardingConfig,
    addresses,
    isLastOutgoingNonE2EEForwarding,
}: Props) => {
    const isPending = existingForwardingConfig.State === ForwardingState.Pending;
    const isActive = existingForwardingConfig.State === ForwardingState.Active;
    const isPaused = existingForwardingConfig.State === ForwardingState.Paused;
    const isOutdated = existingForwardingConfig.State === ForwardingState.Outdated;
    const isRejected = existingForwardingConfig.State === ForwardingState.Rejected;
    const sentSuccessMessage = c('email_forwarding_2023: Success')
        .t`Email sent to ${existingForwardingConfig.ForwardeeEmail}`;
    const isInternal = existingForwardingConfig.Type === ForwardingType.InternalEncrypted;
    const isExternal = existingForwardingConfig.Type === ForwardingType.ExternalUnencrypted;
    const address = addresses.find((address) => address.ID === existingForwardingConfig.ForwarderAddressID) as Address;
    const pointToProton = address?.ProtonMX === true; // the domain's record point to Proton servers
    const reActivateE2EE = pointToProton && isLastOutgoingNonE2EEForwarding;

    const api = useApi();
    const addressFlags = useAddressFlags(address);
    const getPublicKeysForInbox = useGetPublicKeysForInbox();
    const getAddressKeysByUsage = useGetAddressKeysByUsage();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [forwardModal, showForwardModal] = useModalTwoStatic(ForwardModal);
    const [confirmDeleteModalProps, setConfirmDeleteModalOpen, renderConfirmDeleteModal] = useModalState();

    const handleDeleteForwarding = async () => {
        await api(deleteForwarding(existingForwardingConfig.ID));

        // Re-enable E2EE for this address if deleting last outgoing forwarding
        if (reActivateE2EE && addressFlags && addressFlags.data.isEncryptionDisabled) {
            await addressFlags.handleSetAddressFlags({
                encryptionDisabled: false,
                expectSignatureDisabled: addressFlags.data.isExpectSignatureDisabled,
            });
        }

        await call();
        setConfirmDeleteModalOpen(false);
        createNotification({ text: 'Forwarding deleted' });
    };

    const list = [
        user.hasPaidMail &&
            (isActive || isPending) && {
                text: c('email_forwarding_2023: Action').t`Edit conditions`,
                onClick: () => {
                    showForwardModal({ existingForwardingConfig });
                },
            },
        user.hasPaidMail &&
            isInternal &&
            isOutdated && {
                text: c('email_forwarding_2023: Action').t`Re-enable`,
                onClick: async () => {
                    // the primary keys might need fixing up, same as during initial forwarding setup
                    showForwardModal({ existingForwardingConfig });
                },
            },
        user.hasPaidMail &&
            isInternal &&
            isRejected && {
                text: c('email_forwarding_2023: Action').t`Request confirmation`,
                onClick: async () => {
                    const [forwarderAddressKeysByUsage, forwardeePublicKeys] = await Promise.all([
                        getAddressKeysByUsage({
                            AddressID: existingForwardingConfig.ForwarderAddressID,
                            // a primary v4 is expected here, but as sanity check
                            // we want the v6 key to be returned is present, so that
                            // the forwarding key generation will fail already client-side,
                            // instead of on the BE
                            withV6Support: true,
                        }),
                        getPublicKeysForInbox({ email: existingForwardingConfig.ForwardeeEmail, lifetime: 0 }),
                    ]);
                    const forwardeePrimaryPublicKey = forwardeePublicKeys.publicKeys[0].publicKey;
                    const { activationToken, forwardeeKey, proxyInstances } = await getInternalParametersPrivate(
                        forwarderAddressKeysByUsage.encryptionKey,
                        [
                            {
                                email: existingForwardingConfig.ForwardeeEmail,
                                name: existingForwardingConfig.ForwardeeEmail,
                            },
                        ],
                        forwardeePrimaryPublicKey
                    );
                    await api(
                        updateForwarding({
                            ID: existingForwardingConfig.ID,
                            ForwardeePrivateKey: forwardeeKey,
                            ActivationToken: activationToken,
                            ProxyInstances: proxyInstances,
                        })
                    );
                    await call();
                    createNotification({ text: sentSuccessMessage });
                },
            },
        user.hasPaidMail &&
            isExternal &&
            isRejected && {
                text: c('email_forwarding_2023: Action').t`Request confirmation`,
                onClick: async () => {
                    await api(resendForwardingInvitation(existingForwardingConfig.ID));
                    await call();
                    createNotification({ text: sentSuccessMessage });
                },
            },
        user.hasPaidMail &&
            isExternal &&
            isPending && {
                text: c('email_forwarding_2023: Action').t`Re-send confirmation email`,
                onClick: async () => {
                    await api(resendForwardingInvitation(existingForwardingConfig.ID));
                    await call();
                    createNotification({ text: sentSuccessMessage });
                },
            },
        user.hasPaidMail &&
            isActive && {
                text: c('email_forwarding_2023: Action').t`Pause`,
                onClick: async () => {
                    await api(pauseForwarding(existingForwardingConfig.ID));
                    await call();
                    createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding paused` });
                },
            },
        user.hasPaidMail &&
            isPaused && {
                text: c('email_forwarding_2023: Action').t`Resume`,
                onClick: async () => {
                    await api(resumeForwarding(existingForwardingConfig.ID));
                    await call();
                    createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding resumed` });
                },
            },
        {
            text: c('email_forwarding_2023: Action').t`Delete`,
            onClick: () => {
                setConfirmDeleteModalOpen(true);
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
            {renderConfirmDeleteModal ? (
                <ConfirmDeleteForwarding
                    modalProps={confirmDeleteModalProps}
                    onDelete={handleDeleteForwarding}
                    onClose={() => setConfirmDeleteModalOpen(false)}
                    reActivateE2EE={reActivateE2EE}
                />
            ) : null}
        </>
    );
};

export default OutgoingForwardActions;
