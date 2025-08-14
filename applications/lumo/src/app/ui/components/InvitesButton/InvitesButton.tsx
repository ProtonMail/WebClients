import clsx from 'clsx';
import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Button } from '@proton/atoms';
import useModalState, { useModalStateWithData } from '@proton/components/components/modalTwo/useModalState';

import { useLumoDispatch } from '../../../redux/hooks';
import { useRemainingInvites } from '../../../redux/hooks/useRemainingInvites';
import { decrementAvailableInvites } from '../../../redux/slices/meta/remainingInvites';
import { InviteModal } from '../InviteModal';
import { InviteSuccessModal } from '../InviteSucccessModal';

export const InvitesButton = ({ isSidebar = false }: { isSidebar?: boolean }) => {
    const [addresses = []] = useAddresses();
    const [primaryAddress] = addresses;

    const [remainingInvites] = useRemainingInvites();
    const dispatch = useLumoDispatch();

    const [sendInviteModal, setSendInviteModal] = useModalState();
    const [inviteSentConfirmationModal, setInviteSentConfirmationModal] = useModalStateWithData<{ email: string }>();

    const address = primaryAddress.ID; //check this
    const availableInvites = remainingInvites?.remaining ?? 0;

    return (
        <>
            <Button
                size={isSidebar ? 'medium' : 'small'}
                shape="solid"
                color="norm"
                onClick={() => {
                    setSendInviteModal(true);
                }}
                disabled={!availableInvites}
                className={clsx(isSidebar, 'w-full')}
            >
                {c('collider_2025: Invite Button').t`Invite friends`}
            </Button>

            <InviteModal
                defaultInviterAddressID={address}
                remainingInvites={availableInvites}
                onInviteSent={(email: string) => {
                    dispatch(decrementAvailableInvites());
                    sendInviteModal.onClose();
                    setInviteSentConfirmationModal({ email });
                }}
                {...sendInviteModal}
            />

            {inviteSentConfirmationModal.data && (
                <InviteSuccessModal
                    email={inviteSentConfirmationModal.data.email}
                    remainingInvites={availableInvites}
                    {...inviteSentConfirmationModal}
                />
            )}
        </>
    );
};
