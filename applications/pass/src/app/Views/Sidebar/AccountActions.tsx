import { memo } from 'react';
import { useSelector } from 'react-redux';

import { AccountSwitcherTooltip } from 'proton-pass-web/app/Auth/AccountSwitcher';
import { useAvailableSessions } from 'proton-pass-web/app/Auth/AuthSwitchProvider';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { UserPanel } from '@proton/pass/components/Account/UserPanel';
import { selectPassPlan, selectPlanDisplayName, selectUser } from '@proton/pass/store/selectors';

export const AccountActions = memo(() => {
    const sessions = useAvailableSessions();

    const user = useSelector(selectUser);
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);

    return (
        <AccountSwitcherTooltip sessions={sessions}>
            {({ anchorRef, toggle }) => (
                <ButtonLike ref={anchorRef} onClick={toggle} shape="ghost" className="flex-1" size="small">
                    <UserPanel
                        email={user?.Email ?? ''}
                        name={user?.DisplayName ?? user?.Name ?? ''}
                        plan={passPlan}
                        planName={planDisplayName}
                    />
                </ButtonLike>
            )}
        </AccountSwitcherTooltip>
    );
});

AccountActions.displayName = 'AccountActionsMemo';
