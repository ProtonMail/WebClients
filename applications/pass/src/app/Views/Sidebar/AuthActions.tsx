import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { selectLockMode } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const AuthActions = memo(() => {
    const authService = useAuthService();
    const lockMode = useSelector(selectLockMode);
    const canLock = lockMode !== LockMode.NONE;

    return (
        canLock && (
            <DropdownMenuButton
                onClick={() =>
                    authService.lock(lockMode, {
                        broadcast: true,
                        soft: false,
                        userInitiated: true,
                    })
                }
                label={c('Action').t`Lock ${PASS_APP_NAME}`}
                icon="lock"
                parentClassName="mx-3"
                className="rounded"
            />
        )
    );
});

AuthActions.displayName = 'AuthActionsMemo';
