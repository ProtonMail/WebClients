import { type FC, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { InviteStepResponse } from '@proton/pass/components/Invite/Steps/InviteStepResponse';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import { ShareType } from '@proton/pass/types';

type Props = { token: string };

export const ItemInviteRespond: FC<Props> = ({ token }) => {
    const { onInviteResponse } = useInviteActions();
    const invite = useSelector(selectInviteByToken(token));
    const invalid = !invite || invite.targetType !== ShareType.Item;

    useEffect(() => {
        if (invalid) onInviteResponse({ ok: false });
    }, [invalid]);

    if (invalid) return null;
    const { inviterEmail } = invite;

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
                <InviteStepResponse invite={invite} acceptText={c('Action').t`Accept and view the item`} />
            </ModalTwoFooter>
        </PassModal>
    );
};
