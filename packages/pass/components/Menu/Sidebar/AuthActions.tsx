import { memo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { offlineResume } from '@proton/pass/store/actions';
import { lockCreateRequest } from '@proton/pass/store/actions/requests';
import { selectLockMode, selectRequestInFlight } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type Props = { onLock: () => void };

export const AuthActions = memo(({ onLock }: Props) => {
    const lockMode = useSelector(selectLockMode);
    const lockCreateInFlight = useSelector(selectRequestInFlight(lockCreateRequest()));
    const offlineResumeInFlight = useSelector(selectRequestInFlight(offlineResume.requestID()));
    const disabled = lockCreateInFlight || offlineResumeInFlight;
    const canLock = lockMode !== LockMode.NONE;

    return (
        canLock && (
            <DropdownMenuButton
                onClick={onLock}
                disabled={disabled}
                label={c('Action').t`Lock ${PASS_APP_NAME}`}
                icon="lock"
                parentClassName="mx-3"
                className="rounded"
            />
        )
    );
});

AuthActions.displayName = 'AuthActionsMemo';
