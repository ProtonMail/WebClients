import { type FC } from 'react';

import { c } from 'ttag';

import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { InviteStepResponse } from '@proton/pass/components/Invite/Steps/InviteStepResponse';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import type { ItemInvite } from '@proton/pass/types/data/invites';

export const ItemInviteRespond: FC<ItemInvite> = (invite) => {
    const { inviterEmail } = invite;
    const { onInviteResponse } = useInviteActions();

    return (
        <PassModal
            size="small"
            open
            onClose={() => onInviteResponse({ ok: false, error: null })}
            enableCloseWhenClickOutside
        >
            <ModalTwoHeader
                className="text-center text-break-all"
                hasClose={false}
                title={c('Info').t`Shared item invitation`}
            />

            <ModalTwoContent className="text-center">
                {c('Info').t`${inviterEmail} wants to share an item with you.`}
            </ModalTwoContent>

            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                <InviteStepResponse
                    invite={invite}
                    acceptText={c('Action').t`Accept and view the item`}
                    limitText={c('Warning').t`You have reached the limit of shared items you can have in your plan.`}
                />
            </ModalTwoFooter>
        </PassModal>
    );
};
