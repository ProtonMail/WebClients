import { type FC, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { InviteStepResponse } from '@proton/pass/components/Invite/Steps/InviteStepResponse';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { getInvitedGroup } from '@proton/pass/lib/invites/invite.utils';
import { selectOrganizationGroups } from '@proton/pass/store/selectors';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import type { Invite, MaybeNull } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import type { Group } from '@proton/shared/lib/interfaces';

const getTexts = (invite: Invite, invitedGroup: MaybeNull<Group>) => {
    const { inviterEmail } = invite;

    if (invitedGroup) {
        return {
            content: c('Info').t`${inviterEmail} wants to share an item with the group ${invitedGroup.Name}.`,
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
    const groups = useSelector(selectOrganizationGroups);
    const invitedGroup = useMemo(() => getInvitedGroup(invite, groups), [groups, invite]);
    const invalid = !invite || invite.targetType !== ShareType.Item;

    useEffect(() => {
        if (invalid) onInviteResponse({ ok: false });
    }, [invalid]);

    if (invalid) return null;

    const { content, acceptText } = getTexts(invite, invitedGroup);

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
