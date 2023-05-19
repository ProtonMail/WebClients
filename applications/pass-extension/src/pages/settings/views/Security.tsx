import { type VFC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { Checkbox } from '@proton/components';
import { selectRequestInFlight, selectSessionLockSettings, sessionLockDisableIntent } from '@proton/pass/store';
import { settingsEdit } from '@proton/pass/store/actions/requests';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useSessionLockConfirmContext } from '../../../shared/components/session-lock/SessionLockConfirmContextProvider';
import { SessionLockCreate } from '../../../shared/components/session-lock/SessionLockCreate';
import { SessionLockTTLUpdate } from '../../../shared/components/session-lock/SessionLockTTLUpdate';

export const Security: VFC = () => {
    const dispatch = useDispatch();

    const [lockCreationModalOpened, setLockCreationModalOpened] = useState(false);
    const { confirmPin } = useSessionLockConfirmContext();

    const { sessionLockToken, sessionLockTTL } = useSelector(selectSessionLockSettings);
    const sessionLockLoading = useSelector(selectRequestInFlight(settingsEdit('session-lock')));

    const hasLock = sessionLockToken !== undefined;

    const handleSessionLockToggle = async () =>
        hasLock
            ? confirmPin({
                  onSubmit: (pin) => dispatch(sessionLockDisableIntent({ pin })),
                  assistiveText: c('Info').t`Please confirm your PIN code in order to unregister your current lock.
                        ${PASS_APP_NAME} will then never lock.`,
              })
            : setLockCreationModalOpened(true);

    return (
        <Card rounded className="mb-4 p-3 relative">
            <strong className="color-norm block">{c('Label').t`Session locking`}</strong>

            <hr className="my-2 border-weak" />

            <Checkbox
                className="mb-4"
                checked={hasLock}
                onChange={handleSessionLockToggle}
                loading={sessionLockLoading}
            >
                <span className="ml-3">
                    {c('Label').t`Auto-lock ${PASS_APP_NAME}`}
                    <span className="block color-weak text-sm">{c('Info')
                        .t`Access to ${PASS_APP_NAME} will require a pin code to unlock your session`}</span>
                </span>
            </Checkbox>

            <SessionLockCreate opened={lockCreationModalOpened} onClose={() => setLockCreationModalOpened(false)} />
            <SessionLockTTLUpdate ttl={sessionLockTTL} disabled={!hasLock || sessionLockLoading} />
        </Card>
    );
};
