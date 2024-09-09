import { c } from 'ttag';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    invitationId: string;
    acceptInvitation: (invitationId: string) => Promise<void>;
    close: () => void;
}
export const AcceptButton = ({ acceptInvitation, invitationId, close }: Props) => {
    return (
        <ContextMenuButton
            icon="checkmark"
            name={c('Action').t`Accept`}
            action={() => acceptInvitation(invitationId)}
            close={close}
            testId="shared-with-me-accept-invitation"
        />
    );
};
