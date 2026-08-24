import { type FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { selectInviteByToken } from '../../../store/selectors/invites';
import type { Invite } from '../../../types';
import { ShareType } from '../../../types';
import { useMaybeGroup } from '../../Groups/GroupsProvider';
import { PassModal } from '../../Layout/Modal/PassModal';
import { useInviteActions } from '../InviteContext';
import { InviteStepResponse } from '../Steps/InviteStepResponse';

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
    /** Select once at mount: accepting removes the invite from Redux before
     * `onSuccess` fires — `useState` pins the value, `() => true` suppresses
     * store-triggered re-renders so the response flow can complete. */
    const [invite] = useState(useSelector(selectInviteByToken(token), () => true));
    const itemInvite = invite?.targetType === ShareType.Item ? invite : undefined;
    const { name, isGroup, groupIsLoading } = useMaybeGroup(invite?.invitedEmail, invite?.invitedGroupId);

    useEffect(() => {
        if (!itemInvite) onInviteResponse({ ok: false });
    }, []);

    if (!itemInvite || groupIsLoading) return null;

    const { content, acceptText } = getTexts(itemInvite, name, isGroup);

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
                <InviteStepResponse invite={itemInvite} acceptText={acceptText} />
            </ModalTwoFooter>
        </PassModal>
    );
};
