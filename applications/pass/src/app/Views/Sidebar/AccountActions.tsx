import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { AccountSwitcherTooltip } from 'proton-pass-web/app/Auth/AccountSwitcher';
import { checkAuthSwitch, useAvailableSessions } from 'proton-pass-web/app/Auth/AuthSwitchProvider';

import { ButtonLike } from '@proton/atoms';
import { UserPanel } from '@proton/pass/components/Account/UserPanel';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { selectPassPlan, selectPlanDisplayName, selectUser } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import clsx from '@proton/utils/clsx';

export const AccountActions = memo(() => {
    const accountSwitchEnabled = useFeatureFlag(PassFeature.PassAccountSwitchV1);
    const authSwitchEnabled = useMemo(() => accountSwitchEnabled || checkAuthSwitch(), [accountSwitchEnabled]);
    const sessions = useAvailableSessions();

    const user = useSelector(selectUser);
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);

    return (
        <AccountSwitcherTooltip sessions={authSwitchEnabled ? sessions : []}>
            {({ anchorRef, toggle }) => (
                <ButtonLike
                    ref={anchorRef}
                    onClick={toggle}
                    shape="ghost"
                    className={clsx('flex-1', !authSwitchEnabled && 'pointer-events-none')}
                    size="small"
                >
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
