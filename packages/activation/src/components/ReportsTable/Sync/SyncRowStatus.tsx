import { c } from 'ttag';

import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';

interface Props {
    state: ApiSyncState;
}

const SyncRowStatus = ({ state }: Props) => {
    switch (state) {
        case ApiSyncState.ACTIVE:
            return (
                <div className="inline-flex  gap-2 color-success items-center">
                    <IcCheckmarkCircleFilled />
                    <span>{c('Import status').t`Active`}</span>
                </div>
            );
        case ApiSyncState.OFFLINE:
        case ApiSyncState.EXPIRED:
            return <span className="color-weak">{c('Import status').t`Disabled`}</span>;
    }

    return null;
};

export default SyncRowStatus;
