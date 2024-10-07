import { c } from 'ttag';

import { useInvitationsActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    invitationId: string;
    close: () => void;
}
export const AcceptButton = ({ invitationId, close }: Props) => {
    const { acceptInvitation } = useInvitationsActions();
    return (
        <ContextMenuButton
            icon="checkmark"
            name={c('Action').t`Accept`}
            action={() => acceptInvitation(new AbortController().signal, invitationId)}
            close={close}
            testId="shared-with-me-accept-invitation"
        />
    );
};
