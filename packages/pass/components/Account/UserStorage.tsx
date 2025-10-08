import { useSelector } from 'react-redux';

import Progress from '@proton/components/components/progress/Progress';
import { WithPaidUser } from '@proton/pass/components/Core/WithPaidUser';
import { selectUserStorageAllowed, selectUserStorageQuota, selectUserStorageUsed } from '@proton/pass/store/selectors';
import humanSize from '@proton/shared/lib/helpers/humanSize';

export const UserStorage = WithPaidUser(() => {
    const usedStorage = useSelector(selectUserStorageUsed);
    const maxStorage = useSelector(selectUserStorageQuota);
    const canUseStorage = useSelector(selectUserStorageAllowed);

    if (!maxStorage || !canUseStorage) return null;

    const used = humanSize({ bytes: usedStorage, unit: 'GB' });
    const available = humanSize({ bytes: maxStorage, unit: 'GB', fraction: 0 });

    return (
        <div className="flex pl-5 pr-7 mt-1">
            <Progress className="progress-bar--norm is-thin" value={usedStorage} max={maxStorage} />
            <div className="mt-1 text-xs color-weak">
                <b>{used}</b> / {available}
            </div>
        </div>
    );
});
