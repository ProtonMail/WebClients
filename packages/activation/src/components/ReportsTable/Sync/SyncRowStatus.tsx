import { c } from 'ttag';

import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import { Badge } from '@proton/components';

interface Props {
    state: ApiSyncState;
}

const SyncRowStatus = ({ state }: Props) => {
    switch (state) {
        case ApiSyncState.ACTIVE:
            return <Badge type="primary">{c('Import status').t`Active`}</Badge>;
        case ApiSyncState.OFFLINE:
        case ApiSyncState.EXPIRED:
            return <Badge type="warning">{c('Import status').t`Paused`}</Badge>;
    }

    return null;
};

export default SyncRowStatus;
