import { memo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useUserInitiatedLock } from '../../../hooks/auth/useUserInitiatedLock';
import { LockMode } from '../../../lib/auth/lock/types';
import { offlineResume } from '../../../store/actions';
import { lockCreateRequest } from '../../../store/actions/requests';
import { selectLockMode, selectRequestInFlight } from '../../../store/selectors';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';

type Props = {
    onLock: () => void;
};

export const AuthActions = memo(({ onLock }: Props) => {
    const lockMode = useSelector(selectLockMode);
    const lockCreateInFlight = useSelector(selectRequestInFlight(lockCreateRequest()));
    const offlineResumeInFlight = useSelector(selectRequestInFlight(offlineResume.requestID()));
    const disabled = lockCreateInFlight || offlineResumeInFlight;
    const canLock = lockMode !== LockMode.NONE;

    const handleLock = useUserInitiatedLock(onLock);

    return (
        canLock && (
            <DropdownMenuButton
                onClick={handleLock}
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
