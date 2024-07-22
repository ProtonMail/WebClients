import { c, msgid } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import { useModalState } from '@proton/components/components';
import { useAddresses } from '@proton/components/hooks';

import { Button } from '../../atoms';
import { useRemainingInvites, useWalletDispatch } from '../../store/hooks';
import { decrementAvailableInvites } from '../../store/slices/remainingInvites';
import { InviteModal } from '../InviteModal';

interface Props {
    walletAccount?: WasmApiWalletAccount;
}

export const InvitesButton = ({ walletAccount }: Props) => {
    const [addresses = []] = useAddresses();
    const [primaryAddress] = addresses;

    const [remainingInvites] = useRemainingInvites();
    const dispatch = useWalletDispatch();

    const [modal, setModal] = useModalState();

    const address = walletAccount?.Addresses[0].ID ?? primaryAddress.ID;

    const availableInvites = remainingInvites?.available ?? 0;

    return (
        <>
            <Button
                size="small"
                shape="solid"
                color="norm"
                className="my-2 ml-2"
                onClick={() => {
                    setModal(true);
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
                inviterAddressID={address}
                onInviteSent={() => {
                    dispatch(decrementAvailableInvites());
                }}
                {...modal}
            />
        </>
    );
};
