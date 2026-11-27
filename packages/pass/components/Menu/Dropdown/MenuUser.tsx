import { memo } from 'react';
import { useSelector } from 'react-redux';

import { IcStar } from '@proton/icons/icons/IcStar';
import clsx from '@proton/utils/clsx';

import { UpsellRef } from '../../../constants';
import { useLessAggressiveUpsell } from '../../../hooks/useLessAggressiveUpsell';
import { isPaidPlan } from '../../../lib/user/user.predicates';
import { selectPassPlan, selectPlanDisplayName, selectUser } from '../../../store/selectors/user';
import { UpgradeButton } from '../../Upsell/UpgradeButton';
import { MenuUpsellCard } from '../Upsell/MenuUpsellCard';

export const MenuUser = memo(() => {
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const user = useSelector(selectUser);

    /** B2C only: the full-width upgrade button is replaced by a quieter
     * benefits card. B2B users keep the button. */
    const lessAggressiveUpsell = useLessAggressiveUpsell();

    return (
        <>
            <div className="flex items-center justify-space-between flex-nowrap gap-2 py-2 px-4">
                <span className={clsx('flex items-center flex-nowrap', isPaidPlan(passPlan) && 'ui-orange')}>
                    <IcStar className="mr-3" color="var(--interaction-norm)" />
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
                    {lessAggressiveUpsell ? (
                        <MenuUpsellCard />
                    ) : (
                        <UpgradeButton className="w-full" upsellRef={UpsellRef.MENU} />
                    )}
                </div>
            )}
        </>
    );
});

MenuUser.displayName = 'MenuUserMemo';
