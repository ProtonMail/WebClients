import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { UserPanel } from '@proton/pass/components/Account/UserPanel';
import { selectPassPlan, selectPlanDisplayName, selectUser } from '@proton/pass/store/selectors';

export const MenuUserPanel = memo(() => {
    const user = useSelector(selectUser);
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);

    return (
        <UserPanel
            email={user?.Email ?? ''}
            name={user?.DisplayName ?? user?.Name ?? ''}
            plan={passPlan}
            planName={planDisplayName}
        />
    );
});

MenuUserPanel.displayName = 'MenuUserPanelMemo';
