import { c } from 'ttag';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    invitationId: string;
    rejectInvitation: (invitationId: string) => Promise<void>;
    close: () => void;
}
export const DeclineButton = ({ rejectInvitation, invitationId, close }: Props) => {
    return (
        <ContextMenuButton
            icon="cross"
            name={c('Action').t`Decline`}
            action={() => rejectInvitation(invitationId)}
            close={close}
            testId="shared-with-me-decline-invitation"
        />
    );
};
