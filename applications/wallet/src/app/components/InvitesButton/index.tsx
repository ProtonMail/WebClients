import { c, msgid } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import { useModalState, useModalStateWithData } from '@proton/components';
import { useAddresses } from '@proton/components/hooks';

import { Button } from '../../atoms';
import { useRemainingInvites, useWalletDispatch } from '../../store/hooks';
import { decrementAvailableInvites } from '../../store/slices/remainingInvites';
import { InviteModal } from '../InviteModal';
import { InviteSentConfirmModal } from '../InviteSentConfirmModal';

interface Props {
    walletAccount?: WasmApiWalletAccount;
}

export const InvitesButton = ({ walletAccount }: Props) => {
    const [addresses = []] = useAddresses();
    const [primaryAddress] = addresses;

    const [remainingInvites] = useRemainingInvites();
    const dispatch = useWalletDispatch();

    const [sendInviteModal, setSendInviteModal] = useModalState();
    const [inviteSentConfirmationModal, setInviteSentConfirmationModal] = useModalStateWithData<{ email: string }>();

    const address = walletAccount?.Addresses?.[0]?.ID ?? primaryAddress.ID;
    const availableInvites = remainingInvites?.available ?? 0;

    return (
        <>
            <Button
                size="small"
                shape="solid"
                color="norm"
                className="my-2 ml-2"
                onClick={() => {
                    setSendInviteModal(true);
                }}
                disabled={!availableInvites}
            >
                {c('Wallet invites').ngettext(
                    msgid`${availableInvites} invite left`,
                    `${availableInvites} invites left`,
                    availableInvites
                )}
            </Button>

            <InviteModal
                defaultInviterAddressID={address}
                onInviteSent={(email: string) => {
                    dispatch(decrementAvailableInvites());
                    sendInviteModal.onClose();
                    setInviteSentConfirmationModal({ email });
                }}
                {...sendInviteModal}
            />

            {inviteSentConfirmationModal.data && (
                <InviteSentConfirmModal
                    email={inviteSentConfirmationModal.data.email}
                    {...inviteSentConfirmationModal}
                />
            )}
        </>
    );
};
