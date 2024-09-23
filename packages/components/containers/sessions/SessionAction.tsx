import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Badge from '@proton/components/components/badge/Badge';
import { useLoading } from '@proton/hooks';

import type { Session } from './interface';

interface Props {
    session: Session;
    onRevoke?: () => Promise<void>;
    currentUID: string;
}

const SessionAction = ({ session, onRevoke, currentUID }: Props) => {
    const [loading, withLoading] = useLoading();

    if (currentUID === session.UID) {
        return <Badge type="origin" className="mr-0">{c('Badge for user sessions table').t`Current session`}</Badge>;
    }

    if (!onRevoke) {
        return null;
    }

    return (
        <Button size="small" shape="outline" loading={loading} onClick={() => withLoading(onRevoke())}>
            {c('Action for user session').t`Revoke`}
        </Button>
    );
};

export default SessionAction;
