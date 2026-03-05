import { type FC, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useMaybeGroup } from '@proton/pass/components/Groups/GroupsProvider';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { InviteStepResponse } from '@proton/pass/components/Invite/Steps/InviteStepResponse';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import type { Invite } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';

const getTexts = (invite: Invite, name: string, isGroup: boolean) => {
    const { inviterEmail } = invite;

    if (isGroup) {
        return {
            content: c('Info').t`${inviterEmail} wants to share an item with the group ${name}.`,
            acceptText: c('Action').t`Accept invitation`,
        };
    }

    return {
        content: c('Info').t`${inviterEmail} wants to share an item with you.`,
        acceptText: c('Action').t`Accept and view the item`,
    };
};

type Props = { token: string };

export const ItemInviteRespond: FC<Props> = ({ token }) => {
    const { onInviteResponse } = useInviteActions();
    const invite = useSelector(selectInviteByToken(token));
    const { name, isGroup } = useMaybeGroup(invite?.invitedEmail);
    const invalid = !invite || invite.targetType !== ShareType.Item;

    useEffect(() => {
        if (invalid) onInviteResponse({ ok: false });
    }, [invalid]);

    if (invalid) return null;

    const { content, acceptText } = getTexts(invite, name, isGroup);

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

            <ModalTwoContent className="text-center">{content}</ModalTwoContent>

            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                <InviteStepResponse invite={invite} acceptText={acceptText} />
            </ModalTwoFooter>
        </PassModal>
    );
};
