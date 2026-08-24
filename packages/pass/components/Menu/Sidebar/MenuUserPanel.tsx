import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectPassPlan, selectPlanDisplayName, selectUser } from '../../../store/selectors';
import { UserPanel } from '../../Account/UserPanel';

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
