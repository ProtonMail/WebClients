import { c } from 'ttag';

import Badge from '@proton/components/components/badge/Badge';
import type { IncomingAddressForwarding, OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingState } from '@proton/shared/lib/interfaces';

interface Props {
    forward: IncomingAddressForwarding | OutgoingAddressForwarding;
}

const ForwardStatus = ({ forward }: Props) => {
    if (forward.State === ForwardingState.Pending) {
        return (
            <Badge
                type="origin"
                tooltip={c('email_forwarding_2023: Info')
                    .t`Forwardee is invited and needs to accept/reject the invitation or update`}
            >{c('email_forwarding_2023: Status').t`Pending`}</Badge>
        );
    }
    if (forward.State === ForwardingState.Active) {
        return (
            <Badge type="success" tooltip={c('email_forwarding_2023: Info').t`Forwarding is active`}>{c(
                'email_forwarding_2023: Status'
            ).t`Active`}</Badge>
        );
    }
    if (forward.State === ForwardingState.Outdated) {
        return (
            <Badge type="warning" tooltip={c('email_forwarding_2023: Info').t`Please update your forwarding keys`}>{c(
                'email_forwarding_2023: Status'
            ).t`Outdated`}</Badge>
        );
    }
    if (forward.State === ForwardingState.Paused) {
        return (
            <Badge type="origin" tooltip={c('email_forwarding_2023: Info').t`The forwarding is temporarily paused`}>{c(
                'email_forwarding_2023: Status'
            ).t`Paused`}</Badge>
        );
    }
    if (forward.State === ForwardingState.Rejected) {
        return (
            <Badge
                type="origin"
                tooltip={c('email_forwarding_2023: Info').t`The forwardee rejected the forwarding request`}
            >{c('email_forwarding_2023: Status').t`Declined`}</Badge>
        );
    }
    return null;
};

export default ForwardStatus;
