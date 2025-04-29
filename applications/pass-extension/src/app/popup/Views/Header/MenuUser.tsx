import { memo } from 'react';
import { useSelector } from 'react-redux';

import { Icon } from '@proton/components';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectPassPlan, selectPlanDisplayName, selectUser } from '@proton/pass/store/selectors';
import clsx from '@proton/utils/clsx';

export const MenuUser = memo(() => {
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const user = useSelector(selectUser);

    return (
        <>
            <div className="flex items-center justify-space-between flex-nowrap gap-2 py-2 px-4">
                <span className={clsx('flex items-center flex-nowrap', isPaidPlan(passPlan) && 'ui-orange')}>
                    <Icon name="star" className="mr-3" color="var(--interaction-norm)" />
                    <span className="text-left">
                        <div className="text-sm text-ellipsis">{user?.Email}</div>
                        <div className="text-sm" style={{ color: 'var(--interaction-norm)' }}>
                            {planDisplayName}
                        </div>
                    </span>
                </span>
            </div>

            {!isPaidPlan(passPlan) && BUILD_TARGET !== 'safari' && (
                <div className="pb-2 px-4">
                    <UpgradeButton className="w-full" upsellRef={UpsellRef.MENU} />
                </div>
            )}
        </>
    );
});

MenuUser.displayName = 'MenuUserMemo';
