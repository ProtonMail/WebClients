import React from 'react';
import { c } from 'ttag';

import { useLoading } from '../../hooks';
import { Badge, SmallButton } from '../../components';
import { Session } from './interface';

interface Props {
    session: Session;
    onRevoke?: () => Promise<void>;
    currentUID: string;
}

const SessionAction = ({ session, onRevoke, currentUID }: Props) => {
    const [loading, withLoading] = useLoading();

    if (currentUID === session.UID) {
        return <Badge>{c('Badge for user sessions table').t`Current session`}</Badge>;
    }

    if (!onRevoke) {
        return null;
    }

    return (
        <SmallButton loading={loading} onClick={() => withLoading(onRevoke())}>{c('Action for user session')
            .t`Revoke`}</SmallButton>
    );
};

export default SessionAction;
