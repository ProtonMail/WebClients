import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import {
    deleteForwarding,
    requestConfirmation,
    resendForwardingInvitation,
    toggleForwardingInvitation,
} from '@proton/mail/store/forwarding/outgoingForwardingActions';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { Address, OutgoingAddressForwarding, UserModel } from '@proton/shared/lib/interfaces';
import { ForwardingState, ForwardingType } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import ConfirmDeleteForwarding from './ConfirmDeleteForwarding';
import ForwardModal from './ForwardModal';

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

    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();
    const [forwardModal, showForwardModal] = useModalTwoStatic(ForwardModal);
    const [confirmDeleteModalProps, setConfirmDeleteModalOpen, renderConfirmDeleteModal] = useModalState();

    const handleDeleteForwarding = async () => {
        try {
            await dispatch(deleteForwarding({ address, forward: existingForwardingConfig, reActivateE2EE }));
            setConfirmDeleteModalOpen(false);
            createNotification({ text: 'Forwarding deleted' });
        } catch (e) {
            handleError(e);
        }
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
                    try {
                        await dispatch(requestConfirmation({ forward: existingForwardingConfig }));
                        createNotification({ text: sentSuccessMessage });
                    } catch (e) {
                        handleError(e);
                    }
                },
            },
        user.hasPaidMail &&
            isExternal &&
            isRejected && {
                text: c('email_forwarding_2023: Action').t`Request confirmation`,
                onClick: async () => {
                    try {
                        await dispatch(resendForwardingInvitation({ forward: existingForwardingConfig }));
                        createNotification({ text: sentSuccessMessage });
                    } catch (e) {
                        handleError(e);
                    }
                },
            },
        user.hasPaidMail &&
            isExternal &&
            isPending && {
                text: c('email_forwarding_2023: Action').t`Re-send confirmation email`,
                onClick: async () => {
                    try {
                        await dispatch(resendForwardingInvitation({ forward: existingForwardingConfig }));
                        createNotification({ text: sentSuccessMessage });
                    } catch (e) {
                        handleError(e);
                    }
                },
            },
        user.hasPaidMail &&
            isActive && {
                text: c('email_forwarding_2023: Action').t`Pause`,
                onClick: async () => {
                    try {
                        await dispatch(
                            toggleForwardingInvitation({ forward: existingForwardingConfig, enabled: false })
                        );
                        createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding paused` });
                    } catch (e) {
                        handleError(e);
                    }
                },
            },
        user.hasPaidMail &&
            isPaused && {
                text: c('email_forwarding_2023: Action').t`Resume`,
                onClick: async () => {
                    try {
                        await dispatch(
                            toggleForwardingInvitation({ forward: existingForwardingConfig, enabled: true })
                        );
                        createNotification({ text: c('email_forwarding_2023: Success').t`Forwarding resumed` });
                    } catch (e) {
                        handleError(e);
                    }
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
