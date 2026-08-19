import { c } from 'ttag';

import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';

import { ApiSyncState } from '../../../api/api.interface';

interface Props {
    state: ApiSyncState;
}

const SyncRowStatus = ({ state }: Props) => {
    switch (state) {
        case ApiSyncState.ACTIVE:
            return (
                <div className="inline-flex  gap-2 color-success items-center">
                    <IcCheckmarkCircleFilled />
                    {/* translator: When a forwarding in easy switch section is enabled */}
                    <span>{c('Import status').t`Active`}</span>
                </div>
            );
        case ApiSyncState.OFFLINE:
        case ApiSyncState.EXPIRED:
            {
                /* translator: When a forwarding in easy switch section is disabled (because permissions expired, account was disconnected, etc...) */
            }
            return <span className="color-weak">{c('Import status').t`Disabled`}</span>;
    }

    return null;
};

export default SyncRowStatus;
