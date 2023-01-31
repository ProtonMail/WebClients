import { c } from 'ttag';

import { ApiSyncState } from '@proton/activation/api/api.interface';
import { Badge } from '@proton/components';

interface Props {
    state: ApiSyncState;
}

const SyncRowStatus = ({ state }: Props) => {
    switch (state) {
        case ApiSyncState.ACTIVE:
            return <Badge type="primary">{c('Import status').t`Active`}</Badge>;
        case ApiSyncState.STOPPED:
            return <Badge type="warning">{c('Import status').t`Paused`}</Badge>;
    }

    return null;
};

export default SyncRowStatus;
