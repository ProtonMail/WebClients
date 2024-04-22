import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components';
import { useSessionLockConfirmContext } from '@proton/pass/components/Lock/LockConfirmContextProvider';
import { LockCreate } from '@proton/pass/components/Lock/LockCreate';
import { LockTTLUpdate } from '@proton/pass/components/Lock/LockTTLUpdate';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { sessionLockDisableIntent, sessionLockEnableIntent } from '@proton/pass/store/actions';
import { sessionLockDisableRequest, sessionLockEnableRequest } from '@proton/pass/store/actions/requests';
import { selectSessionLockSettings } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

export const PinLockSetting: FC = () => {
    const [lockCreationModalOpened, setLockCreationModalOpened] = useState(false);
    const { confirmPin } = useSessionLockConfirmContext();

    const { sessionLockRegistered, sessionLockTTL } = useSelector(selectSessionLockSettings);

    const enableLock = useActionRequest(sessionLockEnableIntent, { initialRequestId: sessionLockEnableRequest() });
    const disableLock = useActionRequest(sessionLockDisableIntent, { initialRequestId: sessionLockDisableRequest() });

    const loading = enableLock.loading || disableLock.loading;

    const handleSessionLockToggle = async () =>
        sessionLockRegistered
            ? confirmPin({
                  onSubmit: (pin) => {
                      disableLock.dispatch({ pin });
                  },
                  assistiveText: c('Info').t`Please confirm your PIN code in order to unregister your current lock.
                        ${PASS_APP_NAME} will then never lock.`,
              })
            : setLockCreationModalOpened(true);

    return (
        <SettingsPanel title={c('Label').t`Session locking`}>
            <Checkbox
                className="mb-4"
                checked={sessionLockRegistered}
                onChange={handleSessionLockToggle}
                loading={loading}
            >
                <span>
                    {c('Label').t`Auto-lock ${PASS_APP_NAME}`}
                    <span className="block color-weak text-sm">{c('Info')
                        .t`After inactivity, access to ${PASS_APP_NAME} will require a PIN code to unlock your session. You'll be logged out after 3 failed attempts.`}</span>
                </span>
            </Checkbox>

            <hr className="mt-2 mb-4 border-weak shrink-0" />

            <LockCreate
                opened={lockCreationModalOpened}
                onClose={() => setLockCreationModalOpened(false)}
                onSubmit={enableLock.dispatch}
            />

            <LockTTLUpdate
                ttl={sessionLockTTL}
                disabled={!sessionLockRegistered || loading}
                onChange={enableLock.dispatch}
            />
        </SettingsPanel>
    );
};
